const { asyncHandler } = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const service = require('./service');
const list = asyncHandler(async (req, res) => { const result = await service.list(req.query); return success(res, result); });
const show = asyncHandler(async (req, res) => success(res, { data: await service.get(req.params.id) }));
const create = asyncHandler(async (req, res) => created(res, { message: 'Đã tạo trường đại học', data: await service.create(req.body) }));
const update = asyncHandler(async (req, res) => success(res, { message: 'Đã cập nhật trường đại học', data: await service.update(req.params.id, req.body) }));
const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); return success(res, { message: 'Đã xóa trường đại học' }); });
module.exports = { list, show, create, update, remove };
