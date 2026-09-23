process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-jwt-validation';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const { createApp } = require('./app');

describe('HTTP application foundation', () => {
  const app = createApp();

  test('returns a health response using the standard API envelope', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Server đang hoạt động',
      data: { status: 'ok' }
    });
  });

  test('returns a safe standardized error for an unknown route', async () => {
    const response = await request(app).get('/not-a-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Không tìm thấy endpoint');
    expect(response.body.debug).toBeUndefined();
  });
});
