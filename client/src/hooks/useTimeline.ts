/**
 * @module EventGenie/UseTimeline
 * @description Hook managing event schedule, milestone deadlines, and progress completion
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// --- Internal Modules ---
import { TimelineMilestone, EventType } from '../types';
import { TIMELINE_TEMPLATES } from '../constants';
import { DEBOUNCE_DELAY_MS, MAX_TIMELINE_MILESTONES } from '../constants/limits';
import { saveUserPlan, loadUserPlan, logPlanEvent, recordMilestoneCompletion } from '../firebase';

// --- Utilities ---
import { generateId } from '../utils/helpers';

/** Return signature for the useTimeline hook */
export interface UseTimelineReturn {
  milestones: TimelineMilestone[];
  percentComplete: number;
  addMilestone: (title: string, dueDate: string, notes?: string) => void;
  toggleComplete: (id: string) => void;
  removeMilestone: (id: string) => void;
  resetToDefaults: (type: EventType) => void;
}

/** Helper calculating an ISO date string offset from today by N days */
const getDateOffset = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const isoFormatted = d.toISOString().split('T')[0];
  return isoFormatted ?? '';
};

/**
 * Hook managing timeline milestones, completion toggles,
 * and debounced synchronization with Cloud Firestore.
 */
export const useTimeline = (userId?: string, eventType: EventType = 'wedding'): UseTimelineReturn => {
  const [milestones, setMilestones] = useState<TimelineMilestone[]>(() => {
    const templates = TIMELINE_TEMPLATES[eventType] ?? TIMELINE_TEMPLATES.wedding;
    return templates.map((tpl, idx) => ({
      id: `template-${idx}`,
      title: tpl.title,
      dueDate: getDateOffset(tpl.dueDateOffsetDays),
      completed: false,
      notes: '',
    }));
  });

  const hasLoadedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestonesRef = useRef<TimelineMilestone[]>(milestones);
  milestonesRef.current = milestones;

  // Guarded Firestore read - exactly once per session
  useEffect(() => {
    const shouldSkipLoad = !userId || hasLoadedRef.current;
    if (shouldSkipLoad) {
      return;
    }
    hasLoadedRef.current = true;

    loadUserPlan(userId)
      .then((saved) => {
        if (saved && saved.timeline.length > 0) {
          setMilestones(saved.timeline);
        }
      })
      .catch((_err: unknown) => {
        // resilient fallback
      });
  }, [userId]);

  // Debounced Firestore sync
  const scheduleSave = useCallback(
    (newMilestones: TimelineMilestone[]) => {
      if (!userId) {
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveUserPlan(userId, {
          timeline: newMilestones,
          lastUpdated: Date.now(),
        }).catch((_err: unknown) => {
          // resilient background save
        });
      }, DEBOUNCE_DELAY_MS);
    },
    [userId]
  );

  const percentComplete = useMemo(() => {
    if (milestones.length === 0) {
      return 0;
    }
    const completedCount = milestones.filter((m) => m.completed).length;
    return Math.round((completedCount / milestones.length) * 100);
  }, [milestones]);

  const addMilestone = useCallback(
    (title: string, dueDate: string, notes = ''): void => {
      if (milestonesRef.current.length >= MAX_TIMELINE_MILESTONES) {
        return;
      }
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return;
      }
      const newMilestone: TimelineMilestone = {
        id: generateId(),
        title: trimmedTitle,
        dueDate: dueDate || getDateOffset(30),
        completed: false,
        notes: notes.trim(),
      };
      const updated = [...milestonesRef.current, newMilestone];
      setMilestones(updated);
      logPlanEvent('timeline_milestone_added', { title: trimmedTitle });
      logPlanEvent('timeline_updated', { action: 'add_milestone', title: trimmedTitle });
      scheduleSave(updated);
    },
    [scheduleSave]
  );

  const toggleComplete = useCallback(
    (id: string): void => {
      let isNowCompleted = false;
      const updated = milestonesRef.current.map((m) => {
        if (m.id === id) {
          isNowCompleted = !m.completed;
          return { ...m, completed: isNowCompleted };
        }
        return m;
      });
      setMilestones(updated);
      logPlanEvent('timeline_milestone_completed', { milestoneId: id, completed: isNowCompleted });
      logPlanEvent('timeline_updated', { action: 'toggle_complete', id });
      if (userId && isNowCompleted) {
        recordMilestoneCompletion(userId, id).catch(() => {});
      }
      scheduleSave(updated);
    },
    [scheduleSave, userId]
  );

  const removeMilestone = useCallback(
    (id: string): void => {
      const updated = milestonesRef.current.filter((m) => m.id !== id);
      setMilestones(updated);
      logPlanEvent('timeline_updated', { action: 'remove_milestone', id });
      scheduleSave(updated);
    },
    [scheduleSave]
  );

  const resetToDefaults = useCallback(
    (type: EventType): void => {
      const templates = TIMELINE_TEMPLATES[type] ?? TIMELINE_TEMPLATES.wedding;
      const defaults: TimelineMilestone[] = templates.map((tpl, idx) => ({
        id: `template-${type}-${idx}`,
        title: tpl.title,
        dueDate: getDateOffset(tpl.dueDateOffsetDays),
        completed: false,
        notes: '',
      }));
      setMilestones(defaults);
      logPlanEvent('timeline_updated', { action: 'reset_defaults', eventType: type });
      scheduleSave(defaults);
    },
    [scheduleSave]
  );

  return {
    milestones,
    percentComplete,
    addMilestone,
    toggleComplete,
    removeMilestone,
    resetToDefaults,
  };
};
