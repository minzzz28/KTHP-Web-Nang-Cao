// University priority and coordinates come from the public API. This keeps the
// selected campus configurable through data instead of duplicating it in UI.
export function primaryUniversityFrom(universities) {
  const list = Array.isArray(universities) ? universities : [];
  return list.find((university) => university?.isPrimary === true) || null;
}

export function prioritizeUniversities(universities, primaryUniversity = primaryUniversityFrom(universities)) {
  const list = Array.isArray(universities) ? universities : [];
  if (!primaryUniversity) return list;
  return [primaryUniversity, ...list.filter((university) => String(university?.id) !== String(primaryUniversity.id))];
}

export function universityCoordinates(university) {
  const latitude = Number(university?.latitude);
  const longitude = Number(university?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}
