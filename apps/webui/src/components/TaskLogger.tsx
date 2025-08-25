import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  source?: string;
}

interface TaskLoggerProps {
  className?: string;
}

export const TaskLogger: React.FC<TaskLoggerProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 添加日志条目
  const addLog = (level: LogEntry['level'], message: string, source?: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      source
    };

    setLogs(prev => {
      const updated = [...prev, newLog];
      // 只保留最近50条日志
      return updated.slice(-50);
    });
  };

  // 模拟一些初始日志
  useEffect(() => {
    const initialLogs = [
      { level: 'info' as const, message: '系统初始化完成', source: 'System' },
      { level: 'success' as const, message: 'Background Manager 启动成功', source: 'Background' },
      { level: 'info' as const, message: 'GPS定位服务已启用', source: 'Location' },
      { level: 'success' as const, message: '时钟模块就绪', source: 'TimeDisplay' },
      { level: 'info' as const, message: '音乐整理器待命中', source: 'MusicOrganizer' }
    ];

    let delay = 500;
    initialLogs.forEach((log, index) => {
      setTimeout(() => {
        addLog(log.level, log.message, log.source);
      }, delay + index * 800);
    });
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // 获取日志级别的颜色和图标
  const getLogStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return {
          color: 'rgba(192, 197, 206, 0.8)',
          icon: '●',
          bgColor: 'rgba(192, 197, 206, 0.05)'
        };
      case 'success':
        return {
          color: 'rgba(34, 197, 94, 0.9)',
          icon: '✓',
          bgColor: 'rgba(34, 197, 94, 0.05)'
        };
      case 'warning':
        return {
          color: 'rgba(251, 191, 36, 0.9)',
          icon: '!',
          bgColor: 'rgba(251, 191, 36, 0.05)'
        };
      case 'error':
        return {
          color: 'rgba(239, 68, 68, 0.9)',
          icon: '✗',
          bgColor: 'rgba(239, 68, 68, 0.05)'
        };
      default:
        return {
          color: 'rgba(192, 197, 206, 0.6)',
          icon: '○',
          bgColor: 'rgba(192, 197, 206, 0.03)'
        };
    }
  };

  // 格式化时间戳
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
    addLog('info', '日志已清除', 'TaskLogger');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
      className={`h-full flex flex-col ${className}`}
    >
      {/* 日志标题栏 */}
      <div
        className="flex items-center justify-between p-3 rounded-t-lg"
        style={{
          background: 'rgba(192, 197, 206, 0.05)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          borderBottom: 'none'
        }}
      >
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="rgba(192, 197, 206, 0.6)" />
              <circle cx="12" cy="12" r="10" stroke="rgba(192, 197, 206, 0.3)" strokeWidth="1" strokeDasharray="8 4" />
            </svg>
          </motion.div>
          <span className="text-white/80 text-sm font-mono uppercase tracking-wider">
            任务日志
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="w-6 h-6 flex items-center justify-center rounded text-white/60 hover:text-white/80 transition-colors"
            title={isVisible ? "隐藏日志" : "显示日志"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d={isVisible ? "M2 6h8" : "M6 2v8M2 6h8"} />
            </svg>
          </button>
          <button
            onClick={clearLogs}
            className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white/70 transition-colors"
            title="清除日志"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
              <path d="M3 3l6 6M3 9l6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 日志内容区域 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-hidden rounded-b-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(192, 197, 206, 0.15)',
              borderTop: 'none'
            }}
          >
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto overflow-x-hidden p-2 space-y-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(192, 197, 206, 0.3) transparent'
              }}
            >
              <AnimatePresence>
                {logs.map((log, index) => {
                  const style = getLogStyle(log.level);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index === logs.length - 1 ? 0.1 : 0
                      }}
                      className="flex items-start space-x-2 p-2 rounded text-xs font-mono group"
                      style={{ background: style.bgColor }}
                    >
                      <div
                        className="flex-shrink-0 w-4 text-center mt-0.5"
                        style={{ color: style.color }}
                      >
                        {style.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs opacity-70"
                            style={{ color: style.color }}
                          >
                            {log.source && `[${log.source}]`}
                          </span>
                          <span className="text-white/40 text-xs">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div 
                          className="leading-4 break-words"
                          style={{ color: style.color }}
                        >
                          {log.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* 底部填充，确保新日志可见 */}
              <div className="h-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 日志统计 */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 flex items-center justify-between text-xs font-mono"
        >
          <div className="text-white/40">
            {logs.length} entries
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
              <span className="text-white/40">
                {logs.filter(l => l.level === 'success').length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <span className="text-white/40">
                {logs.filter(l => l.level === 'warning').length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <span className="text-white/40">
                {logs.filter(l => l.level === 'error').length}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// 全局日志函数 - 可以从其他组件调用
let globalLoggerInstance: ((level: LogEntry['level'], message: string, source?: string) => void) | null = null;

export const useTaskLogger = () => {
  const addLog = (level: LogEntry['level'], message: string, source?: string) => {
    if (globalLoggerInstance) {
      globalLoggerInstance(level, message, source);
    }
  };

  return { addLog };
};

// 设置全局日志实例（在TaskLogger组件内部使用）
export const setGlobalLoggerInstance = (instance: (level: LogEntry['level'], message: string, source?: string) => void) => {
  globalLoggerInstance = instance;
};