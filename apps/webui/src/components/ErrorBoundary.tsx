/**
 * 错误边界组件 - 天宫科技全屏视觉体验应用
 * 
 * 功能特点：
 * - 捕获JavaScript错误，防止整个应用崩溃
 * - 提供优雅的错误展示和恢复机制
 * - 支持错误上报和调试信息
 * - 银色主题统一设计
 * - 兼容Cursor部署环境
 * 
 * 作者：麻蛇 @ 天宫科技
 * 版本：v4.1 - 增强兼容性和稳定性
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 错误信息接口定义
interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

// 错误边界状态接口
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorDetails: ErrorDetails | null;
  errorId: string;
  retryCount: number;
  isRecovering: boolean;
}

// 错误边界属性接口
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
  className?: string;
}

/**
 * 错误边界主组件
 * 
 * 提供全面的错误捕获和恢复机制
 * 支持自动重试和手动恢复
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;
  private readonly maxRetries: number;
  private readonly enableRecovery: boolean;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.maxRetries = props.maxRetries || 3;
    this.enableRecovery = props.enableRecovery !== false;

    this.state = {
      hasError: false,
      error: null,
      errorDetails: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false
    };
  }

  /**
   * 静态方法：从错误中生成新状态
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      isRecovering: false
    };
  }

  /**
   * 错误捕获处理
   * 收集详细的错误信息用于调试和上报
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 生成详细的错误信息
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    this.setState({ errorDetails });

    // 错误日志记录
    this.logError(error, errorDetails);

    // 调用外部错误处理器
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // 自动恢复机制
    if (this.enableRecovery && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRecovery();
    }
  }

  /**
   * 获取用户ID（如果有）
   */
  private getUserId(): string | undefined {
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 错误日志记录
   */
  private logError(error: Error, details: ErrorDetails) {
    try {
      // 控制台错误日志
      console.group(`🚨 Error Boundary Caught Error [${details.timestamp}]`);
      console.error('Error:', error);
      console.error('Details:', details);
      console.error('Component Stack:', details.componentStack);
      console.groupEnd();

      // 本地存储错误日志（用于调试）
      const errorLog = {
        id: this.state.errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        details,
        timestamp: details.timestamp
      };

      const existingLogs = this.getStoredErrorLogs();
      existingLogs.push(errorLog);
      
      // 只保留最近10条错误日志
      const recentLogs = existingLogs.slice(-10);
      
      localStorage.setItem('tiangong_error_logs', JSON.stringify(recentLogs));
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  /**
   * 获取存储的错误日志
   */
  private getStoredErrorLogs(): any[] {
    try {
      const logs = localStorage.getItem('tiangong_error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 计划自动恢复
   */
  private scheduleAutoRecovery() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // 指数退避，最大10秒

    this.retryTimer = setTimeout(() => {
      this.handleRecovery(true);
    }, delay);
  }

  /**
   * 处理恢复
   */
  private handleRecovery = (isAutoRecovery = false) => {
    if (this.state.retryCount >= this.maxRetries && isAutoRecovery) {
      console.warn('已达到最大重试次数，停止自动恢复');
      return;
    }

    this.setState({
      isRecovering: true
    });

    // 短暂延迟后重置状态
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorDetails: null,
        errorId: '',
        retryCount: this.state.retryCount + 1,
        isRecovering: false
      });

      console.log(`🔄 错误边界恢复尝试 ${this.state.retryCount + 1}/${this.maxRetries}`);
    }, 500);
  }

  /**
   * 重置错误状态
   */
  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorDetails: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false
    });
  }

  /**
   * 清理定时器
   */
  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  /**
   * 渲染错误回退UI
   */
  private renderErrorFallback() {
    const { error, errorDetails, retryCount, isRecovering } = this.state;
    const { showErrorDetails = false } = this.props;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full h-full min-h-screen bg-black flex items-center justify-center p-8"
      >
        <div className="max-w-md w-full">
          {/* 错误图标和标题 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="text-red-400"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-xl font-light text-white/90 mb-2">
              应用遇到错误
            </h2>
            <p className="text-white/60 text-sm">
              系统正在尝试恢复，请稍候...
            </p>
          </motion.div>

          {/* 错误信息 */}
          {showErrorDetails && error && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="minimal-glass rounded-xl p-6 mb-6"
            >
              <h3 className="text-white/80 text-sm font-medium mb-3">错误详情</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="text-red-400">
                  {error.name}: {error.message}
                </div>
                {errorDetails && (
                  <div className="text-white/40">
                    时间: {new Date(errorDetails.timestamp).toLocaleString()}
                  </div>
                )}
                <div className="text-white/40">
                  重试次数: {retryCount}/{this.maxRetries}
                </div>
              </div>
            </motion.div>
          )}

          {/* 恢复状态指示 */}
          <AnimatePresence>
            {isRecovering && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="minimal-glass rounded-xl p-4 mb-6 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full mx-auto mb-2"
                />
                <div className="text-white/70 text-sm">正在恢复...</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 操作按钮 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex space-x-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={this.handleRecovery}
              disabled={isRecovering}
              className="flex-1 minimal-glass rounded-xl px-4 py-3 text-white/80 hover:text-white/95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium">
                {isRecovering ? '恢复中...' : '手动重试'}
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="flex-1 minimal-glass rounded-xl px-4 py-3 text-white/80 hover:text-white/95 transition-all duration-300"
            >
              <div className="text-sm font-medium">刷新页面</div>
            </motion.button>
          </motion.div>

          {/* 版权信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center mt-8"
          >
            <div className="text-white/20 text-xs font-mono">
              @天宫科技 Made By 麻蛇
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  /**
   * 渲染方法
   */
  render() {
    const { hasError, isRecovering } = this.state;
    const { children, fallback, className = '' } = this.props;

    // 如果有错误，显示错误回退UI
    if (hasError) {
      return (
        <div className={`error-boundary ${className}`}>
          <AnimatePresence mode="wait">
            {fallback || this.renderErrorFallback()}
          </AnimatePresence>
        </div>
      );
    }

    // 正常渲染子组件
    return (
      <div className={`error-boundary ${className}`}>
        {children}
      </div>
    );
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook：在函数组件中使用错误边界
 */
export function useErrorHandler() {
  return {
    /**
     * 手动触发错误
     */
    throwError: (error: Error) => {
      throw error;
    },
    
    /**
     * 安全执行函数，捕获错误
     */
    safeExecute: async function<T>(fn: () => Promise<T> | T, fallback?: T): Promise<T | undefined> {
      try {
        return await fn();
      } catch (error) {
        console.error('Safe execution failed:', error);
        return fallback;
      }
    },
    
    /**
     * 获取错误日志
     */
    getErrorLogs: (): any[] => {
      try {
        const logs = localStorage.getItem('tiangong_error_logs');
        return logs ? JSON.parse(logs) : [];
      } catch {
        return [];
      }
    },
    
    /**
     * 清除错误日志
     */
    clearErrorLogs: () => {
      try {
        localStorage.removeItem('tiangong_error_logs');
      } catch (error) {
        console.error('Failed to clear error logs:', error);
      }
    }
  };
}

export default ErrorBoundary;