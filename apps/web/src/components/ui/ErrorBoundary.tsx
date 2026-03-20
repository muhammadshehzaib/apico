'use client';

import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.resetError) || (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-danger/10 border border-danger rounded-lg p-6 max-w-md">
              <h2 className="text-lg font-semibold text-danger mb-2">
                Something went wrong
              </h2>
              <p className="text-text-muted text-sm mb-4">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-danger text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
