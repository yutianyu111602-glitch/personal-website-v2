import { useState, useEffect, useCallback, useMemo } from 'react';

// 智能布局状态
interface SmartLayoutState {
  // 屏幕区域占用情况
  occupiedZones: {
    topCenter: boolean;
    topLeft: boolean;
    topRight: boolean;
    centerLeft: boolean;
    center: boolean;
    centerRight: boolean;
    bottomLeft: boolean;
    bottomCenter: boolean;
    bottomRight: boolean;
  };
  
  // 模块位置映射
  modulePositions: Record<string, {
    zone: keyof SmartLayoutState['occupiedZones'];
    offset?: { x: number; y: number };
    priority: number;
  }>;
  
  // 是否有活跃的弹窗或模态
  hasActivePopup: boolean;
  hasActiveModal: boolean;
  
  // 当前屏幕尺寸类别
  screenSize: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
}

// 模块配置
interface ModuleConfig {
  id: string;
  preferredZone: keyof SmartLayoutState['occupiedZones'];
  fallbackZones: (keyof SmartLayoutState['occupiedZones'])[];
  priority: number;
  canRelocate: boolean;
  minDistance: number; // 与其他模块的最小距离
}

const DEFAULT_MODULE_CONFIGS: Record<string, ModuleConfig> = {
  'clock-console': {
    id: 'clock-console',
    preferredZone: 'topCenter',
    fallbackZones: ['topLeft', 'topRight', 'centerLeft', 'centerRight'],
    priority: 10,
    canRelocate: true,
    minDistance: 100
  },
  'radio-player': {
    id: 'radio-player',
    preferredZone: 'bottomCenter',
    fallbackZones: ['bottomLeft', 'bottomRight', 'centerLeft', 'centerRight'],
    priority: 8,
    canRelocate: true,
    minDistance: 80
  },
  'info-panel': {
    id: 'info-panel',
    preferredZone: 'bottomCenter',
    fallbackZones: ['bottomLeft', 'bottomRight', 'centerRight'],
    priority: 6,
    canRelocate: true,
    minDistance: 60
  },
  'control-button': {
    id: 'control-button',
    preferredZone: 'bottomRight',
    fallbackZones: ['bottomLeft', 'centerRight', 'topRight'],
    priority: 5,
    canRelocate: true,
    minDistance: 40
  },
  'status-indicator': {
    id: 'status-indicator',
    preferredZone: 'topRight',
    fallbackZones: ['topLeft', 'centerRight'],
    priority: 4,
    canRelocate: true,
    minDistance: 40
  }
};

export const useSmartLayout = () => {
  const [layoutState, setLayoutState] = useState<SmartLayoutState>({
    occupiedZones: {
      topCenter: false,
      topLeft: false,
      topRight: false,
      centerLeft: false,
      center: false,
      centerRight: false,
      bottomLeft: false,
      bottomCenter: false,
      bottomRight: false
    },
    modulePositions: {},
    hasActivePopup: false,
    hasActiveModal: false,
    screenSize: 'desktop'
  });

  // 检测屏幕尺寸
  const detectScreenSize = useCallback((): SmartLayoutState['screenSize'] => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1920) return 'desktop';
    return 'ultrawide';
  }, []);

  // 更新屏幕尺寸
  const updateScreenSize = useCallback(() => {
    const newSize = detectScreenSize();
    setLayoutState(prev => ({
      ...prev,
      screenSize: newSize
    }));
  }, [detectScreenSize]);

  // 获取区域的像素坐标
  const getZoneCoordinates = useCallback((zone: keyof SmartLayoutState['occupiedZones']) => {
    const { innerWidth: vw, innerHeight: vh } = window;
    
    const coordinates = {
      topLeft: { x: vw * 0.1, y: vh * 0.1 },
      topCenter: { x: vw * 0.5, y: vh * 0.1 },
      topRight: { x: vw * 0.9, y: vh * 0.1 },
      centerLeft: { x: vw * 0.1, y: vh * 0.5 },
      center: { x: vw * 0.5, y: vh * 0.5 },
      centerRight: { x: vw * 0.9, y: vh * 0.5 },
      bottomLeft: { x: vw * 0.1, y: vh * 0.9 },
      bottomCenter: { x: vw * 0.5, y: vh * 0.9 },
      bottomRight: { x: vw * 0.9, y: vh * 0.9 }
    };

    return coordinates[zone];
  }, []);

  // 计算最佳位置
  const calculateOptimalPosition = useCallback((moduleId: string) => {
    const config = DEFAULT_MODULE_CONFIGS[moduleId];
    if (!config) return null;

    // 检查首选区域是否可用
    if (!layoutState.occupiedZones[config.preferredZone]) {
      return {
        zone: config.preferredZone,
        coordinates: getZoneCoordinates(config.preferredZone),
        offset: { x: 0, y: 0 }
      };
    }

    // 尝试备选区域
    for (const fallbackZone of config.fallbackZones) {
      if (!layoutState.occupiedZones[fallbackZone]) {
        return {
          zone: fallbackZone,
          coordinates: getZoneCoordinates(fallbackZone),
          offset: { x: 0, y: 0 }
        };
      }
    }

    // 如果所有区域都被占用，在首选区域添加偏移
    const baseCoords = getZoneCoordinates(config.preferredZone);
    const offset = {
      x: Math.random() * 100 - 50, // -50px 到 +50px
      y: Math.random() * 100 - 50
    };

    return {
      zone: config.preferredZone,
      coordinates: baseCoords,
      offset
    };
  }, [layoutState.occupiedZones, getZoneCoordinates]);

  // 请求位置分配
  const requestPosition = useCallback((
    moduleId: string,
    options: {
      priority?: number;
      preferredZone?: keyof SmartLayoutState['occupiedZones'];
      canRelocate?: boolean;
    } = {}
  ) => {
    const position = calculateOptimalPosition(moduleId);
    if (!position) return null;

    // 更新布局状态
    setLayoutState(prev => ({
      ...prev,
      occupiedZones: {
        ...prev.occupiedZones,
        [position.zone]: true
      },
      modulePositions: {
        ...prev.modulePositions,
        [moduleId]: {
          zone: position.zone,
          offset: position.offset,
          priority: options.priority || DEFAULT_MODULE_CONFIGS[moduleId]?.priority || 1
        }
      }
    }));

    return {
      x: position.coordinates.x + position.offset.x,
      y: position.coordinates.y + position.offset.y,
      zone: position.zone
    };
  }, [calculateOptimalPosition]);

  // 释放位置
  const releasePosition = useCallback((moduleId: string) => {
    setLayoutState(prev => {
      const modulePos = prev.modulePositions[moduleId];
      if (!modulePos) return prev;

      const newModulePositions = { ...prev.modulePositions };
      delete newModulePositions[moduleId];

      // 检查是否还有其他模块占用这个区域
      const stillOccupied = Object.values(newModulePositions).some(
        pos => pos.zone === modulePos.zone
      );

      return {
        ...prev,
        occupiedZones: {
          ...prev.occupiedZones,
          [modulePos.zone]: stillOccupied
        },
        modulePositions: newModulePositions
      };
    });
  }, []);

  // 设置弹窗状态
  const setPopupState = useCallback((hasPopup: boolean) => {
    setLayoutState(prev => ({
      ...prev,
      hasActivePopup: hasPopup
    }));
  }, []);

  // 设置模态状态
  const setModalState = useCallback((hasModal: boolean) => {
    setLayoutState(prev => ({
      ...prev,
      hasActiveModal: hasModal
    }));
  }, []);

  // 获取避让建议
  const getAvoidanceSuggestion = useCallback((moduleId: string) => {
    const currentPos = layoutState.modulePositions[moduleId];
    if (!currentPos || !layoutState.hasActivePopup) return null;

    // 弹窗活跃时的避让逻辑
    if (currentPos.zone === 'bottomCenter' && layoutState.hasActivePopup) {
      // 底部中央模块向上移动
      return {
        offset: { x: 0, y: -60 },
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };
    }

    if (currentPos.zone === 'bottomRight' && layoutState.hasActivePopup) {
      // 底部右侧模块稍微左移
      return {
        offset: { x: -20, y: -20 },
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };
    }

    return null;
  }, [layoutState]);

  // 重新计算所有模块位置
  const recalculateLayout = useCallback(() => {
    const newModulePositions: Record<string, any> = {};
    const newOccupiedZones = { ...layoutState.occupiedZones };

    // 重置所有区域
    Object.keys(newOccupiedZones).forEach(zone => {
      newOccupiedZones[zone as keyof typeof newOccupiedZones] = false;
    });

    // 按优先级重新分配位置
    const sortedModules = Object.entries(layoutState.modulePositions)
      .sort(([, a], [, b]) => b.priority - a.priority);

    sortedModules.forEach(([moduleId, currentPos]) => {
      const optimalPos = calculateOptimalPosition(moduleId);
      if (optimalPos) {
        newModulePositions[moduleId] = {
          zone: optimalPos.zone,
          offset: optimalPos.offset,
          priority: currentPos.priority
        };
        newOccupiedZones[optimalPos.zone] = true;
      }
    });

    setLayoutState(prev => ({
      ...prev,
      occupiedZones: newOccupiedZones,
      modulePositions: newModulePositions
    }));
  }, [layoutState, calculateOptimalPosition]);

  // 响应屏幕尺寸变化
  useEffect(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, [updateScreenSize]);

  // 屏幕尺寸变化时重新计算布局
  useEffect(() => {
    recalculateLayout();
  }, [layoutState.screenSize]);

  return {
    // 状态
    layoutState,
    screenSize: layoutState.screenSize,
    hasActivePopup: layoutState.hasActivePopup,
    hasActiveModal: layoutState.hasActiveModal,
    
    // 位置管理
    requestPosition,
    releasePosition,
    getZoneCoordinates,
    
    // 状态管理
    setPopupState,
    setModalState,
    
    // 智能建议
    getAvoidanceSuggestion,
    recalculateLayout
  };
};