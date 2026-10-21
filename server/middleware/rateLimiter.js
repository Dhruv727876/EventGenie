/**
 * @module EventGenie/RateLimiterMiddleware
 * @description Express rate limiter middlewares for chat and ideas API endpoints
 * @version 1.0.0
 * @license MIT
 */

const rateLimit = require('express-rate-limit');
const {
  RATE_LIMIT_WINDOW_MS,
  CHAT_RATE_LIMIT_MAX,
  IDEAS_RATE_LIMIT_MAX,
} = require('../utils/constants');

/**
 * Rate limiter middleware restricting chat queries to 20 requests per minute
 */
const chatRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: CHAT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too many requests, please try again later',
  },
});

/**
 * Rate limiter middleware restricting idea generation to 15 requests per minute
 */
const ideasRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: IDEAS_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too many requests, please try again later',
  },
});

module.exports = {
  chatRateLimiter,
  ideasRateLimiter,
};
