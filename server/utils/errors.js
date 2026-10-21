/**
 * @module EventGenie/ServerErrors
 * @description Custom server error classes for structured HTTP error handling
 * @version 1.0.0
 * @license MIT
 */

/**
 * Base application error containing HTTP status code and error code
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {string} code - Machine-readable error code
   * @param {number} [statusCode=500] - Associated HTTP response status code
   */
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error raised when upstream Generative AI or fallback services fail
 */
class AIServiceError extends AppError {
  /**
   * @param {string} message - Failure explanation
   */
  constructor(message) {
    super(message, 'AI_SERVICE_UNAVAILABLE', 503);
    this.name = 'AIServiceError';
  }
}

/**
 * Error raised when client payload fails schema or semantic validation
 */
class ValidationError extends AppError {
  /**
   * @param {string} message - Specific validation error message
   */
  constructor(message) {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Error raised when authorization or authentication headers fail
 */
class AuthError extends AppError {
  /**
   * @param {string} message - Authentication failure details
   */
  constructor(message) {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'AuthError';
  }
}

/**
 * Error raised when database operations or persistence layers fail
 */
class DataError extends AppError {
  /**
   * @param {string} message - Data operation failure details
   */
  constructor(message) {
    super(message, 'DATA_OPERATION_FAILED', 500);
    this.name = 'DataError';
  }
}

module.exports = {
  AppError,
  AIServiceError,
  ValidationError,
  AuthError,
  DataError,
};
