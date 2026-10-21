/**
 * @module EventGenie/Components
 * @description Central barrel re-exporting all accessible UI components for EventGenie
 * @version 1.0.0
 * @license MIT
 */

/** Error boundary component for caught exceptions */
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

/** Navigation header component */
export { Header } from './Header';
export type { HeaderProps } from './Header';

/** Welcome notification banner for returning users */
export { WelcomeBanner } from './WelcomeBanner';
export type { WelcomeBannerProps } from './WelcomeBanner';

/** Event type selection radio group */
export { EventTypeSelector } from './EventTypeSelector';
export type { EventTypeSelectorProps } from './EventTypeSelector';

/** AI planning chat interface */
export { ChatInterface } from './ChatInterface';
export type { ChatInterfaceProps } from './ChatInterface';

/** Interactive budget tracker and expense table */
export { BudgetTracker } from './BudgetTracker';
export type { BudgetTrackerProps } from './BudgetTracker';

/** Event timeline and milestone planner */
export { TimelineView } from './TimelineView';
export type { TimelineViewProps } from './TimelineView';

/** Vendor management and quote checklist */
export { VendorChecklist } from './VendorChecklist';
export type { VendorChecklistProps } from './VendorChecklist';

/** Personalized event idea spark generator */
export { IdeaGenerator } from './IdeaGenerator';
export type { IdeaGeneratorProps } from './IdeaGenerator';
