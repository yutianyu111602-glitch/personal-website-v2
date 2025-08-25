import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LocalBus from './LocalBus';

/**
 * 底部抽屉AI控制台组件
 * 采用安全的实现方式，避免循环依赖和无限渲染
 */

// 使用useBus hook，安全地获取事件总线
function useBus() {
  const [bus, setBus] = useState<any>(null);
  
  useEffect(() => {
    // 优先使用现有的UnifiedEventBus，如果没有则使用LocalBus兜底
    const globalBus = (window as any).UnifiedEventBus;
    const localBusInstance = (window as any).localBus || new LocalBus();
    
    if (!globalBus) {
      // 如果没有全局事件总线，设置LocalBus作为兜底
      (window as any).UnifiedEventBus = localBusInstance;
    }
    
    setBus(globalBus || localBusInstance);
  }, []);
  
  return bus;
}

// 按钮组件，避免重复渲染
const ControlButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}> = React.memo(({ onClick, children, variant = 'primary', disabled = false }) => {
  const buttonStyles = useMemo(() => {
    const baseStyle = {
      padding: '10px 12px',
      borderRadius: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '12px',
      border: '1px solid',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.5 : 1
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: 'rgba(0, 255, 136, 0.1)',
          color: '#00ff88',
          borderColor: 'rgba(0, 255, 136, 0.3)'
        };
      case 'secondary':
        return {
          ...baseStyle,
          background: 'rgba(255, 255, 255, 0.06)',
          color: '#eaf0ff',
          borderColor: 'rgba(215, 225, 245, 0.18)'
        };
      case 'danger':
        return {
          ...baseStyle,
          background: 'rgba(255, 68, 68, 0.1)',
          color: '#ff4444',
          borderColor: 'rgba(255, 68, 68, 0.3)'
        };
      default:
        return baseStyle;
    }
  }, [variant, disabled]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={buttonStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </button>
  );
});

ControlButton.displayName = 'ControlButton';

const DockedAIDJConsole: React.FC = () => {
  const bus = useBus();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 安全的事件处理函数
  const handleSyncToggle = useCallback((event: any) => {
    if (event?.data?.active !== undefined) {
      setIsOpen(event.data.active);
    } else {
      setIsOpen(prev => !prev);
    }
  }, []);

  // 监听UI事件
  useEffect(() => {
    if (!bus?.on) return;
    
    const unsubscribe = bus.on('ui', 'sync_toggle', handleSyncToggle);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [bus, handleSyncToggle]);

  // 安全的事件广播函数
  const emitEvent = useCallback((event: any) => {
    if (bus?.emit) {
      try {
        bus.emit(event);
      } catch (error) {
        console.warn('Event emission failed:', error);
      }
    }
  }, [bus]);

  // 切歌控制函数
  const handleNext = useCallback(() => {
    emitEvent({
      namespace: 'automix',
      type: 'transition',
      data: { action: 'next' },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  const handlePrev = useCallback(() => {
    emitEvent({
      namespace: 'automix',
      type: 'transition',
      data: { action: 'prev' },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  const handleCrossfade = useCallback((durationMs: number) => {
    emitEvent({
      namespace: 'automix',
      type: 'transition',
      data: { action: 'crossfade', durationMs },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  // 情绪控制函数
  const handleBoost = useCallback(() => {
    emitEvent({
      namespace: 'automix',
      type: 'mood',
      data: { mood: { energy: 0.85 } },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  const handleCalm = useCallback(() => {
    emitEvent({
      namespace: 'automix',
      type: 'mood',
      data: { mood: { energy: 0.3 } },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  // 预设切换函数
  const handlePresetForce = useCallback((presetName: string) => {
    emitEvent({
      namespace: 'visualization',
      type: 'preset_force',
      data: { name: presetName },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  // 技术选择函数
  const handleTechniqueSelect = useCallback((technique: string) => {
    emitEvent({
      namespace: 'automix',
      type: 'technique_select',
      data: { technique },
      timestamp: Date.now()
    });
  }, [emitEvent]);

  // 预设配置
  const presets = useMemo(() => [
    { name: 'silver_pure', label: 'Silver Pure' },
    { name: 'silver_mist', label: 'Silver Mist' },
    { name: 'liquid_chrome', label: 'Liquid Chrome' },
    { name: 'metallic_flow', label: 'Metallic Flow' },
    { name: 'cosmic_silver', label: 'Cosmic Silver' }
  ], []);

  // 技术配置
  const techniques = useMemo(() => [
    { name: 'double_drop_32', label: 'Double Drop 32' },
    { name: 'bass_swap', label: 'Bass Swap' },
    { name: 'phrase_cut_16', label: 'Phrase Cut 16' },
    { name: 'long_layer_24', label: 'Long Layer 24' }
  ], []);

  return (
    <>
      {/* 底部抽屉 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dock"
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 320, 
              damping: 30 
            }}
            style={{
              position: 'fixed',
              left: '16px',
              right: '16px',
              bottom: '16px',
              maxWidth: '960px',
              height: '360px',
              margin: '0 auto',
              borderRadius: '16px',
              background: 'rgba(11, 15, 20, 0.95)',
              border: '1px solid rgba(215, 225, 245, 0.14)',
              boxShadow: '0 16px 50px rgba(0, 0, 0, 0.45)',
              zIndex: 90,
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '12px',
              padding: '12px',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* 左侧：情绪监控区域 */}
            <div style={{
              border: '1px solid rgba(215, 225, 245, 0.12)',
              borderRadius: '12px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: '#dfe6ff',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                AI情绪监控
              </div>
              
              {/* 这里可以集成现有的EmotionMonitor组件 */}
              <div style={{
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px'
              }}>
                情绪监控组件将在这里显示
              </div>
            </div>

            {/* 右侧：控制按钮区域 */}
            <div style={{
              display: 'grid',
              gridTemplateRows: 'auto auto 1fr',
              gap: '12px'
            }}>
              {/* 切歌控制 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <ControlButton onClick={handlePrev} variant="secondary">
                  ⏮ Prev
                </ControlButton>
                <ControlButton onClick={handleNext} variant="secondary">
                  ⏭ Next
                </ControlButton>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <ControlButton onClick={() => handleCrossfade(2500)} variant="secondary">
                  ↔ Cross 2.5s
                </ControlButton>
                <ControlButton onClick={() => handleCrossfade(4500)} variant="secondary">
                  ↔ Cross 4.5s
                </ControlButton>
              </div>

              {/* 情绪控制 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <ControlButton onClick={handleBoost} variant="primary">
                  ⚡ Boost
                </ControlButton>
                <ControlButton onClick={handleCalm} variant="secondary">
                  🌙 Calm
                </ControlButton>
              </div>

              {/* 预设和技术选择 */}
              <div style={{
                border: '1px solid rgba(215, 225, 245, 0.12)',
                borderRadius: '12px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#dfe6ff'
                }}>
                  预设 / 手法
                </div>
                
                {/* 预设选择 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  {presets.map(preset => (
                    <ControlButton
                      key={preset.name}
                      onClick={() => handlePresetForce(preset.name)}
                      variant="secondary"
                    >
                      {preset.label}
                    </ControlButton>
                  ))}
                </div>

                {/* 技术选择 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px'
                }}>
                  {techniques.map(technique => (
                    <ControlButton
                      key={technique.name}
                      onClick={() => handleTechniqueSelect(technique.name)}
                      variant="secondary"
                    >
                      {technique.label}
                    </ControlButton>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 - 打开控制台 */}
      <motion.button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(0, 255, 136, 0.2)',
          border: '1px solid rgba(0, 255, 136, 0.4)',
          color: '#00ff88',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 89,
          backdropFilter: 'blur(10px)'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        🎛️
      </motion.button>
    </>
  );
};

export default DockedAIDJConsole;
