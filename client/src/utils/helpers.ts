/**
 * @module EventGenie/Helpers
 * @description Pure helper utilities for formatting, calculations, and identifiers
 * @version 1.0.0
 * @license MIT
 */

// --- Internal Modules ---
import { BudgetItem } from '../types';

/** Formats a numerical value as standard USD currency string */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Calculates the percentage of total estimated budget consumed by actual expenses */
export const calculateBudgetPercentage = (items: BudgetItem[]): number => {
  const totalEstimated = items.reduce((sum, item) => sum + (item.estimated ?? 0), 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actual ?? 0), 0);
  if (totalEstimated <= 0) {
    return 0;
  }
  return Math.min(Math.round((totalActual / totalEstimated) * 100), 100);
};

/** Generates a cryptographically random unique identifier with safe fallback */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/** Debounces a function execution by a specified millisecond duration */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };
}

/** Truncates text to a maximum length and appends an ellipsis if truncated */
export const truncateText = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen).trim()}...`;
};
