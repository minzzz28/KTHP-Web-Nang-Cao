function getPagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function getPageMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

module.exports = { getPagination, getPageMeta };
