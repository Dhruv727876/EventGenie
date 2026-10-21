/**
 * @module EventGenie/SecurityTest
 * @description Input validation, sanitization, and security test suite
 * @version 1.0.0
 * @license MIT
 */

process.env.PORT = process.env.PORT || '5000';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.NODE_ENV = 'test';

const mockGetAIResponse = jest.fn().mockImplementation((eventType, message) => {
  return Promise.resolve({
    reply: `Processed request for ${eventType}: ${message}`,
    sources: ['Security Verified Guidelines'],
    nextAction: 'Review plan',
  });
});

jest.mock('../services/aiService', () => ({
  getAIResponse: (...args) => mockGetAIResponse(...args),
}));

const request = require('supertest');
const app = require('../index');

describe('Security & Input Validation Tests', () => {
  beforeEach(() => {
    mockGetAIResponse.mockClear();
  });

  it('oversized input (>2000 chars) returns 400', async () => {
    const hugeMessage = 'a'.repeat(2001);
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: hugeMessage,
        eventType: 'wedding',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockGetAIResponse).not.toHaveBeenCalled();
  });

  it('XSS payload is sanitized and returns 200 (not executed)', async () => {
    const maliciousPayload = '<script>alert("XSS")</script>How do I plan florals?';
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: maliciousPayload,
        eventType: 'wedding',
      });

    expect(res.status).toBe(200);
    expect(mockGetAIResponse).toHaveBeenCalled();

    const receivedMessage = mockGetAIResponse.mock.calls[0][1];
    expect(receivedMessage).not.toContain('<script>');
  });

  it('invalid eventType returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Plan my retirement party',
        eventType: 'unauthorized-type',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockGetAIResponse).not.toHaveBeenCalled();
  });

  it('negative budget values return 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Plan a budget for wedding',
        eventType: 'wedding',
        budget: -5000,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockGetAIResponse).not.toHaveBeenCalled();
  });

  it('malformed JSON returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Content-Type', 'application/json')
      .send('{"message": "bad json string, missing closing brace');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockGetAIResponse).not.toHaveBeenCalled();
  });

  it('helmet sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('CORS rejects unauthorized origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rate limiter returns 429 after 20 requests', async () => {
    const promises = [];
    for (let i = 0; i < 21; i++) {
      promises.push(
        request(app)
          .post('/api/chat')
          .send({
            message: `Rate limit probe ${i}`,
            eventType: 'wedding',
          })
      );
    }

    const responses = await Promise.all(promises);
    const has429 = responses.some((r) => r.status === 429);
    expect(has429).toBe(true);

    const limitedRes = responses.find((r) => r.status === 429);
    expect(limitedRes.body).toHaveProperty('error');
    expect(limitedRes.body.error).toMatch(/too many requests/i);
  });
});
