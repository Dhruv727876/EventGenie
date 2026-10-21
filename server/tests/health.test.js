/**
 * @module EventGenie/HealthTest
 * @description Health check endpoint test suite
 * @version 1.0.0
 * @license MIT
 */

process.env.PORT = process.env.PORT || '5000';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

describe('GET /api/health', () => {
  it('returns 200 and responds in under 200ms', async () => {
    const startTime = Date.now();
    const res = await request(app).get('/api/health');
    const duration = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(duration).toBeLessThan(200);
  });
});
