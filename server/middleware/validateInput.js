/**
 * @module EventGenie/ValidateInputMiddleware
 * @description Input validation, XSS sanitization, and error handling middleware for incoming payloads
 * @version 1.0.0
 * @license MIT
 */

const { body, validationResult } = require('express-validator');
const xss = require('xss');
const { MAX_INPUT_LENGTH, HTTP_STATUS } = require('../utils/constants');
const { ValidationError } = require('../utils/errors');

/**
 * Recursively sanitizes strings within an object or array to prevent Cross-Site Scripting (XSS).
 * WHY: Event planning data often contains venue names, vendor descriptions, and custom user questions.
 * Untrusted strings could contain malicious HTML/script payloads designed to execute in admin panels,
 * collaborative dashboards, or client browsers. Traversing deeply ensures nested chat messages and
 * line items are cleansed before reaching application logic or persistent storage.
 * @param {any} value - The object, array, or string to sanitize
 * @returns {any} The sanitized value
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

/**
 * Middleware that runs XSS sanitization across the entire request body.
 * WHY: Proactively cleanses all body properties before controllers or AI services process the payload,
 * ensuring malicious HTML tags or script injection attempts cannot trigger downstream vulnerabilities.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

/**
 * Validation rules for the /api/chat endpoint.
 * Enforces text type, non-empty presence, character length limit (2000 chars),
 * and strict persona whitelist ('wedding', 'birthday', 'community').
 */
const validateChatInput = [
  body('message')
    .isString().withMessage('Message must be a string')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: MAX_INPUT_LENGTH }).withMessage(`Message cannot exceed ${MAX_INPUT_LENGTH} characters`),
  body('eventType')
    .isString().withMessage('eventType must be a string')
    .isIn(['wedding', 'birthday', 'community']).withMessage('Invalid eventType: must be wedding, birthday, or community'),
  body('budget')
    .optional()
    .custom((val) => {
      const num = Number(val);
      if (num < 0) {
        throw new ValidationError('Budget value cannot be negative');
      }
      return true;
    }),
  body('cost')
    .optional()
    .custom((val) => {
      const num = Number(val);
      if (num < 0) {
        throw new ValidationError('Cost value cannot be negative');
      }
      return true;
    }),
];

/**
 * Validation rules for the /api/ideas endpoint.
 * Enforces strict event persona whitelist and validates optional categories.
 */
const validateIdeasInput = [
  body('eventType')
    .isString().withMessage('eventType must be a string')
    .isIn(['wedding', 'birthday', 'community']).withMessage('Invalid eventType: must be wedding, birthday, or community'),
  body('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .isLength({ max: MAX_INPUT_LENGTH }).withMessage(`Category cannot exceed ${MAX_INPUT_LENGTH} characters`),
  body('topic')
    .optional()
    .isString().withMessage('Topic must be a string')
    .isLength({ max: MAX_INPUT_LENGTH }).withMessage(`Topic cannot exceed ${MAX_INPUT_LENGTH} characters`),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Count must be an integer between 1 and 10'),
  body('budget')
    .optional()
    .custom((val) => {
      const num = Number(val);
      if (num < 0) {
        throw new ValidationError('Budget value cannot be negative');
      }
      return true;
    }),
];

/**
 * Evaluates express-validator results and returns sanitized 400 responses on failure.
 * WHY: Sanitizing validation error strings guarantees reflection attacks cannot occur when
 * echoing invalid user parameters back to the client.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Next handler
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((err) => ({
      field: err.path || err.param,
      message: xss(err.msg || 'Invalid field'),
    }));
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: errorList[0]?.message || 'Validation failed',
      details: errorList,
    });
  }
  next();
}

module.exports = {
  sanitizeInput,
  validateChatInput,
  validateIdeasInput,
  handleValidationErrors,
};
