/**
 * @module EventGenie/TimelineView
 * @description Accessible timeline and milestone manager with overdue alerts and completion progress
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useMemo, useCallback, FormEvent } from 'react';

// --- Internal Modules ---
import { TimelineMilestone } from '../types';
import { logPlanEvent } from '../firebase';

/** Props interface for the TimelineView component */
export interface TimelineViewProps {
  milestones: TimelineMilestone[];
  percentComplete?: number;
  onToggleComplete: (id: string) => void;
  onAddMilestone: (title: string, dueDate: string, notes?: string) => void;
  onRemoveMilestone: (id: string) => void;
}

const TimelineViewComponent: React.FC<TimelineViewProps> = ({
  milestones,
  percentComplete = 0,
  onToggleComplete,
  onAddMilestone,
  onRemoveMilestone,
}) => {
  const [title, setTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [milestones]);

  const handleAddSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      if (!title.trim()) {
        return;
      }
      onAddMilestone(title, dueDate, notes);
      logPlanEvent('timeline_milestone_added', { title });
      setTitle('');
      setDueDate('');
      setNotes('');
    },
    [title, dueDate, notes, onAddMilestone]
  );

  const handleToggle = useCallback(
    (id: string, currentCompleted: boolean): void => {
      onToggleComplete(id);
      logPlanEvent('timeline_milestone_completed', { milestoneId: id, completed: !currentCompleted });
    },
    [onToggleComplete]
  );

  const handleRemove = useCallback(
    (id: string): void => {
      onRemoveMilestone(id);
      logPlanEvent('timeline_updated', { action: 'remove_milestone', id });
    },
    [onRemoveMilestone]
  );

  const todayIso = new Date().toISOString().split('T')[0] ?? '';

  return (
    <section
      role="region"
      aria-label="Event timeline"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Planning Timeline & Milestones</h2>
          <p className="text-xs text-slate-500">Track key deadlines leading up to your big event day in chronological order</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Progress:</span>
          <span className="text-base font-bold text-emerald-600">{percentComplete}% Done</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="h-3 bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentComplete}%` }}
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Timeline progress percentage"
        />
      </div>

      <div className="space-y-4 mb-8">
        {sortedMilestones.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No milestones planned yet. Add your first milestone below!
          </p>
        ) : (
          sortedMilestones.map((m) => {
            const isOverdue = !m.completed && m.dueDate && m.dueDate < todayIso;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-4 ${
                  m.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isOverdue
                    ? 'bg-red-50/40 border-red-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`milestone-${m.id}`}
                    checked={m.completed}
                    onChange={() => handleToggle(m.id, m.completed)}
                    aria-label={`Mark ${m.title} as complete`}
                    className="mt-1 h-5 w-5 rounded text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`milestone-${m.id}`}
                        className={`text-sm font-semibold cursor-pointer ${
                          m.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {m.title}
                      </label>
                      {m.completed && <span className="text-xs text-emerald-600 font-bold">✓ Complete</span>}
                      {isOverdue && (
                        <span role="alert" className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                      <span>Target: {m.dueDate || 'No date set'}</span>
                      {m.notes && <span>• {m.notes}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  aria-label={`Delete milestone ${m.title}`}
                  className="h-11 px-3 text-xs text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="sm:col-span-2">
          <label htmlFor="milestone-title" className="block text-xs font-semibold text-slate-600 mb-1">
            Milestone Title
          </label>
          <input
            id="milestone-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="e.g. Confirm wedding photographer booking"
            required
          />
        </div>
        <div>
          <label htmlFor="milestone-date" className="block text-xs font-semibold text-slate-600 mb-1">
            Target Due Date
          </label>
          <input
            id="milestone-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
          />
        </div>
        <button
          type="submit"
          aria-label="Add timeline milestone"
          className="h-11 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
        >
          Add Milestone
        </button>
      </form>
    </section>
  );
};

/**
 * Event timeline component rendering milestones, due dates, completion state, and task inputs
 */
export const TimelineView = React.memo(TimelineViewComponent);
