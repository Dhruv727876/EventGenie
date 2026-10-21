/**
 * @module EventGenie/Errors
 * @description Custom error hierarchy for type-safe error handling across client
 * @version 1.0.0
 * @license MIT
 */

/** Base application error with error code and optional HTTP status code */
export class AppError extends Error {
  constructor(
    message: string,
    /** Machine-readable error code */
    public readonly code: string,
    /** HTTP status code if applicable */
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Thrown when AI service is unavailable */
export class AIServiceError extends AppError {
  constructor(message: string) {
    super(message, 'AI_SERVICE_UNAVAILABLE', 503);
    this.name = 'AIServiceError';
  }
}

/** Thrown when user input fails validation */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'ValidationError';
  }
}

/** Thrown when authentication fails */
export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'AuthError';
  }
}

/** Thrown when a Firestore operation fails */
export class DataError extends AppError {
  constructor(message: string) {
    super(message, 'DATA_OPERATION_FAILED', 500);
    this.name = 'DataError';
  }
}
