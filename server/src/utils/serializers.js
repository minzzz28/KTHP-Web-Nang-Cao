function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function publicRoom(room) {
  if (!room) return null;
  const { property, reviews = [], ...rest } = room;
  const rating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : null;

  return {
    ...rest,
    property,
    averageRating: rating
  };
}

module.exports = { publicUser, publicRoom };
