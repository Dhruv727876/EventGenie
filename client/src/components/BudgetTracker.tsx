/**
 * @module EventGenie/BudgetTracker
 * @description Accessible budget tracking interface with expense breakdown, editing, and warnings
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useCallback, useMemo, FormEvent } from 'react';

// --- Internal Modules ---
import { BudgetItem } from '../types';
import { logPlanEvent } from '../firebase';

// --- Utilities ---
import { formatCurrency } from '../utils/helpers';

/** Props interface for the BudgetTracker component */
export interface BudgetTrackerProps {
  items: BudgetItem[];
  totalEstimated: number;
  totalActual: number;
  percentageUsed: number;
  categoryPercentages?: Record<string, number>;
  onAddItem: (category: string, description: string, estimated: number, actual?: number) => void;
  onUpdateItem?: (id: string, updates: Partial<Omit<BudgetItem, 'id'>>) => void;
  onRemoveItem: (id: string) => void;
}

const BudgetTrackerComponent: React.FC<BudgetTrackerProps> = ({
  items,
  totalEstimated,
  totalActual,
  percentageUsed,
  categoryPercentages = {},
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) => {
  const [category, setCategory] = useState<string>('Venue');
  const [description, setDescription] = useState<string>('');
  const [estimated, setEstimated] = useState<string>('');
  const [actual, setActual] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstimated, setEditEstimated] = useState<string>('');
  const [editActual, setEditActual] = useState<string>('');

  const handleAddSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      const estNum = parseFloat(estimated) || 0;
      const actNum = parseFloat(actual) || 0;
      if (!description.trim()) {
        return;
      }
      onAddItem(category, description, estNum, actNum);
      logPlanEvent('budget_item_added', { category, estimated: estNum });
      setDescription('');
      setEstimated('');
      setActual('');
    },
    [category, description, estimated, actual, onAddItem]
  );

  const startEditing = useCallback((item: BudgetItem): void => {
    setEditingId(item.id);
    setEditEstimated(item.estimated.toString());
    setEditActual(item.actual.toString());
  }, []);

  const saveEdit = useCallback(
    (id: string): void => {
      if (onUpdateItem) {
        onUpdateItem(id, {
          estimated: parseFloat(editEstimated) || 0,
          actual: parseFloat(editActual) || 0,
        });
        logPlanEvent('budget_item_updated', { id });
      }
      setEditingId(null);
    },
    [editEstimated, editActual, onUpdateItem]
  );

  const handleRemove = useCallback(
    (id: string, cat: string): void => {
      onRemoveItem(id);
      logPlanEvent('budget_updated', { action: 'remove_item', id, category: cat });
    },
    [onRemoveItem]
  );

  const categoryEntries = useMemo(() => Object.entries(categoryPercentages), [categoryPercentages]);

  return (
    <section
      role="region"
      aria-label="Budget tracker"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Event Budget Tracker</h2>
          <p className="text-xs text-slate-500">Monitor your allocations and actual expenditures with real-time variances</p>
        </div>
        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Estimated Total
            </span>
            <span className="text-lg font-bold text-slate-800">
              {formatCurrency(totalEstimated)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Actual Spent
            </span>
            <span className={`text-lg font-bold ${totalActual > totalEstimated ? 'text-red-600' : 'text-orange-600'}`}>
              {formatCurrency(totalActual)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Budget Used
            </span>
            <span className={`text-lg font-bold ${percentageUsed > 100 ? 'text-red-600' : 'text-slate-900'}`}>
              {percentageUsed}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar with Over-Budget Warning */}
      <div className="my-6">
        {percentageUsed > 100 && (
          <div
            role="alert"
            className="p-3 mb-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>Warning: Actual spending exceeds your estimated budget by {percentageUsed - 100}%!</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-slate-600">Overall Budget Utilization</span>
          <span className={percentageUsed > 100 ? 'text-red-600 font-bold' : 'text-slate-600'}>
            {percentageUsed > 100 ? `⚠️ Exceeded by ${percentageUsed - 100}%` : `${percentageUsed}% of estimated budget`}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              percentageUsed > 100 ? 'bg-red-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            aria-valuenow={percentageUsed}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget usage percentage"
            role="progressbar"
          />
        </div>
      </div>

      {/* Category Breakdown Badges */}
      {categoryEntries.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase">Category Spend:</span>
          {categoryEntries.map(([cat, pct]) => (
            <span key={cat} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
              {cat}: {pct}%
            </span>
          ))}
        </div>
      )}

      {/* Table of Items */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left text-sm" aria-label="Budget items table">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Description</th>
              <th scope="col" className="px-4 py-3 text-right">Estimated</th>
              <th scope="col" className="px-4 py-3 text-right">Actual</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const isOverBudget = item.actual > item.estimated;
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={`hover:bg-slate-50/50 ${isOverBudget ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-700">{item.category}</td>
                  <td className="px-4 py-3 text-slate-600">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-800 font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editEstimated}
                        onChange={(e) => setEditEstimated(e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-right"
                        aria-label="Edit estimated amount"
                      />
                    ) : (
                      formatCurrency(item.estimated)
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${isOverBudget ? 'text-red-600 font-bold' : 'text-orange-600'}`}>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editActual}
                        onChange={(e) => setEditActual(e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-right"
                        aria-label="Edit actual amount"
                      />
                    ) : (
                      <>
                        {formatCurrency(item.actual)}
                        {isOverBudget && <span className="ml-1 text-[11px] text-red-500 font-normal">⚠️ Over</span>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          className="h-11 px-3 text-xs text-emerald-600 hover:text-emerald-800 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="h-11 px-3 text-xs text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.category)}
                        aria-label={`Remove ${item.category} budget item`}
                        className="h-11 px-3 text-xs text-red-600 hover:text-red-800 font-medium rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label htmlFor="budget-category" className="block text-xs font-semibold text-slate-600 mb-1">
            Category
          </label>
          <input
            id="budget-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="e.g. Venue"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="budget-description" className="block text-xs font-semibold text-slate-600 mb-1">
            Description
          </label>
          <input
            id="budget-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="e.g. Grand Ballroom Deposit"
            required
          />
        </div>
        <div>
          <label htmlFor="budget-estimated" className="block text-xs font-semibold text-slate-600 mb-1">
            Estimated ($)
          </label>
          <input
            id="budget-estimated"
            type="number"
            min="0"
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="1500"
          />
        </div>
        <button
          type="submit"
          aria-label="Add budget item"
          className="h-11 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
        >
          Add Item
        </button>
      </form>
    </section>
  );
};

/**
 * Budget tracking interface component visualizing line items, expenses, and allocation totals
 */
export const BudgetTracker = React.memo(BudgetTrackerComponent);
