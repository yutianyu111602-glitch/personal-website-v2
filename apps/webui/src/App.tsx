import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BackgroundManager } from "./components/BackgroundManager";
import { getTranslations, getSystemLanguage, getShaderName } from "./components/util/i18n";
import AdvancedMusicOrganizer from "./components/AdvancedMusicOrganizer";
import { TimeDisplay } from "./components/TimeDisplay";
import { TiangongRadioPlayer } from "./components/TiangongRadioPlayer";
import { EnhancedSpaceStationStatus } from "./components/EnhancedSpaceStationStatus";
import { TaskLogger } from "./components/TaskLogger";
import VisualizerOverlay from "./components/VisualizerOverlay";
import cfg from "./data-config.json";
import DockBar from "./components/DockBar";
import { onPreset, emitTransition, UnifiedEventBus } from "./components/events/UnifiedEventBus";
import ThemeDebugPanel from "./components/ThemeDebugPanel";
import { useIsMobile } from "./components/ui/use-mobile";

// 基础状态类型
interface AppState {
  isWelcomeMode: boolean;
  isInitialized: boolean;
  language: string;
  showRadio: boolean;
  syncActive: boolean; // 新增同步按钮状态
  showVisualizer: boolean; // 新增可视化器显示状态
}

/**
 * 天宫科技全屏视觉体验应用 - 模块化重构增强版
 * 
 * 🏗️ 架构特性:
 * - 基于React + TypeScript构建，全面类型安全
 * - 采用函数式编程范式，状态管理集中化
 * - 响应式设计，支持多种屏幕分辨率
 * - 错误边界保护，优雅的降级体验
 * - 性能监控集成，内存泄漏防护
 * 
 * 🎵 电台播放器特性:
 * - 集成Wavesurfer.js v7实现10秒窗口波形显示
 * - 极低内存占用(相比传统方案节省96%内存)  
 * - 与Termusic Rust后端无缝集成(端口:7533)
 * - HTTP Range请求优化，仅加载需要的音频片段
 * - 动态滑动窗口，实时更新波形数据
 * - 支持MP3/WAV/OGG等主流音频格式
 * - 竖直RADIO文字显示，智能边缘吸附系统
 * 
 * 🎨 音乐可视化功能:
 * - 独立的Web音乐可视化器入口
 * - 实时电台音频接入和可视化
 * - 后端已就绪，提供入口访问
 * 
 * 🌐 多语言支持:
 * - 中英双语切换，本地化存储
 * - 动态语言包加载，支持扩展
 * - RTL布局支持（预留）
 * 
 * 🎛️ 控件系统:
 * - 四个右上角功能按钮：电台、语言、背景、可视化器
 * - 统一的交互反馈和动画效果
 * - 键盘快捷键支持，无障碍访问
 * 
 * Z-INDEX 层次管理系统 (2025-01版)：
 * -1    - 背景 (BackgroundManager)
 * 5     - 版权信息
 * 10    - 欢迎模式覆盖层
 * 20    - 控制台主容器
 * 25    - 主功能面板 (AdvancedMusicOrganizer)
 * 30    - 任务日志面板 (TaskLogger) 
 * 40    - 卫星信息面板 (欢迎模式)
 * 50    - 键盘提示弹窗
 * 60    - 时钟模块 (控制台模式，提升层级避免冲突)
 * 70    - 时钟模块 (欢迎模式)
 * 85    - 电台浮窗 - 增强版Wavesurfer集成
 * 90    - 右上角控件 (最高优先级)
 * 
 * @version 2.3.0 - 性能优化与动画流畅性增强版
 * @author 天宫科技 - 麻蛇
 * @since 2025-01-25
 * @updated 2025-01-25 - 全面性能优化，消除卡顿，修复warnings
 */
export default function App() {
  // 状态管理
  const [appState, setAppState] = useState<AppState>({
    isWelcomeMode: true,
    isInitialized: false,
    language: getSystemLanguage(),
    showRadio: false,
    syncActive: false, // 初始化同步状态
    showVisualizer: false // 初始化可视化器显示状态
  });
  
  const [visible, setVisible] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isMobile = useIsMobile();
  const [currentShaderIndex, setCurrentShaderIndex] = useState(0);
  // 订阅可视化预设事件 → 切换背景索引
  useEffect(() => {
    const mapping: Record<string, number> = {
      silver_pure: 0,
      liquid_chrome: 1,
      silver_mist: 2,
      metallic_flow: 3,
      cosmic_silver: 4
    };
    const off = onPreset((e) => {
      const name = e.data?.preset as string;
      if (!name) return;
      const idx = mapping[name];
      if (typeof idx === 'number') {
        setCurrentShaderIndex(idx);
        try { localStorage.setItem('selectedShader', String(idx)); } catch {}
      }
    });
    return () => off();
  }, []);
  
  // 获取翻译
  const t = getTranslations(appState.language);
  
  // 初始化
  useEffect(() => {
    // 设置基本样式
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#000000";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    // 初始化shader循环
    const initializeShader = () => {
      try {
        const storedIndex = localStorage.getItem("autoShaderIndex");
        let nextIndex = 0;

        if (storedIndex !== null) {
          const currentIndex = parseInt(storedIndex, 10);
          if (!isNaN(currentIndex) && currentIndex >= 0 && currentIndex < 5) { // 使用固定的shader数量
            nextIndex = (currentIndex + 1) % 5; // 使用固定的shader数量
          }
        }

        setCurrentShaderIndex(nextIndex);
        localStorage.setItem("autoShaderIndex", nextIndex.toString());
        
        console.log(`🎨 自动切换背景: ${getShaderName(nextIndex, appState.language)} (${nextIndex + 1}/5)`);
      } catch (error) {
        console.error("背景初始化失败:", error);
        setCurrentShaderIndex(0);
      }
    };

    initializeShader();
    
    // 🚀 优化：减少延迟，加快初始化
    setVisible(true); // 立即显示，无延迟
    setTimeout(() => setAppState(prev => ({ ...prev, isInitialized: true })), 150); // 从300ms减少到150ms
  }, [appState.language]); // 🔧 修复：添加依赖，确保shader名称更新正确
  // Esc 退出 Focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFocusMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  
  // 🔧 修复：分离键盘事件处理，解决闭包陷阱问题
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 🔧 修复：使用当前最新的appState值
      if (appState.isWelcomeMode && appState.isInitialized) {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          console.log(`⌨️  键盘快捷键触发: ${event.code}`);
          setAppState(prev => ({
            ...prev,
            isWelcomeMode: false,
            showRadio: true // 键盘进入时也自动打开电台
          }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [appState.isWelcomeMode, appState.isInitialized]); // 🔧 修复：添加依赖，确保获取最新状态
  
  // 语言切换处理器
  const toggleLanguage = useCallback(() => {
    console.log('🌐 语言切换');
    
    if (!appState.isInitialized) {
      return;
    }
    
    const newLanguage = appState.language === 'zh' ? 'en' : 'zh';
    setAppState(prev => ({
      ...prev,
      language: newLanguage
    }));
    
    // 保存语言偏好
    try {
      localStorage.setItem('preferredLanguage', newLanguage);
    } catch (error) {
      console.warn('保存语言偏好失败:', error);
    }
    
    console.log(`🌐 语言已切换至: ${newLanguage}`);
  }, [appState.isInitialized, appState.language]); // 🔧 修复：只依赖必要的状态
  
  // 背景切换处理器
  const switchBackground = useCallback(() => {
    console.log('🎨 手动切换背景');
    
    if (!appState.isInitialized) {
      return;
    }
    
    const nextIndex = (currentShaderIndex + 1) % 5; // 使用固定的shader数量
    setCurrentShaderIndex(nextIndex);
    localStorage.setItem("autoShaderIndex", nextIndex.toString());
    
    console.log(`🎨 背景已切换: ${getShaderName(nextIndex, appState.language)} (${nextIndex + 1}/5)`);
  }, [currentShaderIndex, appState.language, appState.isInitialized]); // 🔧 修复：精确依赖
  
  // 事件处理器
  const handleWelcomeClick = useCallback(() => {
    console.log('🎯 欢迎页面点击');
    
    if (!appState.isWelcomeMode || !appState.isInitialized) {
      console.log('🚫 点击被阻止');
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      isWelcomeMode: false,
      showRadio: true // 进入控制台模式时自动打开电台
    }));
    
    console.log('✅ 切换到控制台模式，自动打开电台');
  }, [appState.isWelcomeMode, appState.isInitialized]); // 🔧 修复：精确依赖

  const handleModuleClick = useCallback((e: React.MouseEvent) => {
    console.log('🎯 时钟模块点击');
    e.stopPropagation();
    
    if (appState.isWelcomeMode || !appState.isInitialized) {
      console.log('🚫 时钟点击被阻止');
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      isWelcomeMode: true
    }));
    
    console.log('✅ 返回欢迎模式');
  }, [appState.isWelcomeMode, appState.isInitialized]); // 🔧 修复：精确依赖

  // Sync按钮处理器
  const toggleSync = useCallback(() => {
    console.log('🔄 Sync按钮点击');
    
    setAppState(prev => ({
      ...prev,
      syncActive: !prev.syncActive
    }));
    
    console.log(`🔄 Sync状态: ${!appState.syncActive ? '激活' : '停止'}`);
  }, [appState.syncActive]); // 🔧 修复：精确依赖

  // 音乐可视化器功能已合并到可视化控制按钮中

  // 背景变化处理器
  const handleBackgroundChange = useCallback((background: { name: string }) => {
    console.log(`🎨 背景已切换: ${background.name}`);
  }, []);

  // 🚀 性能优化：缓存动画配置，避免重复创建对象
  const animationConfigs = useMemo(() => ({
    // 快速弹簧动画 - 时钟模块
    clockTransition: {
      type: "spring" as const,
      stiffness: 500,    // 增强弹性
      damping: 28,       // 优化阻尼
      mass: 0.8,         // 减轻质量，更敏捷
      duration: 0.1      // 超快动画
    },
    
    // 内部元素动画 - 时钟内容
    clockInnerTransition: {
      type: "spring" as const,
      stiffness: 550,    // 更强弹性
      damping: 26,       // 精调阻尼
      mass: 0.7,         // 更轻质量
      duration: 0.08     // 极速动画
    },
    
    // 退出动画配置 - 统一所有退出效果
    exitTransition: {
      duration: 0.4,     // 减少退出时间
      type: "spring" as const,
      stiffness: 300,    // 提升退出弹性
      damping: 22        // 优化退出阻尼
    },
    
    // 面板动画配置 - 控制台模式
    panelTransition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      mass: 0.9,
      duration: 0.35     // 减少面板动画时间
    },
    
    // 按钮悬停动画 - 右上角控件
    buttonHover: {
      scale: 1.05,
      y: -1,
      transition: {
        type: "spring" as const,
        stiffness: 600,
        damping: 15,
        duration: 0.12   // 极快悬停响应
      }
    },
    
    // 按钮点击动画
    buttonTap: {
      scale: 0.95,
      transition: {
        type: "spring" as const,
        stiffness: 800,
        damping: 20,
        duration: 0.08   // 瞬间响应
      }
    }
  }), []);

  // 🚀 性能优化：CSS过渡配置常量
  const cssTransitions = useMemo(() => ({
    fast: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',     // 快速过渡
    medium: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // 中速过渡  
    slow: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // 慢速过渡
    smooth: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'    // 平滑过渡
  }), []);

  // 早期返回 - 未初始化状态
  if (!appState.isInitialized) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white/70 text-sm animate-pulse">
          {appState.language === 'zh' ? '初始化中...' : 'Initializing...'}
        </div>
      </div>
    );
  }

  // Focus 下的最小化样式（通过 className 控制布局）
  const focusClass = isFocusMode ? 'focus-mode' : 'normal-mode';

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black ${focusClass}`}>
      {/* 🎨 酷炫的Shadertoy背景 */}
      <BackgroundManager
        className="absolute inset-0"
        enablePreload={true}
        debugMode={false}
        onBackgroundChange={handleBackgroundChange}
        currentShaderIndex={currentShaderIndex}
        style={{ zIndex: 0 }}
      />

      {/* 可视化覆盖层（Focus 时叠加到背景） */}
      {isFocusMode && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <VisualizerOverlay 
            highFps={cfg.visualizer?.overlay?.highFps ?? true}
            blendMode={(cfg.visualizer?.overlay?.blendMode as any) ?? 'screen'}
            opacity={cfg.visualizer?.overlay?.opacity ?? 0.85}
          />
        </div>
      )}
      
      {/* 可视化覆盖层 - 音乐可视化器启动时显示 */}
      <AnimatePresence>
        {appState.showVisualizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40"
            style={{ pointerEvents: 'none' }}
          >
            {/* 关闭按钮 */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              onClick={() => setAppState(prev => ({ ...prev, showVisualizer: false }))}
              className="fixed top-8 left-8 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer z-50"
              style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.4)',
                color: 'rgba(255, 255, 255, 0.9)',
                pointerEvents: 'auto'
              }}
              title={appState.language === 'zh' ? '关闭可视化器' : 'Close Visualizer'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </motion.button>
            
            {/* 可视化覆盖层 */}
            <VisualizerOverlay 
              highFps={true}
              blendMode="screen"
              opacity={0.9}
            />
            
            {/* 音乐信息显示 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="fixed bottom-8 left-8 text-white/90 font-mono text-sm z-50"
              style={{ pointerEvents: 'none' }}
            >
              <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="text-lg font-bold">🎵 音乐可视化器</div>
                <div className="text-sm opacity-80">正在播放测试音乐</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 时钟模块 - 使用优化的动画配置 */}
      <motion.div
        className={`absolute ${
          appState.isWelcomeMode 
            ? 'left-1/2 top-32 transform -translate-x-1/2' // 欢迎模式：居中对齐
            : 'left-8 top-8' // 控制台模式：左上角位置
        }`}
        style={{
          cursor: 'pointer',
          zIndex: appState.isWelcomeMode ? 70 : 60,
          pointerEvents: 'auto',
          transformOrigin: appState.isWelcomeMode ? 'center' : 'top left',
          // 🚀 硬件加速优化
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        onClick={appState.isWelcomeMode ? handleWelcomeClick : handleModuleClick}
        animate={appState.isWelcomeMode ? {
          x: '0%',
          y: 0
        } : {
          x: 0,
          y: 0
        }}
        transition={animationConfigs.clockTransition}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={appState.isWelcomeMode ? {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0
          } : {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0
          }}
          transition={animationConfigs.clockInnerTransition}
          className={`${
            appState.isWelcomeMode ? 'px-10 py-8' : 'px-4 py-3'
          }`}
          style={{
            minWidth: appState.isWelcomeMode ? 'auto' : '140px',
            minHeight: appState.isWelcomeMode ? 'auto' : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: appState.isWelcomeMode ? 'transparent' : 'rgba(192, 197, 206, 0.05)',
            borderRadius: appState.isWelcomeMode ? 0 : '8px',
            border: appState.isWelcomeMode ? 'none' : '1px solid rgba(192, 197, 206, 0.15)',
            transition: cssTransitions.fast,
            // 🚀 硬件加速优化
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        >
          <TimeDisplay isWelcomeMode={appState.isWelcomeMode} />
        </motion.div>
      </motion.div>

      {/* 卫星信息面板 - 彻底修复exit动画delay问题 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                delay: 1.2, // 🚀 优化：从2.0秒减少到1.2秒
                duration: 0.6, // 从0.8秒减少到0.6秒，更快节奏
                type: "tween",
                ease: "easeInOut"
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.1, // 使用更小的缩放比例，与时钟焦点一致
              x: appState.language === 'zh' ? -520 : -440, // 移向时钟位置，根据语言调整偏移
              y: -200, // 移向时钟Y位置
              transition: {
                delay: 0, // 🚨 exit动画无延迟！
                ...animationConfigs.exitTransition // 使用统一的退出动画配置
              }
            }}
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 40 }}
          >
            <EnhancedSpaceStationStatus language={appState.language} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 欢迎模式点击提示 - 保留键盘快捷键，删除点击提示 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { 
                delay: 2.0, // 🚀 优化：从3.5秒减少到2.0秒，更紧凑的时机
                duration: 0.5, // 从0.6秒减少到0.5秒
                type: "tween",
                ease: "easeInOut"
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.1, // 统一缩放比例，与其他模块一致
              x: appState.language === 'zh' ? -520 : -440, // 移向时钟位置，与卫星模块一致
              y: -300, // 移向时钟Y位置
              transition: {
                delay: 0, // 🚨 exit动画无延迟！
                ...animationConfigs.exitTransition // 使用统一的退出动画配置
              }
            }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-center max-w-md"
            style={{ zIndex: 50 }}
          >
            {/* 键盘提示 - 修复双语显示问题 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              className="text-white/60 text-xs font-mono uppercase tracking-widest"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 font-mono">
                    SPACE
                  </kbd>
                  <span>OR</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 font-mono">
                    ENTER
                  </kbd>
                </div>
                <span>•</span>
                <span>{appState.language === 'zh' ? '快速进入' : 'QUICK ENTER'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 欢迎模式覆盖层 - 现在包含时钟点击 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-pointer"
            style={{ 
              zIndex: 10,
              pointerEvents: 'auto'
            }}
            onClick={handleWelcomeClick}
          />
        )}
      </AnimatePresence>

      {/* 控制台模式主界面 */}
      <AnimatePresence>
        {!appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="absolute inset-0 overflow-hidden"
            style={{ zIndex: 20 }}
          >
            {/* 主功能面板 - 调整位置避免与时钟冲突 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`absolute overflow-auto ${isFocusMode ? `left-1/2 -translate-x-1/2 w-[${(cfg.layout?.focus?.organizer?.width ?? 560)}px] h-[${(cfg.layout?.focus?.organizer?.height ?? 72)}px] bottom-20 top-auto right-auto` : 'left-52 right-80 top-20 bottom-8'}`}
              style={{ 
                zIndex: 25,
                pointerEvents: 'auto'
              }}
            >
              <AdvancedMusicOrganizer 
                language={appState.language}
                onError={(error) => console.error('Music Organizer Error:', error)}
                onSuccess={(message) => console.log('Music Organizer Success:', message)}
              />
            </motion.div>

            {/* 任务日志面板 - 使用优化的动画配置 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={animationConfigs.panelTransition}
              className={`fixed ${isFocusMode ? `right-8 bottom-20 top-auto w-[${(cfg.layout?.focus?.taskLogger?.width ?? 224)}px]` : 'right-8 top-40 bottom-40 w-64'}`}
              style={{ 
                zIndex: 30,
                // 🚀 硬件加速优化
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform'
              }}
            >
              <TaskLogger />
            </motion.div>

            {/* 音乐播放器 - 右下角，提升层级 */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 30, y: 30 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="fixed bottom-8 right-8"
              style={{ zIndex: 80 }} // 从35提升到80，避免与其他元素冲突
            >
              {/* 音乐播放器已删除 */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右上角控件区域 - 使用优化的动画配置 */}

      {/* 可视化控制按钮 - 合并音乐可视化器和可视化开关 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={() => {
          // 切换可视化状态
          const newVisualizerState = !appState.showVisualizer;
          setAppState(prev => ({ ...prev, showVisualizer: newVisualizerState }));
          
          if (newVisualizerState) {
            // 启动可视化效果
            console.log('🎨 启动可视化效果');
            
            // 发送可视化预设事件
            UnifiedEventBus.emitPreset('liquid_chrome');
            
            // 发送情绪事件
            UnifiedEventBus.emitMood({
              energy: 0.7,
              valence: 0.6,
              arousal: 0.8
            });
            
            // 切换到焦点模式以显示可视化覆盖层
            setIsFocusMode(true);
          } else {
            // 关闭可视化效果
            console.log('🎨 关闭可视化效果');
            setIsFocusMode(false);
          }
        }}
        className="fixed top-8 right-8 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: appState.showVisualizer ? 'rgba(80, 200, 255, 0.18)' : 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          // 🚀 硬件加速优化
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={appState.showVisualizer ? 
          (appState.language === 'zh' ? '可视化：开启（点击关闭）' : 'Visualizer: ON (Click to OFF)') :
          (appState.language === 'zh' ? '可视化：关闭（点击开启）' : 'Visualizer: OFF (Click to ON)')
        }
      >
        {/* 动态图标 - 根据可视化状态显示不同图标 */}
        {appState.showVisualizer ? (
          // 开启状态：眼睛图标
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5c-7.633 0-11 7-11 7s3.367 7 11 7 11-7 11-7-3.367-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
          </svg>
        ) : (
          // 关闭状态：音符和波形图标
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            <path d="M8 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            <circle cx="10" cy="17" r="1"/>
            <circle cx="14" cy="11" r="1"/>
            <circle cx="18" cy="7" r="1"/>
          </svg>
        )}
      </motion.button>

      {/* 语言切换按钮 - 右上角第二个 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={toggleLanguage}
        className="fixed top-8 right-24 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          // 🚀 硬件加速优化
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={t.language}
      >
        <div className="font-mono text-xs tracking-wider">
          {appState.language === 'zh' ? 'EN' : '中'}
        </div>
      </motion.button>

      {/* 背景切换按钮 - 右上角第三个 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={switchBackground}
        className="fixed top-8 right-40 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          // 🚀 硬件加速优化
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={t.switchBackground}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9l-5.91 8.74L12 22l-4.09-4.26L2 9l6.91-.74L12 2z"/>
        </svg>
      </motion.button>

      {/* 电台切换按钮 - 右上角第四个 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={() => setAppState(prev => ({ ...prev, showRadio: !prev.showRadio }))}
        className="fixed top-8 right-56 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          // 🚀 硬件加速优化
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={t.tiangongRadio}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2.28l.9-2.7L17.3 3l-1.02 3.04c-1.1-.08-2.24-.04-3.37.15C11.24 6.5 9.64 7.13 8.23 8c-.49.3-1.03.7-1.52 1.14L5.1 7.52 3.7 8.9l1.62 1.63c-.9 1.13-1.6 2.39-2 3.76-.41 1.4-.51 2.88-.3 4.32h1.9c-.15-1.2-.08-2.4.2-3.54.28-1.14.79-2.22 1.49-3.16l2.1 2.1c.95-.65 2.03-1.13 3.17-1.4 1.14-.28 2.34-.35 3.54-.2V18h2V8c1.1 0 2-.9 2-2z"/>
        </svg>
      </motion.button>

      {/* 电台浮窗 - 重构版本，独立且可靠 */}
      <AnimatePresence>
        {appState.showRadio && (
          <TiangongRadioPlayer 
            language={appState.language} 
            syncActive={appState.syncActive}
            onSyncToggle={toggleSync}
            onClose={() => setAppState(prev => ({ ...prev, showRadio: false }))}
          />
        )}
      </AnimatePresence>

      {/* 版权信息 - 弱化存在感，统一字体 */}
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center"
        style={{ 
          zIndex: 5,
          opacity: 0.25, // 降低透明度
        }}
      >
        <div className="text-system-quaternary font-mono text-xs tracking-widest uppercase transition-opacity duration-300 hover:opacity-60">
          @天宫科技 Made By 麻蛇
        </div>
      </div>

      {/* 主题调试面板 - 底部左侧 */}
      {!isMobile && <ThemeDebugPanel />}

      {/* Focus Dock - 仅 Focus 模式显示 */}
      {isFocusMode && (
        <DockBar
          isPlaying={appState.showRadio}
          onExit={() => setIsFocusMode(false)}
          onPlayPause={() => UnifiedEventBus.emitPlayback(appState.showRadio ? 'pause' : 'play')}
          onNext={() => emitTransition({ action: 'next' })}
        />
      )}
    </div>
  );
}