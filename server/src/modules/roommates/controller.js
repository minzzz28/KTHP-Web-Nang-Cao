const { asyncHandler } = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const service = require('./service');
const mine = asyncHandler(async (req, res) => success(res, { data: await service.mine(req.user) }));
const create = asyncHandler(async (req, res) => created(res, { message: 'Đã tạo hồ sơ ở ghép', data: await service.upsert(req.user, req.body) }));
const update = asyncHandler(async (req, res) => success(res, { message: 'Đã cập nhật hồ sơ ở ghép', data: await service.update(req.user, req.body) }));
const list = asyncHandler(async (req, res) => success(res, await service.list(req.query, req.user)));
const match = asyncHandler(async (req, res) => success(res, { data: await service.match(req.user, req.params.studentId) }));
module.exports = { mine, create, update, list, match };
