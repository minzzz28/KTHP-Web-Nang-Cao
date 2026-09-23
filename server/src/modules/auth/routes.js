const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const { registerSchema, loginSchema, passwordChangeSchema } = require('./validator');

const router = express.Router();
router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.patch('/change-password', authenticate, validate(passwordChangeSchema), controller.changePassword);

module.exports = { authRouter: router };
