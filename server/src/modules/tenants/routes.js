const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const { tenantListSchema } = require('./validator');

const router = express.Router();
router.get('/', authenticate, authorize('LANDLORD', 'ADMIN'), validate(tenantListSchema, 'query'), controller.list);

module.exports = { tenantsRouter: router };
