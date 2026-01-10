import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
           <AlertOctagon className="w-16 h-16 text-rose-500 mb-4" />
           <h1 className="text-2xl font-black mb-2">System Failure</h1>
           <p className="text-slate-400 mb-6 max-w-xs">Something went wrong. Don't worry, your data is saved safely.</p>
           <button 
             onClick={() => window.location.reload()} 
             className="px-6 py-3 bg-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700"
           >
             <RefreshCw className="w-4 h-4" /> Reboot System
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;