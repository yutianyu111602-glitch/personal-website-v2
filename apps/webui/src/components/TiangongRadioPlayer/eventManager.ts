import React, { useEffect, useRef, useState } from "react";
import { setupEventListeners } from "./eventSystem";
import { AidjMixPatchManager } from "./aidjMixPatch";
import { RadioState, SnapState, SnapEdge } from "./types";

/**
 * 电台事件管理模块
 * 负责事件监听、AidjMix集成和自动吸附逻辑
 */
export const useEventManager = (
  state: RadioState,
  setState: React.Dispatch<React.SetStateAction<RadioState>>,
  updateSnapState: (snapState: any, edge: any, position: any) => void
) => {
  // 🔄 重连定时器
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🎯 AidjMix补丁包管理器引用
  const aidjMixManagerRef = useRef<AidjMixPatchManager | null>(null);
  
  // 🕒 自动吸附定时器
  const [autoSnapTimer, setAutoSnapTimer] = useState<NodeJS.Timeout | null>(null);

  // 🎯 事件监听器设置 - 只监听，不控制
  useEffect(() => {
    const cleanup = setupEventListeners(setState, state);

    // 🎯 初始化AidjMix补丁包 - 只负责AI建议，不控制播放
    try {
      const { UnifiedEventBus } = window as any;
      if (UnifiedEventBus) {
        aidjMixManagerRef.current = new AidjMixPatchManager(UnifiedEventBus);
        aidjMixManagerRef.current.enable({
          enableTechniqueBridge: true,
          enableRouterAdapter: false, // 🎯 禁用路由适配器，电台不控制播放
          enableNowPlayingMirror: true, // 启用状态镜像，获取播放信息
          mirrorConfig: {
            NOWPLAYING_URL: '/api/nowplaying',
            INTERVAL_MS: 2000
          }
        });
        console.log('🎯 AidjMix补丁包已成功集成（纯建议模式）');
      } else {
        console.warn('🎯 AidjMix: UnifiedEventBus未找到，补丁包未启用');
      }
    } catch (error) {
      console.error('🎯 AidjMix补丁包初始化失败:', error);
    }
    
    // 🕒 进入第二页后自动吸附逻辑：展开10秒后自动吸附
    console.log('🕒 启动10秒自动吸附定时器');
    const timer = setTimeout(() => {
      console.log('🧲 自动执行吸附操作');
      // 简化的自动吸附逻辑 - 直接执行吸附到左边缘
      updateSnapState(
        SnapState.Snapped,
        SnapEdge.Left,
        { x: 0, y: Math.max(50, Math.min(window.innerHeight - 150, 200)) }
      );
    }, 10000); // 10秒
    
    setAutoSnapTimer(timer);
    
    return () => {
      cleanup();
      clearTimeout(timer);
      
      // 🎯 清理AidjMix补丁包
      if (aidjMixManagerRef.current) {
        aidjMixManagerRef.current.disable();
        aidjMixManagerRef.current = null;
      }
      
      if (reconnectTimerRef.current) { 
        clearTimeout(reconnectTimerRef.current); 
        reconnectTimerRef.current = null; 
      }
    };
  }, []); // 优化：移除不必要的依赖，避免无限循环

  return {
    aidjMixManagerRef,
    autoSnapTimer,
    reconnectTimerRef
  };
};
