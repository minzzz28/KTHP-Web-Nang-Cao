const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const { appointmentSchema, appointmentActionSchema, appointmentUpdateSchema, appointmentListSchema } = require('./validator');

const router = express.Router();
router.use(authenticate);
router.get('/', validate(appointmentListSchema, 'query'), controller.list);
router.post('/', authorize('STUDENT'), validate(appointmentSchema), controller.create);
router.get('/:id', controller.show);
router.post('/:id/respond', authorize('LANDLORD', 'ADMIN'), validate(appointmentActionSchema), controller.respond);
router.post('/:id/cancel', authorize('STUDENT'), controller.cancel);
// Legacy UI compatibility: authorization still happens in the service by role and ownership.
router.patch('/:id', validate(appointmentUpdateSchema), controller.update);

module.exports = { appointmentsRouter: router };
