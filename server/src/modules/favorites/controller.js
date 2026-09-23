const { asyncHandler } = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const service = require('./service');
const list = asyncHandler(async (req, res) => success(res, await service.list(req.user, req.query)));
const add = asyncHandler(async (req, res) => created(res, { message: 'Đã thêm phòng yêu thích', data: await service.add(req.user, req.body) }));
const remove = asyncHandler(async (req, res) => { await service.remove(req.user, req.params.roomId); return success(res, { message: 'Đã bỏ phòng yêu thích' }); });
module.exports = { list, add, remove };
