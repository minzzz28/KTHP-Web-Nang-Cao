const { asyncHandler } = require('../../utils/asyncHandler'); const { success, created } = require('../../utils/response'); const service = require('./service');
const create = asyncHandler(async (req, res) => created(res, { message: 'Đã đặt lịch xem phòng', data: await service.create(req.user, req.body) }));
const list = asyncHandler(async (req, res) => success(res, await service.list(req.user, req.query)));
const show = asyncHandler(async (req, res) => success(res, { data: await service.getForUser(req.user, req.params.id) }));
const respond = asyncHandler(async (req, res) => success(res, { message: 'Đã phản hồi lịch xem', data: await service.respond(req.user, req.params.id, req.body) }));
const cancel = asyncHandler(async (req, res) => success(res, { message: 'Đã hủy lịch xem', data: await service.cancel(req.user, req.params.id) }));
const update = asyncHandler(async (req, res) => {
  if (req.body.status === 'CANCELLED') {
    return success(res, { message: 'Đã hủy lịch xem', data: await service.cancel(req.user, req.params.id) });
  }
  return success(res, { message: 'Đã phản hồi lịch xem', data: await service.respond(req.user, req.params.id, req.body) });
});
module.exports = { create, list, show, respond, cancel, update };
