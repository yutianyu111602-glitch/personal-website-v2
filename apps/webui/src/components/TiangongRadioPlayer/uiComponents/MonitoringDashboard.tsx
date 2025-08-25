import React, { useState } from 'react';
import { motion } from 'motion/react';
import { EmotionMonitor } from './EmotionMonitor';
import { AidjMixDecisionDisplay } from './AidjMixDecisionDisplay';
import { PresetUsageMonitor } from './PresetUsageMonitor';
import { RealTimeVectorDisplay } from './RealTimeVectorDisplay';

/**
 * 监控面板管理器组件
 * 统一管理所有监控组件的显示状态，提供全局控制
 */
export interface MonitoringDashboardProps {
  className?: string;
  language?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = '',
  language = 'zh'
}) => {
  const [monitorStates, setMonitorStates] = useState({
    emotion: true,
    aidjMix: true,
    preset: true,
    vector: true
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMonitor = (monitor: keyof typeof monitorStates) => {
    setMonitorStates(prev => ({
      ...prev,
      [monitor]: !prev[monitor]
    }));
  };

  const toggleAll = (show: boolean) => {
    setMonitorStates({
      emotion: show,
      aidjMix: show,
      preset: show,
      vector: show
    });
  };

  if (isMinimized) {
    return (
      <motion.div
        className={`monitoring-dashboard-minimized ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(11, 15, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px 20px',
          backdropFilter: 'blur(20px)',
          zIndex: 1001,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          fontFamily: 'monospace',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00ff88',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>
            AI监控面板 (点击展开)
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* 监控面板控制中心 */}
      <motion.div
        className={`monitoring-dashboard-control ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(11, 15, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px 24px',
          backdropFilter: 'blur(20px)',
          zIndex: 1001,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          fontFamily: 'monospace'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#00ff88',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '700',
              color: '#ffffff',
              textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
            }}>
              AI监控面板控制中心
            </span>
          </div>
          
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            最小化
          </button>
        </div>

        {/* 监控组件开关 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => toggleMonitor('emotion')}
            style={{
              background: monitorStates.emotion ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${monitorStates.emotion ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
              color: monitorStates.emotion ? '#00ff88' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
          >
            情绪监控
          </button>
          
          <button
            onClick={() => toggleMonitor('aidjMix')}
            style={{
              background: monitorStates.aidjMix ? 'rgba(255, 136, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${monitorStates.aidjMix ? 'rgba(255, 136, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
              color: monitorStates.aidjMix ? '#ff8800' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
          >
            AidjMix决策
          </button>
          
          <button
            onClick={() => toggleMonitor('preset')}
            style={{
              background: monitorStates.preset ? 'rgba(136, 0, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${monitorStates.preset ? 'rgba(136, 0, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
              color: monitorStates.preset ? '#8800ff' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
          >
            预设监控
          </button>
          
          <button
            onClick={() => toggleMonitor('vector')}
            style={{
              background: monitorStates.vector ? 'rgba(255, 0, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${monitorStates.vector ? 'rgba(255, 0, 136, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
              color: monitorStates.vector ? '#ff0088' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
          >
            向量监控
          </button>
        </div>

        {/* 全局控制 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px'
        }}>
          <button
            onClick={() => toggleAll(true)}
            style={{
              background: 'rgba(0, 255, 136, 0.2)',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              color: '#00ff88',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.2)';
            }}
          >
            显示全部
          </button>
          
          <button
            onClick={() => toggleAll(false)}
            style={{
              background: 'rgba(255, 68, 68, 0.2)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              color: '#ff4444',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
            }}
          >
            隐藏全部
          </button>
        </div>
      </motion.div>

      {/* 监控组件 */}
      <EmotionMonitor 
        isVisible={monitorStates.emotion}
        onToggleVisibility={() => toggleMonitor('emotion')}
      />
      
      <AidjMixDecisionDisplay 
        isVisible={monitorStates.aidjMix}
        onToggleVisibility={() => toggleMonitor('aidjMix')}
      />
      
      <PresetUsageMonitor 
        isVisible={monitorStates.preset}
        onToggleVisibility={() => toggleMonitor('preset')}
      />
      
      <RealTimeVectorDisplay 
        isVisible={monitorStates.vector}
        onToggleVisibility={() => toggleMonitor('vector')}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default MonitoringDashboard;
