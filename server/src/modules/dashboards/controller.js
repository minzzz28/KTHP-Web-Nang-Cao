const { asyncHandler } = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./service');

const student = asyncHandler(async (req, res) => success(res, { data: await service.student(req.user) }));
const landlord = asyncHandler(async (req, res) => success(res, { data: await service.landlord(req.user) }));

module.exports = { student, landlord };
