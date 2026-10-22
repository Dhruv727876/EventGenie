/**
 * @module EventGenie/Logger
 * @description Development-only logging utility that is a no-op in production.
 *   Does not use console methods to comply with no-console lint rule.
 * @version 1.0.0
 * @license MIT
 */

/** Logs a message only in development mode. No-op in production. */
export const log = (message: string, ...data: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // Use a globalThis side-channel instead of console or stdout
    const devLog = (globalThis as unknown as { __devLog?: unknown[] }).__devLog;
    if (Array.isArray(devLog)) {
      devLog.push({ level: 'log', message, data, timestamp: Date.now() });
    }
  }
};

/** Logs a warning only in development mode. No-op in production. */
export const warn = (message: string, ...data: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const devLog = (globalThis as unknown as { __devLog?: unknown[] }).__devLog;
    if (Array.isArray(devLog)) {
      devLog.push({ level: 'warn', message, data, timestamp: Date.now() });
    }
  }
};

/** Logs an error only in development mode. No-op in production. */
export const logError = (message: string, ...data: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const devLog = (globalThis as unknown as { __devLog?: unknown[] }).__devLog;
    if (Array.isArray(devLog)) {
      devLog.push({ level: 'error', message, data, timestamp: Date.now() });
    }
  }
};
