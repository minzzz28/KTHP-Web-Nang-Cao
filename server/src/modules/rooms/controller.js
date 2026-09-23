const { asyncHandler } = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const service = require('./service');

const list = asyncHandler(async (req, res) => success(res, await (req.query.mine ? service.mine(req.user, req.query) : service.list(req.query))));
const search = list;
const nearby = asyncHandler(async (req, res) => {
  if (!req.query.universityId) throw new AppError('universityId là bắt buộc để tìm phòng gần trường', 422);
  return success(res, await service.list({ ...req.query, sort: req.query.sort === 'NEWEST' ? 'DISTANCE_ASC' : req.query.sort }));
});
const map = list;
const show = asyncHandler(async (req, res) => success(res, { data: await service.get(req.params.id, req.query) }));
const create = asyncHandler(async (req, res) => created(res, { message: 'Đã tạo phòng', data: await service.create(req.user, req.body) }));
const update = asyncHandler(async (req, res) => success(res, { message: 'Đã cập nhật phòng', data: await service.update(req.user, req.params.id, req.body) }));
const remove = asyncHandler(async (req, res) => success(res, { message: 'Đã ẩn phòng để bảo toàn lịch sử', data: await service.hide(req.user, req.params.id) }));
const history = asyncHandler(async (req, res) => success(res, { data: { items: await service.priceHistory(req.params.id) } }));
const nearbyPlaces = asyncHandler(async (req, res) => success(res, { data: { items: await service.nearbyPlaces(req.params.id) } }));
const uploadImages = asyncHandler(async (req, res) => created(res, { message: 'Đã tải ảnh phòng lên', data: { items: await service.uploadImages(req.user, req.params.id, req.files) } }));
const compare = asyncHandler(async (req, res) => success(res, { data: { items: await service.compare(req.query) } }));
const recommendations = asyncHandler(async (req, res) => success(res, await service.recommendations(req.user, req.method === 'GET' ? req.query : req.body)));
const mine = asyncHandler(async (req, res) => success(res, await service.mine(req.user, req.query)));
module.exports = { list, search, nearby, map, show, create, update, remove, history, nearbyPlaces, uploadImages, compare, recommendations, mine };
