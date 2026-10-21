/**
 * @module EventGenie/Limits
 * @description System-wide numerical limits and configuration boundaries
 * @version 1.0.0
 * @license MIT
 */

/** Maximum character length for chat input */
export const MAX_CHAT_INPUT_LENGTH = 2000;

/** Debounce delay in milliseconds for Firestore writes */
export const DEBOUNCE_DELAY_MS = 2000;

/** AI response timeout in milliseconds */
export const AI_TIMEOUT_MS = 25000;

/** Maximum budget items per plan */
export const MAX_BUDGET_ITEMS = 50;

/** Maximum timeline milestones per plan */
export const MAX_TIMELINE_MILESTONES = 100;

/** Maximum vendors per plan */
export const MAX_VENDORS = 50;

/** Minimum button touch target in pixels */
export const MIN_TOUCH_TARGET_PX = 44;

/** Rate limit window in milliseconds */
export const RATE_LIMIT_WINDOW_MS = 60000;

/** Chat rate limit max requests */
export const CHAT_RATE_LIMIT_MAX = 20;

/** Ideas rate limit max requests */
export const IDEAS_RATE_LIMIT_MAX = 15;
