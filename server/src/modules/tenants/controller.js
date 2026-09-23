const { asyncHandler } = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./service');

const list = asyncHandler(async (req, res) => success(res, await service.listTenants(req.user, req.query)));

module.exports = { list };
