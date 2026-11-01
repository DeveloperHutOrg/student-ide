import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('[ErrorBoundary] Caught unhandled React error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#181825] text-center select-none border border-[#313244] rounded-lg m-2">
          <div className="w-12 h-12 rounded-full bg-[#f38ba8]/20 flex items-center justify-center text-[#f38ba8] mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Something went wrong rendering this component'}
          </h3>
          <p className="text-xs text-[#a6adc8] max-w-md mb-4 font-mono bg-[#11111b] p-3 rounded border border-[#313244] text-left overflow-auto max-h-32">
            {this.state.error?.message || 'An unknown error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] rounded-lg text-xs font-semibold transition-colors shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
