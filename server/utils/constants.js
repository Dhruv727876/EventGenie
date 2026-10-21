/**
 * @module EventGenie/ServerConstants
 * @description Centralized constants and numerical limits for the Express backend
 * @version 1.0.0
 * @license MIT
 */

/** Default server listener port */
const DEFAULT_PORT = 5000;

/** Timeout threshold in milliseconds for upstream AI calls */
const AI_TIMEOUT_MS = 25000;

/** Time window in milliseconds for rate limiter middleware */
const RATE_LIMIT_WINDOW_MS = 60000;

/** Maximum chat requests permitted per rate limit window */
const CHAT_RATE_LIMIT_MAX = 20;

/** Maximum ideas generation requests permitted per rate limit window */
const IDEAS_RATE_LIMIT_MAX = 15;

/** Maximum permissible text character length for user input */
const MAX_INPUT_LENGTH = 2000;

/** Maximum request body size limit */
const BODY_LIMIT = '10kb';

/** Standard HTTP status codes */
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

module.exports = {
  DEFAULT_PORT,
  AI_TIMEOUT_MS,
  RATE_LIMIT_WINDOW_MS,
  CHAT_RATE_LIMIT_MAX,
  IDEAS_RATE_LIMIT_MAX,
  MAX_INPUT_LENGTH,
  BODY_LIMIT,
  HTTP_STATUS,
};
