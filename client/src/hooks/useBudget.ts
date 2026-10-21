/**
 * @module EventGenie/UseBudget
 * @description Hook managing event budget items, category allocations, and debounced persistence
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// --- Internal Modules ---
import { BudgetItem, EventType } from '../types';
import { DEFAULT_BUDGET_CATEGORIES } from '../constants';
import { DEBOUNCE_DELAY_MS, MAX_BUDGET_ITEMS } from '../constants/limits';
import { saveUserPlan, loadUserPlan, logPlanEvent } from '../firebase';

// --- Utilities ---
import { generateId, calculateBudgetPercentage } from '../utils/helpers';

/** Return signature for the useBudget hook */
export interface UseBudgetReturn {
  items: BudgetItem[];
  totalEstimated: number;
  totalActual: number;
  percentageUsed: number;
  categoryPercentages: Record<string, number>;
  addItem: (category: string, description: string, estimated: number, actual?: number) => void;
  updateItem: (id: string, updates: Partial<Omit<BudgetItem, 'id'>>) => void;
  removeItem: (id: string) => void;
  resetToDefaults: (type: EventType) => void;
}

/**
 * Hook for managing event budget items, computing summary metrics with useMemo,
 * and syncing state to Firestore with debounced persistence.
 */
export const useBudget = (userId?: string, eventType: EventType = 'wedding'): UseBudgetReturn => {
  const [items, setItems] = useState<BudgetItem[]>(() => {
    const categories = DEFAULT_BUDGET_CATEGORIES[eventType] ?? DEFAULT_BUDGET_CATEGORIES.wedding;
    return categories.map((cat, idx) => ({
      id: `default-${idx}`,
      category: cat,
      description: `Allocated for ${cat}`,
      estimated: 1000,
      actual: 0,
    }));
  });

  const hasLoadedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsRef = useRef<BudgetItem[]>(items);
  itemsRef.current = items;

  // Guarded Firestore read - exactly once per session
  useEffect(() => {
    const shouldSkipLoad = !userId || hasLoadedRef.current;
    if (shouldSkipLoad) {
      return;
    }
    hasLoadedRef.current = true;

    loadUserPlan(userId)
      .then((saved) => {
        if (saved && saved.budget.length > 0) {
          setItems(saved.budget);
        }
      })
      .catch((_err: unknown) => {
        // resilient fallback
      });
  }, [userId]);

  // Debounced Firestore sync
  const scheduleSave = useCallback(
    (newItems: BudgetItem[]) => {
      if (!userId) {
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveUserPlan(userId, {
          budget: newItems,
          lastUpdated: Date.now(),
        }).catch((_err: unknown) => {
          // resilient background save
        });
      }, DEBOUNCE_DELAY_MS);
    },
    [userId]
  );

  const totalEstimated = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.estimated ?? 0), 0);
  }, [items]);

  const totalActual = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.actual ?? 0), 0);
  }, [items]);

  const percentageUsed = useMemo(() => {
    return calculateBudgetPercentage(items);
  }, [items]);

  const categoryPercentages = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const item of items) {
      const currentCatTotal = (breakdown[item.category] ?? 0) + item.actual;
      breakdown[item.category] = currentCatTotal;
    }
    const result: Record<string, number> = {};
    for (const cat of Object.keys(breakdown)) {
      result[cat] = totalActual > 0 ? Math.round(((breakdown[cat] ?? 0) / totalActual) * 100) : 0;
    }
    return result;
  }, [items, totalActual]);

  const addItem = useCallback(
    (category: string, description: string, estimated: number, actual = 0): void => {
      if (itemsRef.current.length >= MAX_BUDGET_ITEMS) {
        return;
      }
      const newItem: BudgetItem = {
        id: generateId(),
        category: category.trim() || 'General',
        description: description.trim() || 'Custom item',
        estimated: Math.max(0, estimated),
        actual: Math.max(0, actual),
      };
      const updated = [...itemsRef.current, newItem];
      setItems(updated);
      logPlanEvent('budget_item_added', { category: newItem.category, estimated: newItem.estimated });
      logPlanEvent('budget_updated', { action: 'add_item', category: newItem.category });
      scheduleSave(updated);
    },
    [scheduleSave]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<BudgetItem, 'id'>>): void => {
      const updated = itemsRef.current.map((item) => {
        if (item.id === id) {
          const nextEst = updates.estimated !== undefined ? Math.max(0, updates.estimated) : item.estimated;
          const nextAct = updates.actual !== undefined ? Math.max(0, updates.actual) : item.actual;
          return {
            ...item,
            ...updates,
            estimated: nextEst,
            actual: nextAct,
          };
        }
        return item;
      });
      setItems(updated);
      logPlanEvent('budget_item_updated', { id, action: 'update_item' });
      logPlanEvent('budget_updated', { action: 'update_item', id });
      scheduleSave(updated);
    },
    [scheduleSave]
  );

  const removeItem = useCallback(
    (id: string): void => {
      const updated = itemsRef.current.filter((item) => item.id !== id);
      setItems(updated);
      logPlanEvent('budget_updated', { action: 'remove_item', id });
      scheduleSave(updated);
    },
    [scheduleSave]
  );

  const resetToDefaults = useCallback(
    (type: EventType): void => {
      const categories = DEFAULT_BUDGET_CATEGORIES[type] ?? DEFAULT_BUDGET_CATEGORIES.wedding;
      const defaults: BudgetItem[] = categories.map((cat, idx) => ({
        id: `default-${type}-${idx}`,
        category: cat,
        description: `Allocated for ${cat}`,
        estimated: 1000,
        actual: 0,
      }));
      setItems(defaults);
      logPlanEvent('budget_updated', { action: 'reset_defaults', eventType: type });
      scheduleSave(defaults);
    },
    [scheduleSave]
  );

  return {
    items,
    totalEstimated,
    totalActual,
    percentageUsed,
    categoryPercentages,
    addItem,
    updateItem,
    removeItem,
    resetToDefaults,
  };
};
