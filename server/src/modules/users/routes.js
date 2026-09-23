const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const authController = require('../auth/controller');
const { updateAccountSchema, updateStudentProfileSchema, updateLandlordProfileSchema } = require('./validator');
const { passwordChangeSchema } = require('../auth/validator');

const router = express.Router();
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate(updateAccountSchema), controller.updateAccount);
router.patch('/me/password', authenticate, validate(passwordChangeSchema), authController.changePassword);
router.patch('/me/profile', authenticate, (req, res, next) => {
  const schema = req.user.role === 'STUDENT' ? updateStudentProfileSchema : updateLandlordProfileSchema;
  return validate(schema)(req, res, next);
}, controller.updateProfile);
router.get('/:id', controller.show);

module.exports = { usersRouter: router };
