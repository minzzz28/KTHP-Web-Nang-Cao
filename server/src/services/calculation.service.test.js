const {
  haversineDistanceKm,
  estimateTravelTimes,
  roomMatchScore,
  roommateMatchScore,
  calculateInvoiceAmount
} = require('./calculation.service');

describe('calculation service', () => {
  test('calculates Haversine distance between two coordinates', () => {
    const distance = haversineDistanceKm(
      { latitude: 21.0285, longitude: 105.8542 },
      { latitude: 21.038, longitude: 105.84 }
    );

    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(2);
  });

  test('estimates travel time from persisted distance', () => {
    expect(estimateTravelTimes(2.1)).toEqual({
      walkingMinutes: 28,
      bicycleMinutes: 9,
      motorbikeMinutes: 5
    });
  });

  test('returns explainable room matching score', () => {
    const result = roomMatchScore(
      {
        price: 2500000,
        area: 25,
        averageRating: 4.5,
        roomAmenities: [{ amenityId: 'wifi' }, { amenityId: 'aircon' }]
      },
      {
        budgetMin: 2000000,
        budgetMax: 3000000,
        preferredArea: 20,
        maxDistanceKm: 3,
        amenityIds: ['wifi', 'aircon']
      },
      1.5
    );

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons).toContain('Giá nằm trong ngân sách');
    expect(result.reasons).toContain('Có 2/2 tiện ích yêu cầu');
  });

  test('returns roommate matching score with explanations', () => {
    const profile = {
      budgetMin: 1500000,
      budgetMax: 2500000,
      universityId: 'university-1',
      hometown: 'Hà Nội',
      smokes: false,
      acceptsSmoking: false,
      hasPets: false,
      acceptsPets: true,
      sleepHour: 23,
      wakeHour: 7,
      cleanlinessLevel: 4,
      socialPreference: 'BALANCED'
    };
    const result = roommateMatchScore(profile, { ...profile, hometown: 'Bắc Ninh' });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.positives).toContain('Cùng trường');
    expect(result.differences).toContain('Không cùng quê');
  });

  test('calculates invoice totals and rejects invalid meter readings', () => {
    expect(
      calculateInvoiceAmount({
        rent: 2500000,
        electricityStart: 100,
        electricityEnd: 150,
        electricityUnitPrice: 3500,
        waterStart: 20,
        waterEnd: 25,
        waterUnitPrice: 15000,
        internet: 100000,
        parking: 50000,
        service: 20000,
        other: 0
      })
    ).toEqual({
      electricityUsage: 50,
      waterUsage: 5,
      electricityAmount: 175000,
      waterAmount: 75000,
      total: 2920000
    });

    expect(() =>
      calculateInvoiceAmount({
        electricityStart: 20,
        electricityEnd: 10,
        waterStart: 0,
        waterEnd: 0
      })
    ).toThrow('Chỉ số cuối không thể nhỏ hơn chỉ số đầu');
  });
});
