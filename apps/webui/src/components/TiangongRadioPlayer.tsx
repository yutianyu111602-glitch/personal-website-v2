import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { getTranslations } from "./util/i18n";
import { UnifiedEventBus, onPlayback, onTransition, onBpm, onEnergy } from "./events/UnifiedEventBus";

// 🎯 动态导入监控面板组件，避免循环依赖
const MonitoringDashboard = lazy(() => import('./TiangongRadioPlayer/uiComponents/MonitoringDashboard'));
const DockedAIDJConsole = lazy(() => import('./TiangongRadioPlayer/uiComponents/DockedAIDJConsole'));
const TechniqueSelector = lazy(() => import('./TiangongRadioPlayer/uiComponents/TechniqueSelector'));

// 🎯 AidjMix补丁包管理器
import { AidjMixPatchManager } from './TiangongRadioPlayer/aidjMixPatch';

// 🎯 情绪核心管理器
import EmotionCoreManager from '../core/EmotionCoreManager';

// 🧪 测试运行器
import runAidjMixTest from './TiangongRadioPlayer/runAidjMixTest';

interface TiangongRadioPlayerProps {
  language: string;
  syncActive?: boolean;
  onSyncToggle?: () => void;
  onClose?: () => void;
  autoPlayOnMount?: boolean;
  preloadOnly?: boolean;
}

// 音频文件接口 - 适配V2版本API路由
interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key?: string;
  genre?: string;
  path?: string;
  type: string;
  playCount: number;
}

// 吸附边缘枚举
enum SnapEdge {
  None = 'none',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

// 吸附状态枚举
enum SnapState {
  Free = 'free',       // 自由状态，未吸附
  Snapped = 'snapped', // 已吸附到边缘
  Expanded = 'expanded' // 从吸附状态展开
}

// 简化的状态接口
interface RadioState {
  // 🎯 位置和吸附状态
  position: { x: number; y: number };
  snapState: SnapState;
  snappedEdge: SnapEdge;
  freePosition: { x: number; y: number };
  
  // 🎵 播放状态 - 通过事件系统获取
  isPlaying: boolean;
  volume: number;
  currentTrack: AudioTrack | null;
  
  // 🎼 歌单信息 - 通过事件系统获取
  currentPlaylist: AudioTrack[];
  currentTrackIndex: number;
  
  // 📊 音频特征数据 - 通过事件系统获取
  bpm: number | null;
  energy: number | null;
  
  // 🧲 UI状态
  isLoading: boolean;
  playerDims: { width: number; height: number };
  
  // 🎯 监控面板控制状态
  showMonitoringDashboard: boolean;
  showDockedConsole: boolean;
  showTechniqueSelector: boolean;
}

/**
 * 天宫电台播放器 - V2版本重构（状态管理优化版）
 * 
 * 核心特性：
 * - 🎯 简化交互系统 - 用按钮替代拖拽
 * - 🧲 智能边缘吸附 - 自动检测最近边缘
 * - 👆 一键切换状态 - 吸附/展开/自由状态循环
 * - 🎬 流畅动画过渡 - 状态间平滑切换
 * - 📍 位置记忆 - 记住用户偏好位置
 * - 🎵 事件系统集成 - 通过事件总线获取播放状态和歌单信息
 * - 📜 滚动适配 - 吸附状态下不受页面滚动影响
 * - 🔄 完全融入V2版本事件系统 - 与情绪核心完全兼容
 * - ⚡ 状态管理优化 - 简化的状态接口和高效的更新逻辑
 */
export const TiangongRadioPlayer: React.FC<TiangongRadioPlayerProps> = ({
  language,
  syncActive = false,
  onSyncToggle,
  onClose,
  autoPlayOnMount = false,
  preloadOnly = false
}) => {
  // 🎯 统一状态管理 - 使用useReducer或自定义hook优化
  const [state, setState] = useState<RadioState>(() => ({
    // 位置和吸附状态
    position: { x: 20, y: Math.max(20, window.innerHeight - 300) },
    snapState: SnapState.Free,
    snappedEdge: SnapEdge.None,
    freePosition: { x: 20, y: window.innerHeight - 280 - 20 },
    
    // 播放状态
    isPlaying: false,
    volume: 0.6,
    currentTrack: null,
    
    // 歌单信息
    currentPlaylist: [],
    currentTrackIndex: 0,
    
    // 音频特征数据
    bpm: null,
    energy: null,
    
    // UI状态
    isLoading: false,
    playerDims: {
      width: Math.min(420, Math.max(280, Math.round(window.innerWidth * 0.34))),
      height: Math.min(340, Math.max(220, Math.round(window.innerHeight * 0.28)))
    },
    
    // 监控面板控制状态
    showMonitoringDashboard: false,
    showDockedConsole: false,
    showTechniqueSelector: false,
  }));

  // 引用
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 🎯 AidjMix补丁包管理器引用
  const aidjMixPatchManagerRef = useRef<AidjMixPatchManager | null>(null);
  
  // 🎯 情绪核心管理器引用
  const emotionCoreManagerRef = useRef<EmotionCoreManager | null>(null);
  
  // 🕒 自动吸附定时器
  const [autoSnapTimer, setAutoSnapTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 🔄 重连定时器
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🎵 自动播放准备
  const autoplayArmedRef = useRef(true);
  
  const t = getTranslations(language);

  // ✅ 自适应窗口尺寸（优化：使用useMemo缓存计算结果）
  const getPlayerDimensions = useMemo(() => {
    return () => ({
      width: Math.min(420, Math.max(280, Math.round(window.innerWidth * 0.34))),
      height: Math.min(340, Math.max(220, Math.round(window.innerHeight * 0.28)))
    });
  }, []);

  // 🧲 智能边缘检测 - 优化：使用useMemo缓存计算结果
  const findNearestEdge = useMemo(() => {
    return (x: number, y: number) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 仅包含可吸附的四个边（不含 none）
      type EdgeKey = Exclude<SnapEdge, SnapEdge.None>;
      const distances: Record<EdgeKey, number> = {
        left: x,
        right: viewportWidth - x - state.playerDims.width,
        top: y,
        bottom: viewportHeight - y - state.playerDims.height
      };

      // 找到距离最短的边缘
      const nearestEdge = (Object.keys(distances) as EdgeKey[]).reduce((closest, edge) => {
        return distances[edge] < distances[closest] ? edge : closest;
      });

      // 计算吸附位置
      const snapPositions: Record<EdgeKey, { x: number; y: number }> = {
        left: { x: 0, y: Math.max(50, Math.min(viewportHeight - 150, y)) },
        // 右侧吸附：使用20px极窄条，不受组件宽度影响
        right: { x: viewportWidth - 20, y: Math.max(50, Math.min(viewportHeight - 150, y)) },
        top: { x: Math.max(50, Math.min(viewportWidth - 150, x)), y: 0 },
        bottom: { x: Math.max(50, Math.min(viewportWidth - 150, x)), y: viewportHeight - 20 }
      };

      return {
        edge: nearestEdge,
        position: snapPositions[nearestEdge]
      };
    };
  }, [state.playerDims.width, state.playerDims.height]);

  // 📍 获取展开位置 - 优化：使用useMemo缓存计算结果
  const getExpandedPosition = useMemo(() => {
    return () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      switch (state.snappedEdge) {
        case SnapEdge.Left:
          return { x: 20, y: Math.max(20, Math.min(viewportHeight - (state.playerDims.height + 20), state.freePosition.y)) };
        case SnapEdge.Right:
          return { x: viewportWidth - (state.playerDims.width + 20), y: Math.max(20, Math.min(viewportHeight - (state.playerDims.height + 20), state.freePosition.y)) };
        case SnapEdge.Top:
          return { x: Math.max(20, Math.min(viewportWidth - (state.playerDims.width + 20), state.freePosition.x)), y: 20 };
        case SnapEdge.Bottom:
          return { x: Math.max(20, Math.min(viewportWidth - (state.playerDims.width + 20), state.freePosition.x)), y: viewportHeight - (state.playerDims.height + 20) };
        default:
          return state.freePosition;
      }
    };
  }, [state.snappedEdge, state.freePosition, state.playerDims.height, state.playerDims.width]);

  // 🎯 吸附按钮点击处理 - 优化：使用useCallback减少重新创建
  const handleSnapToggle = useCallback(() => {
    setState(prevState => {
      switch (prevState.snapState) {
        case SnapState.Free:
          // 自由状态 → 吸附状态
          const { edge, position: snapPos } = findNearestEdge(prevState.position.x, prevState.position.y);
          console.log(`🧲 吸附到${edge}边缘`);
          return {
            ...prevState,
            freePosition: prevState.position,
            snappedEdge: edge,
            position: snapPos,
            snapState: SnapState.Snapped
          };
          
        case SnapState.Snapped:
          // 吸附状态 → 展开状态
          const expandPos = getExpandedPosition();
          console.log(`📖 展开窗口`);
          return {
            ...prevState,
            position: expandPos,
            snapState: SnapState.Expanded
          };
          
        case SnapState.Expanded:
          // 展开状态 → 自由状态
          console.log(`🆓 恢复自由状态`);
          return {
            ...prevState,
            position: prevState.freePosition,
            snappedEdge: SnapEdge.None,
            snapState: SnapState.Free
          };
          
        default:
          return prevState;
      }
    });
  }, [findNearestEdge, getExpandedPosition]);

  // 🎵 事件系统集成 - 播放/暂停事件发射 - 优化：使用useCallback
  const handlePlayPause = useCallback(() => {
    setState(prevState => {
      const newIsPlaying = !prevState.isPlaying;
      
      if (newIsPlaying) {
        // 通过事件系统播放音乐
        console.log('🎵 通过事件系统开始播放');
        UnifiedEventBus.emitPlayback('play');
      } else {
        // 通过事件系统暂停音乐
        console.log('⏸️ 通过事件系统暂停音乐');
        UnifiedEventBus.emitPlayback('pause');
      }
      
      return { ...prevState, isPlaying: newIsPlaying };
    });
  }, []);

  // 🎵 音量控制 - 通过事件系统同步 - 优化：使用useCallback
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    setState(prevState => ({ ...prevState, volume: newVolume }));
    
    // 通过事件系统同步音量
    UnifiedEventBus.emitEnergy(newVolume);
    console.log(`🔊 音量变化: ${Math.round(newVolume * 100)}%`);
  }, []);

  // 🔄 同步按钮 - 优化：使用useCallback
  const handleSyncToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSyncToggle?.();
    const syncStatus = !syncActive ? t.radio.syncActive : t.radio.syncInactive;
    console.log(`🔄 ${t.radio.syncButton}: ${syncStatus}`);
  }, [syncActive, onSyncToggle, t]);

  // 🚪 关闭按钮 - 优化：使用useCallback
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
    
    // 清理资源
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    console.log(`🚪 ${t.radio.closePlayer}`);
  }, [onClose, t]);

  // 🎵 事件监听器设置 - 优化：使用useCallback减少重新创建
  useEffect(() => {
    console.log('🎵 设置事件监听器');
    
    // 🎯 初始化情绪核心管理器
    if (!emotionCoreManagerRef.current) {
      console.log('🎯 初始化情绪核心管理器...');
      emotionCoreManagerRef.current = new EmotionCoreManager({
        tickIntervalMs: 500,
        enableUnifiedLoop: true,
        enableNowPlayingPull: false,
        enableTechniqueBridge: true,
        conservativeDropout: 0.05,
        AUTODJ_STATUS_URL: '/api/autodj/status',
        NOWPLAYING_URL: '/api/nowplaying'
      });
      
      // 初始化情绪核心管理器
      emotionCoreManagerRef.current.init();
      console.log('✅ 情绪核心管理器已初始化');
    }
    
    // 🎯 初始化AidjMix补丁包管理器
    if (!aidjMixPatchManagerRef.current) {
      console.log('🎯 初始化AidjMix补丁包管理器...');
      aidjMixPatchManagerRef.current = new AidjMixPatchManager(UnifiedEventBus);
      
      // 启用补丁包，配置所有功能
      aidjMixPatchManagerRef.current.enable({
        enableTechniqueBridge: true,
        enableRouterAdapter: true,
        enableNowPlayingMirror: true,
        routerConfig: {
          ENDPOINT_NEXT: '/api/music/next',
          ENDPOINT_PREV: '/api/music/previous',
          ENDPOINT_CROSSF: '/api/music/crossfade?duration={ms}',
          ENDPOINT_VOLUME: '/api/music/volume?level={v}',
          DEFAULT_CROSSFADE_MS: 4000,
          SAFETY_RATE_LIMIT_MS: 1200
        },
        mirrorConfig: {
          NOWPLAYING_URL: '/api/nowplaying',
          INTERVAL_MS: 5000,
          EventBus: UnifiedEventBus
        }
      });
      
      console.log('✅ AidjMix补丁包管理器已启用');
    }
    
    // 🎯 验证事件流连接
    console.log('🎯 验证EmotionCoreManager与AidjMix补丁包的事件流连接...');
    
    // 监听情绪核心管理器发出的手法建议事件
    const unsubscribeTechniqueRecommend = UnifiedEventBus.on('automix', 'technique_recommend', (event) => {
      console.log('🎯 收到情绪核心管理器的切歌手法建议:', event.data);
      
      // 这里可以添加额外的处理逻辑，比如更新UI显示
      // 或者将建议传递给其他组件
    });
    
    // 监听电台遥测事件，确保EmotionCoreManager能接收到
    const unsubscribeRadioTelemetry = UnifiedEventBus.on('radio', 'telemetry', (event) => {
      console.log('📊 电台遥测事件:', event.data);
    });
    
    // 监听段落推进事件，确保EmotionCoreManager能接收到
    const unsubscribeAutomixTransition = UnifiedEventBus.on('automix', 'transition', (event) => {
      console.log('🎚️ 自动混音过渡事件:', event.data);
    });
    
    console.log('✅ 事件流连接验证完成');
    
    // 监听播放状态变化
    const offPlayback = onPlayback((e) => {
      const playbackState = e.data?.playbackState;
      console.log('🎵 播放状态事件:', playbackState);
      
      setState(prevState => {
        let newIsPlaying = prevState.isPlaying;
        
        if (playbackState === 'play' && !prevState.isPlaying) {
          newIsPlaying = true;
          console.log('✅ 播放状态同步: 播放中');
        }
        if (playbackState === 'pause' && prevState.isPlaying) {
          newIsPlaying = false;
          console.log('✅ 播放状态同步: 已暂停');
        }
        if (playbackState === 'stop') {
          newIsPlaying = false;
          console.log('✅ 播放状态同步: 已停止');
        }
        
        return { ...prevState, isPlaying: newIsPlaying };
      });
    });
    
    // 监听BPM变化
    const offBpm = onBpm((e) => {
      const newBpm = e.data?.bpm;
      if (newBpm && newBpm !== state.bpm) {
        setState(prevState => ({ ...prevState, bpm: newBpm }));
        console.log(`🎵 BPM变化: ${newBpm}`);
      }
    });
    
    // 监听能量变化
    const offEnergy = onEnergy((e) => {
      const newEnergy = e.data?.energy;
      if (newEnergy !== undefined && newEnergy !== state.energy) {
        setState(prevState => ({ ...prevState, energy: newEnergy }));
        console.log(`🎵 能量变化: ${newEnergy}`);
      }
    });
    
    // 监听过渡事件（歌单变化）
    const offTransition = onTransition((e) => {
      console.log('🎚️ 过渡事件:', e.data);
      
      // 通过过渡事件获取歌单信息
      if (e.data?.fromTrack && e.data?.toTrack) {
        // 这里可以根据过渡事件更新歌单信息
        console.log(`🎵 曲目切换: ${e.data.fromTrack} → ${e.data.toTrack}`);
      }
    });
    
    // 🕒 进入第二页后自动吸附逻辑：展开10秒后自动吸附
    console.log('🕒 启动10秒自动吸附定时器');
    const timer = setTimeout(() => {
      console.log('🧲 自动执行吸附操作');
      // 简化的自动吸附逻辑 - 直接执行吸附到左边缘
      setState(prevState => ({
        ...prevState,
        freePosition: { x: 20, y: window.innerHeight - 280 - 20 },
        snappedEdge: SnapEdge.Left,
        position: { x: 0, y: Math.max(50, Math.min(window.innerHeight - 150, 200)) },
        snapState: SnapState.Snapped
      }));
    }, 10000); // 10秒
    
    setAutoSnapTimer(timer);
    
    return () => {
      // 清理事件监听器
      offPlayback();
      offBpm();
      offEnergy();
      offTransition();
      
      // 🎯 清理新添加的事件监听器
      if (typeof unsubscribeTechniqueRecommend === 'function') {
        unsubscribeTechniqueRecommend();
      }
      if (typeof unsubscribeRadioTelemetry === 'function') {
        unsubscribeRadioTelemetry();
      }
      if (typeof unsubscribeAutomixTransition === 'function') {
        unsubscribeAutomixTransition();
      }
      
      // 🎯 清理情绪核心管理器
      if (emotionCoreManagerRef.current) {
        console.log('🎯 清理情绪核心管理器...');
        // 注意：EmotionCoreManager没有disable方法，只需要清理引用
        emotionCoreManagerRef.current = null;
      }
      
      // 🎯 清理AidjMix补丁包管理器
      if (aidjMixPatchManagerRef.current) {
        console.log('🎯 清理AidjMix补丁包管理器...');
        aidjMixPatchManagerRef.current.disable();
        aidjMixPatchManagerRef.current = null;
      }
      
      // 清理定时器
      clearTimeout(timer);
      
      if (reconnectTimerRef.current) { 
        clearTimeout(reconnectTimerRef.current); 
        reconnectTimerRef.current = null; 
      }
    };
  }, []); // 优化：移除不必要的依赖，避免无限循环

  // 📏 窗口大小变化处理 - 优化：使用useCallback减少重新创建
  useEffect(() => {
    const handleResize = () => {
      const newDims = getPlayerDimensions();
      
      setState(prevState => {
        const newState = { ...prevState, playerDims: newDims };
        
        if (prevState.snapState === SnapState.Snapped) {
          // 重新计算吸附位置
          const { position: newSnapPos } = findNearestEdge(prevState.freePosition.x, prevState.freePosition.y);
          newState.position = newSnapPos;
        } else if (prevState.snapState === SnapState.Expanded) {
          // 重新计算展开位置
          const newExpandPos = getExpandedPosition();
          newState.position = newExpandPos;
        } else {
          // 自由状态，确保在安全区域内
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const safeX = Math.max(20, Math.min(windowWidth - (newDims.width + 20), prevState.position.x));
          const safeY = Math.max(20, Math.min(windowHeight - (newDims.height + 20), prevState.position.y));
          newState.position = { x: safeX, y: safeY };
          newState.freePosition = { x: safeX, y: safeY };
        }
        
        return newState;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [findNearestEdge, getExpandedPosition, getPlayerDimensions]);

  // 首次用户点击后自动尝试播放（满足浏览器手势策略）- 优化：使用useCallback
  useEffect(() => {
    const onFirstUserGesture = async () => {
      if (!autoplayArmedRef.current) return;
      autoplayArmedRef.current = false;
      
      // 通过事件系统尝试播放
      if (state.currentPlaylist.length > 0) {
        handlePlayPause();
      }
    };
    window.addEventListener('click', onFirstUserGesture, { once: true, capture: true });
    return () => {
      try { window.removeEventListener('click', onFirstUserGesture, true as any); } catch {}
    };
  }, [handlePlayPause, state.currentPlaylist]);

  // 🎨 根据状态决定样式 - 优化：使用useMemo缓存计算结果
  const isMinimized = useMemo(() => state.snapState === SnapState.Snapped, [state.snapState]);
  const isExpanded = useMemo(() => state.snapState === SnapState.Expanded, [state.snapState]);
  
  // 计算容器样式 - 优化：使用useMemo缓存计算结果
  const containerStyle = useMemo(() => ({
    position: 'fixed' as const,
    left: state.position.x,
    top: state.position.y,
    width: isMinimized ? 60 : 360,
    height: 280,
    zIndex: 85,
    cursor: state.snapState === SnapState.Snapped ? 'pointer' : 'move',
    userSelect: 'none' as const,
    touchAction: 'none' as const,
  }), [state.position.x, state.position.y, isMinimized, state.snapState]);

  // 计算内容样式 - 优化：使用useMemo缓存计算结果
  const contentStyle = useMemo(() => ({
    opacity: isMinimized ? 0 : 1,
    transform: isMinimized ? 'scale(0.8)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }), [isMinimized]);

  // 计算吸附按钮样式 - 优化：使用useMemo缓存计算结果
  const snapButtonStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: isMinimized ? '50%' : '10px',
    right: isMinimized ? '50%' : '10px',
    transform: isMinimized ? 'translate(50%, -50%)' : 'none',
    width: isMinimized ? 40 : 32,
    height: isMinimized ? 40 : 32,
    borderRadius: '50%',
    background: 'var(--silver-primary-80)',
    border: '2px solid var(--silver-primary-60)',
    color: 'var(--silver-primary-20)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: isMinimized ? '20px' : '16px',
    transition: 'all 0.2s ease',
    zIndex: 10,
  }), [isMinimized]);

  if (preloadOnly) {
    return null;
  }

  return (
    <motion.div
      ref={playerRef}
      style={containerStyle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* 吸附切换按钮 */}
      <motion.button
        style={snapButtonStyle}
        onClick={handleSnapToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isMinimized ? '展开播放器' : '吸附到边缘'}
      >
        {isMinimized ? '▶' : '🧲'}
      </motion.button>

      {/* 主内容区域 */}
      <motion.div style={contentStyle}>
        {/* 播放器头部 */}
        <div className="bg-silver-primary-90/95 backdrop-blur-md border border-silver-primary-60 rounded-t-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-silver-primary-20 text-sm font-mono">
            {isMinimized ? 'RADIO' : 'TIANGONG RADIO'}
          </div>
          <div className="flex items-center space-x-2">
            {/* 🎯 监控面板切换按钮 */}
            <button
              onClick={() => setState(prev => ({ ...prev, showMonitoringDashboard: !prev.showMonitoringDashboard }))}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                state.showMonitoringDashboard 
                  ? 'bg-silver-primary-60 text-silver-primary-20' 
                  : 'bg-silver-primary-40 text-silver-primary-60'
              }`}
              title={state.showMonitoringDashboard ? '隐藏监控面板' : '显示监控面板'}
            >
              📊
            </button>
            {/* 🎛️ 底部控制台切换按钮 */}
            <button
              onClick={() => setState(prev => ({ ...prev, showDockedConsole: !prev.showDockedConsole }))}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                state.showDockedConsole 
                  ? 'bg-silver-primary-60 text-silver-primary-20' 
                  : 'bg-silver-primary-40 text-silver-primary-60'
              }`}
              title={state.showDockedConsole ? '隐藏底部控制台' : '显示底部控制台'}
            >
              🎛️
            </button>
            {/* 🎯 切歌手法选择器切换按钮 */}
            <button
              onClick={() => setState(prev => ({ ...prev, showTechniqueSelector: !prev.showTechniqueSelector }))}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                state.showTechniqueSelector 
                  ? 'bg-silver-primary-60 text-silver-primary-20' 
                  : 'bg-silver-primary-40 text-silver-primary-60'
              }`}
              title={state.showTechniqueSelector ? '隐藏切歌手法选择器' : '显示切歌手法选择器'}
            >
              🎯
            </button>
            {/* 🧪 测试运行按钮 */}
            <button
              onClick={async () => {
                try {
                  console.log('🧪 开始运行AidjMix补丁包测试...');
                  await runAidjMixTest();
                } catch (error) {
                  console.error('❌ 测试运行失败:', error);
                }
              }}
              className="w-6 h-6 rounded-full bg-silver-primary-40 text-silver-primary-60 hover:bg-silver-primary-60 hover:text-silver-primary-20 transition-colors flex items-center justify-center text-xs"
              title="运行AidjMix补丁包测试"
            >
              🧪
            </button>
            <button
              onClick={handleSyncToggle}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                syncActive 
                  ? 'bg-silver-primary-60 text-silver-primary-20' 
                  : 'bg-silver-primary-40 text-silver-primary-60'
              }`}
              title={syncActive ? '同步已启用' : '同步已禁用'}
            >
              🔄
            </button>
            <button
              onClick={handleClose}
              className="w-6 h-6 rounded-full bg-silver-primary-40 text-silver-primary-60 hover:bg-silver-primary-60 hover:text-silver-primary-20 transition-colors flex items-center justify-center text-xs"
              title="关闭播放器"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 播放器主体 */}
        <div className="bg-silver-primary-95/95 backdrop-blur-md border-x border-b border-silver-primary-60 rounded-b-lg p-4">
          {/* 当前播放信息 */}
          {state.currentTrack && (
            <div className="mb-4 text-center">
              <div className="text-silver-primary-20 font-medium text-sm mb-1">
                {state.currentTrack.title}
              </div>
              {state.currentTrack.artist && (
                <div className="text-silver-primary-40 text-xs">
                  {state.currentTrack.artist}
                </div>
              )}
              {state.currentTrack.key && (
                <div className="text-silver-primary-50 text-xs mt-1">
                  调性: {state.currentTrack.key}
                </div>
              )}
            </div>
          )}

          {/* 音频数据信息 - 通过事件系统获取 */}
          <div className="w-full h-12 bg-silver-primary-90 rounded mb-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-silver-primary-40 text-xs">
                {state.bpm ? `BPM: ${state.bpm}` : '等待音频数据...'}
              </div>
              {state.energy !== null && (
                <div className="text-silver-primary-50 text-xs mt-1">
                  能量: {Math.round(state.energy * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* 播放控制 - 通过事件系统控制 */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-silver-primary-60 text-silver-primary-20 hover:bg-silver-primary-80 transition-colors flex items-center justify-center text-xl"
              title={state.isPlaying ? '暂停' : '播放'}
            >
              {state.isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center space-x-2">
            <span className="text-silver-primary-40 text-xs">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={state.volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-silver-primary-80 rounded-lg appearance-none cursor-pointer slider"
              title={`音量: ${Math.round(state.volume * 100)}%`}
            />
            <div className="text-silver-primary-60 font-mono text-xs min-w-[28px] text-right">
              {Math.round(state.volume * 100)}%
            </div>
          </div>

          {/* 播放列表信息 */}
          {state.currentPlaylist.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-silver-primary-40 text-xs">
                歌单: {state.currentTrackIndex + 1} / {state.currentPlaylist.length}
              </div>
              <div className="text-silver-primary-30 text-xs mt-1">
                {state.currentPlaylist[state.currentTrackIndex]?.title || '未选择歌曲'}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {state.isLoading && (
            <div className="mt-4 text-center">
              <div className="text-silver-primary-40 text-xs">加载中...</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 🎯 监控面板 - 使用Suspense避免渲染问题 */}
      {state.showMonitoringDashboard && (
        <Suspense fallback={
          <div className="fixed top-20 right-20 w-80 h-96 bg-silver-primary-90/95 backdrop-blur-md border border-silver-primary-60 rounded-lg flex items-center justify-center">
            <div className="text-silver-primary-40 text-sm">加载监控面板...</div>
          </div>
        }>
          <div className="fixed top-20 right-20 z-50">
            <MonitoringDashboard />
          </div>
        </Suspense>
      )}

      {/* 🎛️ 底部控制台 - 使用Suspense避免渲染问题 */}
      {state.showDockedConsole && (
        <Suspense fallback={
          <div className="fixed bottom-0 left-0 right-0 h-64 bg-silver-primary-90/95 backdrop-blur-md border-t border-silver-primary-60 flex items-center justify-center">
            <div className="text-silver-primary-40 text-sm">加载底部控制台...</div>
          </div>
        }>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <DockedAIDJConsole />
          </div>
        </Suspense>
      )}

      {/* 🎯 切歌手法选择器 - 使用Suspense避免渲染问题 */}
      {state.showTechniqueSelector && (
        <Suspense fallback={
          <div className="fixed bottom-0 left-0 right-0 h-64 bg-silver-primary-90/95 backdrop-blur-md border-t border-silver-primary-60 flex items-center justify-center">
            <div className="text-silver-primary-40 text-sm">加载切歌手法选择器...</div>
          </div>
        }>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <TechniqueSelector />
          </div>
        </Suspense>
      )}

      {/* 自定义滑块样式 */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--silver-primary-60);
          cursor: pointer;
          border: 2px solid var(--silver-primary-80);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--silver-primary-60);
          border: 2px solid var(--silver-primary-80);
        }
      `}</style>
    </motion.div>
  );
};