const { AppError } = require('../utils/AppError');

const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineDistanceKm(from, to) {
  const latitudeA = Number(from.latitude);
  const longitudeA = Number(from.longitude);
  const latitudeB = Number(to.latitude);
  const longitudeB = Number(to.longitude);

  if (![latitudeA, longitudeA, latitudeB, longitudeB].every(Number.isFinite)) {
    throw new AppError('Tọa độ không hợp lệ', 400);
  }

  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Number((EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

function estimateTravelTimes(distanceKm) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const minutesAt = (kmPerHour) => Math.max(1, Math.round((distance / kmPerHour) * 60));
  return {
    walkingMinutes: minutesAt(4.5),
    bicycleMinutes: minutesAt(14),
    motorbikeMinutes: minutesAt(28)
  };
}

function roomMatchScore(room, preference, distanceKm = null) {
  const reasons = [];
  const budgetMin = Number(preference.budgetMin ?? 0);
  const budgetMax = Number(preference.budgetMax ?? Number.MAX_SAFE_INTEGER);
  const preferredArea = Number(preference.preferredArea ?? room.area);
  const requiredAmenities = new Set(preference.amenityIds || []);
  const amenityRows = room.roomAmenities || room.amenities || [];
  const roomAmenities = new Set(amenityRows.map((item) => item.amenityId || item.id || (item.amenity && item.amenity.id)));
  const averageRating = Number(room.averageRating ?? room.averageRatingValue ?? 0);

  let score = 0;
  if (Number(room.price) >= budgetMin && Number(room.price) <= budgetMax) {
    score += 30;
    reasons.push('Giá nằm trong ngân sách');
  } else {
    const nearestBudget = Number(room.price) < budgetMin ? budgetMin : budgetMax;
    const variance = Math.min(1, Math.abs(Number(room.price) - nearestBudget) / Math.max(1, nearestBudget));
    score += 30 * (1 - variance);
  }

  const maxDistance = Number(preference.maxDistanceKm ?? Infinity);
  if (distanceKm !== null && Number.isFinite(distanceKm)) {
    const distanceRatio = Number.isFinite(maxDistance) ? Math.max(0, 1 - distanceKm / Math.max(0.1, maxDistance)) : 1;
    score += 25 * Math.min(1, distanceRatio);
    if (distanceKm <= maxDistance) reasons.push('Cách trường ' + distanceKm.toFixed(1) + ' km');
  } else {
    score += 12.5;
  }

  if (requiredAmenities.size === 0) {
    score += 20;
  } else {
    const matched = [...requiredAmenities].filter((id) => roomAmenities.has(id)).length;
    score += 20 * (matched / requiredAmenities.size);
    reasons.push('Có ' + matched + '/' + requiredAmenities.size + ' tiện ích yêu cầu');
  }

  const areaRatio = Math.min(1, Number(room.area) / Math.max(1, preferredArea));
  score += 15 * areaRatio;
  if (Number(room.area) >= preferredArea) reasons.push('Diện tích đáp ứng nhu cầu');

  score += 10 * Math.min(1, averageRating / 5);
  if (averageRating >= 4) reasons.push('Được đánh giá tốt');

  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons };
}

function roommateMatchScore(current, candidate) {
  const positives = [];
  const differences = [];
  let score = 0;
  const toHour = (value) => {
    if (typeof value === 'string' && value.includes(':')) return Number(value.split(':')[0]);
    return Number(value);
  };
  const currentSmokes = Boolean(current.isSmoking ?? current.smokes);
  const candidateSmokes = Boolean(candidate.isSmoking ?? candidate.smokes);

  const budgetOverlap =
    Math.max(Number(current.budgetMin), Number(candidate.budgetMin)) <=
    Math.min(Number(current.budgetMax), Number(candidate.budgetMax));
  if (budgetOverlap) {
    score += 20;
    positives.push('Ngân sách tương đương');
  }
  if (current.universityId && current.universityId === candidate.universityId) {
    score += 15;
    positives.push('Cùng trường');
  }
  if (current.hometown && current.hometown === candidate.hometown) {
    score += 8;
    positives.push('Cùng quê');
  } else if (current.hometown && candidate.hometown) {
    differences.push('Không cùng quê');
  }
  if (currentSmokes === candidateSmokes && Boolean(current.acceptsSmoking) === Boolean(candidate.acceptsSmoking)) {
    score += 15;
    positives.push('Phù hợp thói quen hút thuốc');
  }
  if (current.hasPets === candidate.hasPets && Boolean(current.acceptsPets) === Boolean(candidate.acceptsPets)) {
    score += 12;
    positives.push('Phù hợp về thú cưng');
  }
  const sleepGap = Math.abs(toHour(current.sleepTime ?? current.sleepHour) - toHour(candidate.sleepTime ?? candidate.sleepHour));
  const wakeGap = Math.abs(toHour(current.wakeUpTime ?? current.wakeHour) - toHour(candidate.wakeUpTime ?? candidate.wakeHour));
  if (sleepGap <= 1 && wakeGap <= 1) {
    score += 12;
    positives.push('Giờ sinh hoạt gần giống nhau');
  }
  const cleanlinessGap = Math.abs(Number(current.cleanlinessLevel) - Number(candidate.cleanlinessLevel));
  if (cleanlinessGap <= 1) {
    score += 10;
    positives.push('Mức độ sạch sẽ tương đồng');
  }
  if (current.socialPreference === candidate.socialPreference) {
    score += 8;
    positives.push('Cùng phong cách sinh hoạt');
  }

  return { score: Math.round(Math.max(0, Math.min(100, score))), positives, differences };
}

function calculateInvoiceAmount(input) {
  const fields = [
    'rent',
    'electricityStart',
    'electricityEnd',
    'electricityUnitPrice',
    'waterStart',
    'waterEnd',
    'waterUnitPrice',
    'internet',
    'parking',
    'service',
    'other'
  ];
  const values = Object.fromEntries(fields.map((field) => [field, Number(input[field] ?? 0)]));
  if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0)) {
    throw new AppError('Số tiền và chỉ số không hợp lệ', 400);
  }
  if (values.electricityEnd < values.electricityStart || values.waterEnd < values.waterStart) {
    throw new AppError('Chỉ số cuối không thể nhỏ hơn chỉ số đầu', 400);
  }

  const electricityUsage = values.electricityEnd - values.electricityStart;
  const waterUsage = values.waterEnd - values.waterStart;
  const electricityAmount = electricityUsage * values.electricityUnitPrice;
  const waterAmount = waterUsage * values.waterUnitPrice;
  const total =
    values.rent +
    electricityAmount +
    waterAmount +
    values.internet +
    values.parking +
    values.service +
    values.other;

  return {
    electricityUsage,
    waterUsage,
    electricityAmount,
    waterAmount,
    total
  };
}

module.exports = {
  haversineDistanceKm,
  estimateTravelTimes,
  roomMatchScore,
  roommateMatchScore,
  calculateInvoiceAmount
};
