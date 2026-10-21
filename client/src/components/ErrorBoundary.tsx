/**
 * @module EventGenie/ErrorBoundary
 * @description Accessible React error boundary capturing render lifecycle errors
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { Component, ErrorInfo, ReactNode } from 'react';

// --- Utilities ---
import { logError } from '../utils/logger';

/** Props interface for the ErrorBoundary component */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class InternalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError(`Error caught in boundary: ${error.message}`, errorInfo.componentStack);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 my-4 bg-red-50 border border-red-200 rounded-xl text-red-900 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm mb-4">
            An unexpected error occurred while loading this section of the planner.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-11 px-6 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryWrapper: React.FC<ErrorBoundaryProps> = (props) => {
  return <InternalErrorBoundary {...props} />;
};

/**
 * Error boundary component catching rendering exceptions and displaying fallback UI
 */
export const ErrorBoundary = React.memo(ErrorBoundaryWrapper);
