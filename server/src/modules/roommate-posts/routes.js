const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const { postSchema, postUpdateSchema, postListSchema } = require('./validator');
const router = express.Router();
function authenticateForMine(req, res, next) { return req.query.mine === 'true' || req.query.mine === true ? authenticate(req, res, next) : next(); }
router.get('/', authenticateForMine, validate(postListSchema, 'query'), controller.list);
router.get('/mine', authenticate, authorize('STUDENT'), validate(postListSchema, 'query'), controller.mine);
router.post('/', authenticate, authorize('STUDENT'), validate(postSchema), controller.create);
router.get('/:id', controller.show);
router.patch('/:id', authenticate, authorize('STUDENT'), validate(postUpdateSchema), controller.update);
router.post('/:id/close', authenticate, authorize('STUDENT'), controller.close);
router.delete('/:id', authenticate, authorize('STUDENT'), controller.remove);
module.exports = { roommatePostsRouter: router };
