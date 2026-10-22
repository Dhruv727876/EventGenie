/**
 * @module EventGenie/Header
 * @description Accessible navigation header presenting application branding and section tabs
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useCallback } from 'react';

/** Props interface for the Header component */
export interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_TABS = [
  { id: 'chat', label: 'Plan' },
  { id: 'budget', label: 'Budget' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'ideas', label: 'Ideas' },
];

const HeaderComponent: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const handleTabClick = useCallback(
    (tabId: string): void => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <header role="banner" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center space-x-3" aria-label="EventGenie home">
            <span className="text-3xl" aria-hidden="true">
              🧞
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                EventGenie
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                GenAI Planning Assistant for Memorable Moments
              </p>
            </div>
          </div>

          <nav role="navigation" aria-label="Main navigation">
            <div role="tablist" className="flex space-x-2 overflow-x-auto pb-1 md:pb-0" aria-label="Event sections">
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-controls={`tabpanel-${tab.id}`}
                    aria-selected={isActive}
                    onClick={() => handleTabClick(tab.id)}
                    className={`h-11 px-5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

/**
 * Top navigation header component displaying application branding and accessible tab controls
 */
export const Header = React.memo(HeaderComponent);
