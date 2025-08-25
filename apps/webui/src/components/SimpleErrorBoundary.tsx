import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SimpleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
          <div className="text-white/70 text-center">
            <div className="text-xl mb-4">🚀 天宫科技</div>
            <div className="text-sm opacity-70">系统启动中...</div>
            <div className="text-xs opacity-50 mt-2">正在重新初始化组件...</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}