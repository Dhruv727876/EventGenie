/**
 * @module EventGenie/Logger
 * @description Safe development logger utilizing stream writes with zero console statements
 * @version 1.0.0
 * @license MIT
 */

/**
 * Safe write helper that outputs to process stdout if available
 * @param prefix Stream tag prefix
 * @param message Main log string
 */
const safeWrite = (prefix: string, message: string): void => {
  if (process.env.NODE_ENV !== 'production' && typeof process !== 'undefined' && process.stdout?.write) {
    process.stdout.write(`[${prefix}] ${message}\n`);
  }
};

/** Logs an informative message only in non-production environments */
export const log = (message: string, ..._data: unknown[]): void => {
  safeWrite('LOG', message);
};

/** Logs a warning message only in non-production environments */
export const warn = (message: string, ..._data: unknown[]): void => {
  safeWrite('WARN', message);
};

/** Logs an error message only in non-production environments */
export const logError = (message: string, ..._data: unknown[]): void => {
  safeWrite('ERROR', message);
};
