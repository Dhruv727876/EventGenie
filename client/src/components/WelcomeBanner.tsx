/**
 * @module EventGenie/WelcomeBanner
 * @description Accessible banner notifying returning users of restored event planning state
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';

/** Props interface for the WelcomeBanner component */
export interface WelcomeBannerProps {
  isReturningUser: boolean;
  eventType: string;
  onDismiss?: () => void;
}

const WelcomeBannerComponent: React.FC<WelcomeBannerProps> = ({
  isReturningUser,
  eventType,
  onDismiss,
}) => {
  if (!isReturningUser) {
    return null;
  }

  const capitalizedType = eventType.charAt(0).toUpperCase() + eventType.slice(1);

  return (
    <aside
      role="status"
      aria-live="polite"
      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl shadow-md mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl" aria-hidden="true">
          ✨
        </span>
        <div>
          <p className="font-bold text-base">Welcome back!</p>
          <p className="text-xs text-orange-100">
            We restored your saved {capitalizedType} plan and timeline from your previous session.
          </p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss welcome notification"
          className="h-11 px-4 self-end sm:self-center text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus-visible:outline-white"
        >
          Dismiss
        </button>
      )}
    </aside>
  );
};

/**
 * Polite status banner greeting returning users and confirming restored event data
 */
export const WelcomeBanner = React.memo(WelcomeBannerComponent);
