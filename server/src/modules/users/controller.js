const { asyncHandler } = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./service');

const me = asyncHandler(async (req, res) => success(res, { data: await service.getOwnProfile(req.user.id) }));
const show = asyncHandler(async (req, res) => success(res, { data: await service.getPublicProfile(req.params.id) }));
const updateAccount = asyncHandler(async (req, res) => success(res, { message: 'Đã cập nhật tài khoản', data: await service.updateAccount(req.user.id, req.body) }));
const updateProfile = asyncHandler(async (req, res) => success(res, { message: 'Đã cập nhật hồ sơ', data: await service.updateProfile(req.user, req.body) }));

module.exports = { me, show, updateAccount, updateProfile };
