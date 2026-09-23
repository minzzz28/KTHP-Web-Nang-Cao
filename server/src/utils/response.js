function success(res, { status = 200, message = 'Thành công', data = null, meta } = {}) {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
}

function created(res, { message = 'Đã tạo thành công', data = null } = {}) {
  return success(res, { status: 201, message, data });
}

module.exports = { success, created };
