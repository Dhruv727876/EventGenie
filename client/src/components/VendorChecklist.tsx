/**
 * @module EventGenie/VendorChecklist
 * @description Accessible vendor management and supplier procurement checklist with status cycling
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useMemo, FormEvent } from 'react';

// --- Internal Modules ---
import { Vendor } from '../types';
import { logPlanEvent } from '../firebase';

// --- Utilities ---
import { formatCurrency } from '../utils/helpers';

/** Props interface for the VendorChecklist component */
export interface VendorChecklistProps {
  vendors: Vendor[];
  onToggleStatus: (id: string, status: Vendor['status']) => void;
  onAddVendor: (name: string, category: string, contact: string, cost: number) => void;
  onRemoveVendor: (id: string) => void;
}

const STATUS_CYCLE: Record<Vendor['status'], Vendor['status']> = {
  pending: 'contacted',
  contacted: 'booked',
  booked: 'declined',
  declined: 'pending',
};

const STATUS_STYLES: Record<Vendor['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  contacted: 'bg-sky-100 text-sky-800 border-sky-300',
  booked: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  declined: 'bg-rose-100 text-rose-800 border-rose-300',
};

const VendorChecklistComponent: React.FC<VendorChecklistProps> = ({
  vendors,
  onToggleStatus,
  onAddVendor,
  onRemoveVendor,
}) => {
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Catering');
  const [contact, setContact] = useState<string>('');
  const [cost, setCost] = useState<string>('');

  const totalBookedCost = useMemo(() => {
    return vendors
      .filter((v) => v.status === 'booked')
      .reduce((sum, v) => sum + (v.cost ?? 0), 0);
  }, [vendors]);

  const handleToggleExpand = (id: string): void => {
    setExpandedVendorId((prev) => (prev === id ? null : id));
  };

  const handleCycleStatus = (vendor: Vendor): void => {
    const nextStatus = STATUS_CYCLE[vendor.status] ?? 'pending';
    onToggleStatus(vendor.id, nextStatus);
    logPlanEvent('vendor_status_changed', { vendorId: vendor.id, from: vendor.status, to: nextStatus });
    logPlanEvent('vendor_toggled', { vendorId: vendor.id, status: nextStatus });
  };

  const handleAddSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    const costNum = parseFloat(cost) || 0;
    onAddVendor(name, category, contact, costNum);
    logPlanEvent('vendor_toggled', { action: 'add_vendor', name, category });
    setName('');
    setContact('');
    setCost('');
  };

  return (
    <section
      role="region"
      aria-label="Vendor checklist"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vendor Management & Checklist</h2>
          <p className="text-xs text-slate-500">Track quotes, booking stages, and contact info for every supplier</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Total Booked Spend:</span>
          <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(totalBookedCost)}</span>
        </div>
      </div>

      <div role="list" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {vendors.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center col-span-2">
            No vendors registered yet. Add your first service supplier below!
          </p>
        ) : (
          vendors.map((vendor) => {
            const isExpanded = expandedVendorId === vendor.id;
            return (
              <div
                key={vendor.id}
                role="listitem"
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{vendor.name}</h3>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {vendor.category}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {formatCurrency(vendor.cost)}
                  </span>
                </div>

                <div className="flex items-center justify-between my-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(vendor)}
                      aria-label={`Change vendor status for ${vendor.name}, currently ${vendor.status}`}
                      title="Click to cycle status"
                      className={`h-11 px-3 rounded-lg text-xs font-bold border capitalize transition-all ${STATUS_STYLES[vendor.status]}`}
                    >
                      {vendor.status} ↻
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`vendor-details-${vendor.id}`}
                    onClick={() => handleToggleExpand(vendor.id)}
                    className="h-11 px-3 text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 rounded-lg hover:bg-orange-50"
                  >
                    {isExpanded ? 'Hide Details' : 'Details'}
                  </button>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveVendor(vendor.id);
                      logPlanEvent('vendor_toggled', { action: 'remove_vendor', id: vendor.id });
                    }}
                    aria-label={`Remove vendor ${vendor.name}`}
                    className="h-11 px-3 text-xs text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                {isExpanded && (
                  <div id={`vendor-details-${vendor.id}`} className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                    <p>
                      <strong>Contact:</strong> {vendor.contact || 'No contact details specified'}
                    </p>
                    <p>
                      <strong>Current Stage:</strong> <span className="capitalize">{vendor.status}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-2">
          <label htmlFor="vendor-name" className="block text-xs font-semibold text-slate-600 mb-1">
            Vendor / Company Name
          </label>
          <input
            id="vendor-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="e.g. Skyline Photography Studio"
            required
          />
        </div>
        <div>
          <label htmlFor="vendor-category" className="block text-xs font-semibold text-slate-600 mb-1">
            Category
          </label>
          <input
            id="vendor-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="Photography"
          />
        </div>
        <div>
          <label htmlFor="vendor-cost" className="block text-xs font-semibold text-slate-600 mb-1">
            Quoted Cost ($)
          </label>
          <input
            id="vendor-cost"
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-slate-300 rounded-xl"
            placeholder="1200"
          />
        </div>
        <button
          type="submit"
          aria-label="Add new vendor"
          className="h-11 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
        >
          Add Vendor
        </button>
      </form>
    </section>
  );
};

/**
 * Vendor checklist and supplier procurement manager component
 */
export const VendorChecklist = React.memo(VendorChecklistComponent);
