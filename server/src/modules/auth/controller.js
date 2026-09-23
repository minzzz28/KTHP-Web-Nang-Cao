const { asyncHandler } = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const service = require('./service');

const register = asyncHandler(async (req, res) => created(res, { message: 'Đăng ký thành công', data: await service.register(req.body) }));
const login = asyncHandler(async (req, res) => success(res, { message: 'Đăng nhập thành công', data: await service.login(req.body) }));
const me = asyncHandler(async (req, res) => success(res, { data: await service.getMe(req.user.id) }));
const changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body);
  return success(res, { message: 'Đổi mật khẩu thành công' });
});
const logout = asyncHandler(async (req, res) => success(res, { message: 'Đăng xuất thành công. Vui lòng xóa access token ở thiết bị.' }));

module.exports = { register, login, me, changePassword, logout };
