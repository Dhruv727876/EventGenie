/**
 * @module EventGenie/Server
 * @description Hardened Express server entry point configuring security headers, routes, and rate limits
 * @version 1.0.0
 * @license MIT
 */

// Step 1: require('dotenv').config()
require('dotenv').config();

// Step 2: ENV validation: check GEMINI_API_KEY and PORT exist, process.exit(1) if missing
if (!process.env.GEMINI_API_KEY || !process.env.PORT) {
  if (typeof process !== 'undefined' && process.stderr?.write) {
    process.stderr.write('Missing required environment variables: GEMINI_API_KEY and PORT must be set\n');
  }
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { chatRateLimiter, ideasRateLimiter } = require('./middleware/rateLimiter');
const {
  validateChatInput,
  validateIdeasInput,
  handleValidationErrors,
  sanitizeInput,
} = require('./middleware/validateInput');
const { getAIResponse } = require('./services/aiService');
const { BODY_LIMIT, HTTP_STATUS, DEFAULT_PORT } = require('./utils/constants');

// Step 3: const app = express()
const app = express();

// Step 4: app.use(helmet(...)) - FIRST middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com"],
      },
    },
  })
);

// Step 5: app.use(cors(...)) - hardcoded array, NOT wildcard
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://eventgenie-40ac3.web.app',
    'https://eventgenie-40ac3.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Step 6: app.use(express.json({ limit: '10kb' }))
app.use(express.json({ limit: BODY_LIMIT }));

// Step 7: app.use('/api/chat', chatRateLimiter)
app.use('/api/chat', chatRateLimiter);

// Step 8: app.use('/api/ideas', ideasRateLimiter)
app.use('/api/ideas', ideasRateLimiter);

// Step 9: Routes: GET /api/health, POST /api/chat, POST /api/ideas

/**
 * Health check endpoint providing service uptime and status
 */
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'healthy',
    timestamp: Date.now(),
  });
});

/**
 * Chat endpoint processing planning inquiries via primary or fallback AI services
 */
app.post(
  '/api/chat',
  validateChatInput,
  handleValidationErrors,
  sanitizeInput,
  async (req, res, next) => {
    try {
      const { eventType, message, chatHistory } = req.body;
      const response = await getAIResponse(eventType, message, chatHistory);
      res.status(HTTP_STATUS.OK).json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Ideas endpoint generating personalized conceptual suggestions for events
 */
app.post(
  '/api/ideas',
  validateIdeasInput,
  handleValidationErrors,
  sanitizeInput,
  async (req, res, next) => {
    try {
      const { eventType, category, topic } = req.body;
      const promptQuery = `Provide innovative planning ideas for ${eventType} focusing on ${category || topic || 'general creative concepts'}.`;
      const response = await getAIResponse(eventType, promptQuery, []);
      res.status(HTTP_STATUS.OK).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// Step 10: 404 handler after all routes
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Endpoint not found' });
});

// Step 11: Global error handler (err, req, res, next) — MUST have 4 parameters, never expose stack
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Malformed JSON payload' });
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  res.status(statusCode).json({ error: message });
});

// Step 12: app.listen with process.stdout.write for boot log
const PORT = process.env.PORT || DEFAULT_PORT;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    process.stdout.write(`EventGenie server running on port ${PORT}\n`);
  });
}

/**
 * Configured Express application instance for EventGenie
 */
module.exports = app;
