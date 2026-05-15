import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="bg-card p-8 rounded-3xl border border-destructive/30 max-w-md w-full">
            <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              The application crashed. This might be due to a configuration error or a network failure.
            </p>
            <div className="bg-black/50 p-4 rounded-xl text-xs font-mono text-left overflow-auto max-h-40 mb-6 text-zinc-500">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-black font-bold rounded-xl"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
