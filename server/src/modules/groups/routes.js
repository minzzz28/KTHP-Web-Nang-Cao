const express = require('express'); const { authenticate, authorize } = require('../../middleware/auth.middleware'); const { validate } = require('../../middleware/validate.middleware'); const controller = require('./controller'); const { groupSchema, groupUpdateSchema, listGroupsSchema, memberSchema, transferSchema } = require('./validator');
const router = express.Router();
function authenticateForMine(req, res, next) { return req.query.mine === 'true' || req.query.mine === true ? authenticate(req, res, next) : next(); }
router.get('/', authenticateForMine, validate(listGroupsSchema, 'query'), controller.list);
router.get('/mine', authenticate, authorize('STUDENT'), validate(listGroupsSchema, 'query'), controller.mine);
router.post('/', authenticate, authorize('STUDENT'), validate(groupSchema), controller.create);
router.get('/:id', controller.show);
router.patch('/:id', authenticate, authorize('STUDENT'), validate(groupUpdateSchema), controller.update);
router.post('/:id/members', authenticate, authorize('STUDENT'), validate(memberSchema), controller.addMember);
router.delete('/:id/members/:studentId', authenticate, authorize('STUDENT'), controller.removeMember);
router.post('/:id/leave', authenticate, authorize('STUDENT'), controller.leave);
router.post('/:id/transfer-leadership', authenticate, authorize('STUDENT'), validate(transferSchema), controller.transfer);
module.exports = { groupsRouter: router };
