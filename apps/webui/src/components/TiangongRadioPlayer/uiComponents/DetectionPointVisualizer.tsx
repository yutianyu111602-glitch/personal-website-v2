/**
 * 检测点可视化组件
 * 显示所有检测点的实时状态和触发信息
 * 采用模块化设计，易于维护和扩展
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { detectionPointManager } from '../DetectionPointManager';
import type { DetectionPointState, DetectionPoint } from '../types';
import { FREQUENCY_DETECTION_POINTS, STRUCTURE_DETECTION_POINTS } from '../detectionPoints';

// 检测点卡片组件
interface DetectionPointCardProps {
  point: DetectionPoint;
  state: DetectionPointState;
  onToggle: (pointId: string, enabled: boolean) => void;
}

const DetectionPointCard: React.FC<DetectionPointCardProps> = React.memo(({ 
  point, 
  state, 
  onToggle 
}) => {
  const intensityColor = useMemo(() => {
    if (!state.isActive) return 'bg-gray-100';
    if (state.intensity > 0.7) return 'bg-red-500';
    if (state.intensity > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [state.isActive, state.intensity]);

  const intensityWidth = useMemo(() => {
    return `${Math.min(100, state.intensity * 100)}%`;
  }, [state.intensity]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${intensityColor} transition-colors duration-200`} />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {point.name}
          </h3>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={point.enabled}
            onChange={(e) => onToggle(point.id, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* 描述 */}
      <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
        {point.description}
      </p>

      {/* 强度条 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>强度</span>
          <span>{state.intensity.toFixed(3)}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-200 ${intensityColor}`}
            style={{ width: intensityWidth }}
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-500 dark:text-gray-400">
          <div>触发次数</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {state.triggerCount}
          </div>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          <div>峰值强度</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {state.peakIntensity.toFixed(3)}
          </div>
        </div>
      </div>

      {/* 配置信息 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div>阈值: {point.threshold.value.toFixed(2)}</div>
          <div>优先级: {point.priority}</div>
          <div>类别: {point.category}</div>
        </div>
      </div>
    </div>
  );
});

DetectionPointCard.displayName = 'DetectionPointCard';

// 检测点分类组件
interface DetectionPointCategoryProps {
  title: string;
  points: DetectionPoint[];
  states: Record<string, DetectionPointState>;
  onToggle: (pointId: string, enabled: boolean) => void;
}

const DetectionPointCategory: React.FC<DetectionPointCategoryProps> = React.memo(({ 
  title, 
  points, 
  states, 
  onToggle 
}) => {
  const enabledPoints = points.filter(p => p.enabled);
  const activeCount = enabledPoints.filter(p => states[p.id]?.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeCount}/{enabledPoints.length} 激活
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledPoints.map(point => (
          <DetectionPointCard
            key={point.id}
            point={point}
            state={states[point.id] || {
              pointId: point.id,
              isActive: false,
              intensity: 0,
              lastTriggered: 0,
              triggerCount: 0,
              averageIntensity: 0,
              peakIntensity: 0
            }}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
});

DetectionPointCategory.displayName = 'DetectionPointCategory';

// 性能监控组件
interface PerformanceMonitorProps {
  metrics: {
    averageUpdateTime: number;
    maxUpdateTime: number;
    updateCount: number;
  };
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = React.memo(({ metrics }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
        性能监控
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.averageUpdateTime.toFixed(2)}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">平均更新(ms)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.maxUpdateTime.toFixed(2)}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">最大更新(ms)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.updateCount}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">更新次数</div>
        </div>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// 主检测点可视化组件
interface DetectionPointVisualizerProps {
  className?: string;
  language?: string;
}

export const DetectionPointVisualizer: React.FC<DetectionPointVisualizerProps> = ({ 
  className = '',
  language = 'zh'
}) => {
  const [states, setStates] = useState<Record<string, DetectionPointState>>({});
  const [managerState, setManagerState] = useState(detectionPointManager.getState());
  const [isExpanded, setIsExpanded] = useState(false);

  // 更新检测点状态
  const updateStates = useCallback(() => {
    const newStates = detectionPointManager.getAllPointStates();
    setStates(newStates);
  }, []);

  // 更新管理器状态
  const updateManagerState = useCallback(() => {
    const newManagerState = detectionPointManager.getState();
    setManagerState(newManagerState);
  }, []);

  // 切换检测点启用状态
  const handleTogglePoint = useCallback((pointId: string, enabled: boolean) => {
    detectionPointManager.setPointEnabled(pointId, enabled);
    updateManagerState();
  }, [updateManagerState]);

  // 启动/停止检测点管理器
  const handleToggleManager = useCallback(() => {
    if (managerState.isEnabled) {
      detectionPointManager.stop();
    } else {
      detectionPointManager.start();
    }
    updateManagerState();
  }, [managerState.isEnabled, updateManagerState]);

  // 重置所有检测点
  const handleResetAll = useCallback(() => {
    // 这里可以实现重置逻辑
    console.log('🔄 重置所有检测点');
  }, []);

  // 设置定时器更新状态
  useEffect(() => {
    const interval = setInterval(() => {
      updateStates();
      updateManagerState();
    }, 100); // 10fps更新

    return () => clearInterval(interval);
  }, [updateStates, updateManagerState]);

  // 组件挂载时启动管理器
  useEffect(() => {
    if (!managerState.isEnabled) {
      detectionPointManager.start();
      updateManagerState();
    }
  }, [updateManagerState]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 注意：这里不停止管理器，因为可能其他组件也在使用
      // 只有在确定没有其他组件使用时才停止
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            检测点可视化系统
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${managerState.isEnabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {managerState.isEnabled ? '运行中' : '已停止'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleManager}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              managerState.isEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
            }`}
          >
            {managerState.isEnabled ? '停止' : '启动'}
          </button>
          
          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            重置
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
      </div>

      {/* 性能监控 */}
      {isExpanded && (
        <PerformanceMonitor metrics={managerState.performanceMetrics} />
      )}

      {/* 频段检测点 */}
      <DetectionPointCategory
        title="频段检测点"
        points={FREQUENCY_DETECTION_POINTS}
        states={states}
        onToggle={handleTogglePoint}
      />

      {/* 音乐结构检测点 */}
      <DetectionPointCategory
        title="音乐结构检测点"
        points={STRUCTURE_DETECTION_POINTS}
        states={states}
        onToggle={handleTogglePoint}
      />

      {/* 统计信息 */}
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            系统统计
          </h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Object.keys(states).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总检测点</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {Object.values(states).filter((s: DetectionPointState) => s.isActive).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">激活中</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Object.values(states).reduce((sum: number, s: DetectionPointState) => sum + s.triggerCount, 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总触发</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {managerState.errorCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">错误数</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionPointVisualizer;
