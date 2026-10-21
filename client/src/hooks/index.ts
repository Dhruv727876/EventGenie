/**
 * @module EventGenie/Hooks
 * @description Central barrel re-exporting all custom React hooks for EventGenie
 * @version 1.0.0
 * @license MIT
 */

/** Hook for managing anonymous authentication */
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

/** Main planning hook for chat history and persona state */
export { usePlanManager } from './usePlanManager';
export type { UsePlanManagerReturn } from './usePlanManager';

/** Hook for managing budget allocations and calculations */
export { useBudget } from './useBudget';
export type { UseBudgetReturn } from './useBudget';

/** Hook for tracking event milestones and timeline deadlines */
export { useTimeline } from './useTimeline';
export type { UseTimelineReturn } from './useTimeline';
