/**
 * @module EventGenie/EventTypeSelector
 * @description Accessible radio card selector for event personas with arrow key navigation
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { KeyboardEvent, useCallback, useRef } from 'react';

// --- Internal Modules ---
import { EventType } from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';

/** Props interface for the EventTypeSelector component */
export interface EventTypeSelectorProps {
  selectedType: EventType;
  onSelect: (type: EventType) => void;
}

const EventTypeSelectorComponent: React.FC<EventTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSelect = useCallback(
    (type: EventType): void => {
      onSelect(type);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, currentIndex: number): void => {
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % EVENT_TYPE_CONFIG.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + EVENT_TYPE_CONFIG.length) % EVENT_TYPE_CONFIG.length;
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        const currentConfig = EVENT_TYPE_CONFIG[currentIndex];
        if (currentConfig) {
          onSelect(currentConfig.type);
        }
        return;
      } else {
        return;
      }

      const nextConfig = EVENT_TYPE_CONFIG[nextIndex];
      if (nextConfig) {
        onSelect(nextConfig.type);
        cardRefs.current[nextIndex]?.focus();
      }
    },
    [onSelect]
  );

  return (
    <fieldset className="w-full border-0 p-0 m-0 mb-8" aria-labelledby="event-selector-legend">
      <legend id="event-selector-legend" className="text-lg font-bold text-slate-900 mb-3 block">
        Choose Your Event Type
      </legend>
      <div
        role="radiogroup"
        aria-label="Select event type"
        aria-labelledby="event-selector-legend"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {EVENT_TYPE_CONFIG.map((config, idx) => {
          const isSelected = selectedType === config.type;
          return (
            <div
              key={config.type}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleSelect(config.type)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`min-h-[110px] p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isSelected
                  ? 'border-orange-500 bg-orange-50/60 shadow-md ring-2 ring-orange-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl" aria-hidden="true">
                  {config.icon}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{config.label}</h3>
                  <span
                    className={`text-xs uppercase font-semibold tracking-wider ${
                      isSelected ? 'text-orange-600' : 'text-slate-500'
                    }`}
                  >
                    {config.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{config.description}</p>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

/**
 * Event type persona selection component providing keyboard-navigable radio options
 */
export const EventTypeSelector = React.memo(EventTypeSelectorComponent);
