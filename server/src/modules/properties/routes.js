const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const controller = require('./controller');
const { propertySchema, propertyUpdateSchema, listPropertiesSchema, nearbyPlaceSchema, geocodeAddressSchema } = require('./validator');
const router = express.Router();
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Bạn đã tìm vị trí quá nhiều lần. Vui lòng chờ một lát rồi thử lại.' }
});
router.get('/', authenticate, validate(listPropertiesSchema, 'query'), controller.list);
// Keep this route above /:id so the text "geocode" is never parsed as an id.
router.post('/geocode', authenticate, authorize('LANDLORD', 'ADMIN'), geocodeLimiter, validate(geocodeAddressSchema), controller.geocode);
router.post('/', authenticate, authorize('LANDLORD'), validate(propertySchema), controller.create);
router.get('/:id/nearby-places', controller.places);
router.post('/:id/nearby-places', authenticate, authorize('LANDLORD', 'ADMIN'), validate(nearbyPlaceSchema), controller.createPlace);
router.delete('/:id/nearby-places/:placeId', authenticate, authorize('LANDLORD', 'ADMIN'), controller.removePlace);
router.get('/:id', controller.show);
router.patch('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), validate(propertyUpdateSchema), controller.update);
router.delete('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), controller.remove);
module.exports = { propertiesRouter: router };
