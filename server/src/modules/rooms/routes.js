const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { uploadRoomImages } = require('../../middleware/upload.middleware');
const controller = require('./controller');
const { roomSchema, roomUpdateSchema, roomListQuerySchema, roomDetailQuerySchema, recommendationSchema, recommendationQuerySchema, compareQuerySchema } = require('./validator');
const router = express.Router();

function authenticateForMine(req, res, next) {
  return req.query.mine === 'true' || req.query.mine === true ? authenticate(req, res, next) : next();
}

router.get('/', authenticateForMine, validate(roomListQuerySchema, 'query'), controller.list);
router.get('/search', validate(roomListQuerySchema, 'query'), controller.search);
router.get('/nearby', validate(roomListQuerySchema, 'query'), controller.nearby);
router.get('/map', validate(roomListQuerySchema, 'query'), controller.map);
router.get('/compare', validate(compareQuerySchema, 'query'), controller.compare);
router.get('/recommendations', authenticate, authorize('STUDENT'), validate(recommendationQuerySchema, 'query'), controller.recommendations);
router.post('/recommendations', authenticate, authorize('STUDENT'), validate(recommendationSchema), controller.recommendations);
router.get('/mine', authenticate, authorize('LANDLORD', 'ADMIN'), validate(roomListQuerySchema, 'query'), controller.mine);
router.post('/', authenticate, authorize('LANDLORD', 'ADMIN'), validate(roomSchema), controller.create);
router.get('/:id/price-history', controller.history);
router.get('/:id/nearby-places', controller.nearbyPlaces);
router.post('/:id/images/upload', authenticate, authorize('LANDLORD', 'ADMIN'), uploadRoomImages, controller.uploadImages);
router.get('/:id', validate(roomDetailQuerySchema, 'query'), controller.show);
router.patch('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), validate(roomUpdateSchema), controller.update);
router.delete('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), controller.remove);
module.exports = { roomsRouter: router };
