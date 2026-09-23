const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const controller = require('./controller');

const studentRouter = express.Router();
studentRouter.get('/dashboard', authenticate, authorize('STUDENT'), controller.student);

const landlordRouter = express.Router();
landlordRouter.get('/dashboard', authenticate, authorize('LANDLORD'), controller.landlord);

module.exports = { studentDashboardRouter: studentRouter, landlordDashboardRouter: landlordRouter };
