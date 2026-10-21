/**
 * @module EventGenie/ChatTest
 * @description Chat endpoint test suite verifying valid responses and input validation failures
 * @version 1.0.0
 * @license MIT
 */

process.env.PORT = process.env.PORT || '5000';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.NODE_ENV = 'test';

jest.mock('../services/aiService', () => ({
  getAIResponse: jest.fn().mockResolvedValue({
    reply: 'Here are your planning suggestions.',
    sources: ['EventGenie Knowledge Base'],
    nextAction: 'Confirm guest count',
  }),
}));

const request = require('supertest');
const app = require('../index');

describe('POST /api/chat', () => {
  it('valid request returns 200', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'How should I choose a photographer?',
        eventType: 'wedding',
        chatHistory: [],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('sources');
    expect(res.body).toHaveProperty('nextAction');
  });

  it('missing message returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        eventType: 'wedding',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('invalid eventType returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Hello planner',
        eventType: 'corporate-retreat',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns structured response with nextAction field', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Plan my birthday entertainment',
        eventType: 'birthday',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nextAction');
    expect(typeof res.body.nextAction).toBe('string');
    expect(res.body.nextAction.length).toBeGreaterThan(0);
  });

  it('handles empty chat history gracefully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Where do I get permits for a block party?',
        eventType: 'community',
        chatHistory: [],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('sources');
  });
});
