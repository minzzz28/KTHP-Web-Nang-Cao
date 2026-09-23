jest.mock('../../lib/prisma', () => ({ prisma: {} }));
jest.mock('https', () => ({ get: jest.fn() }));

const { EventEmitter } = require('events');
const https = require('https');
const { prisma } = require('../../lib/prisma');
const { geocodeAddress } = require('./service');
const { geocodeAddressSchema } = require('./validator');

describe('property address geocoding', () => {
  let now = 10_000;

  function respondWith(payload) {
    https.get.mockImplementationOnce((url, options, callback) => {
      const request = new EventEmitter();
      request.destroy = jest.fn();
      process.nextTick(() => {
        const response = new EventEmitter();
        response.statusCode = 200;
        response.setEncoding = jest.fn();
        response.resume = jest.fn();
        callback(response);
        response.emit('data', JSON.stringify(payload));
        response.emit('end');
      });
      return request;
    });
  }

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete prisma.property;
  });

  test('uses the fixed Nominatim HTTPS endpoint and returns only safe location fields', async () => {
    respondWith([{
      display_name: 'Nhân Chính, Thanh Xuân, Hà Nội, Việt Nam',
      lat: '21.0012',
      lon: '105.8091',
      address: {
        quarter: 'Nhân Chính',
        city_district: 'Thanh Xuân',
        city: 'Hà Nội',
        ignored: 'Không trả về client'
      },
      extratags: { ignored: 'Không trả về client' }
    }]);

    const items = await geocodeAddress('  Nhân Chính, Thanh Xuân, Hà Nội  ');

    expect(items).toEqual([{
      displayName: 'Nhân Chính, Thanh Xuân, Hà Nội, Việt Nam',
      latitude: 21.0012,
      longitude: 105.8091,
      ward: 'Nhân Chính',
      district: 'Thanh Xuân',
      city: 'Hà Nội'
    }]);
    const [url, options] = https.get.mock.calls[0];
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe('https://nominatim.openstreetmap.org/search');
    expect(parsed.searchParams.get('q')).toBe('Nhân Chính, Thanh Xuân, Hà Nội');
    expect(parsed.searchParams.get('countrycodes')).toBe('vn');
    expect(options).toEqual(expect.objectContaining({ timeout: 8_000 }));
  });

  test('falls back only to the fixed OpenStreetMap Photon endpoint when Nominatim has no result', async () => {
    now = 12_000;
    respondWith([]);
    respondWith({
      features: [{
        properties: { name: 'Khu đô thị Dương Nội', district: 'Hà Đông', state: 'Hà Nội', country: 'Việt Nam' },
        geometry: { coordinates: [105.7486, 20.9808] }
      }]
    });

    const items = await geocodeAddress('Dương Nội, Hà Đông, Hà Nội');

    expect(items).toEqual([{
      displayName: 'Khu đô thị Dương Nội, Hà Đông, Hà Nội, Việt Nam',
      latitude: 20.9808,
      longitude: 105.7486,
      ward: null,
      district: 'Hà Đông',
      city: 'Hà Nội'
    }]);
    expect(https.get).toHaveBeenCalledTimes(2);
    expect(https.get.mock.calls.map(([url]) => new URL(url).origin)).toEqual([
      'https://nominatim.openstreetmap.org',
      'https://photon.komoot.io'
    ]);
  });

  test('uses only the current landlord’s saved locations before an external fallback', async () => {
    now = 14_000;
    prisma.property = {
      findMany: jest.fn().mockResolvedValue([{
        address: 'Khu đô thị Dương Nội, phường Dương Nội, Hà Đông, Hà Nội',
        ward: 'Dương Nội',
        district: 'Hà Đông',
        city: 'Hà Nội',
        latitude: '20.9632',
        longitude: '105.7500'
      }])
    };
    respondWith([]);

    const items = await geocodeAddress('Dương Nội, Hà Đông, Hà Nội', { id: 10 });

    expect(items).toEqual([{
      displayName: 'Khu đô thị Dương Nội, phường Dương Nội, Hà Đông, Hà Nội',
      latitude: 20.9632,
      longitude: 105.75,
      ward: 'Dương Nội',
      district: 'Hà Đông',
      city: 'Hà Nội'
    }]);
    expect(prisma.property.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { landlordId: 10 } }));
    expect(https.get).toHaveBeenCalledTimes(1);
  });

  test('accepts only a bounded address payload', () => {
    expect(geocodeAddressSchema.parse({ address: 'Số 12, Nguyễn Trãi, Hà Nội' })).toEqual({ address: 'Số 12, Nguyễn Trãi, Hà Nội' });
    expect(() => geocodeAddressSchema.parse({ address: 'abc' })).toThrow();
    expect(() => geocodeAddressSchema.parse({ address: 'https://internal.example.test/' })).toThrow();
  });
});
