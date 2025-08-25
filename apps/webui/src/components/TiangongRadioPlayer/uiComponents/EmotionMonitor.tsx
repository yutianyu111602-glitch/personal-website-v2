import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

/**
 * 情绪能量系统实时监控组件
 * 符合太空银网络电台主题，显示AI情绪分析结果
 */
export interface EmotionData {
  energy: number;
  valence: number;
  arousal: number;
  intensity: number;
  motion: number;
  contrast: number;
  timestamp: number;
}

export interface EmotionMonitorProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const EmotionMonitor: React.FC<EmotionMonitorProps> = ({
  className = '',
  language = 'zh',
  isVisible = true,
  onToggleVisibility
}) => {
  const [emotionData, setEmotionData] = useState<EmotionData>({
    energy: 0.6,
    valence: 0.0,
    arousal: 0.5,
    intensity: 0.6,
    motion: 0.55,
    contrast: 0.5,
    timestamp: Date.now()
  });

  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // 监听情绪变化事件
    const handleEmotionUpdate = (event: any) => {
      const data = event?.data;
      if (data?.theme) {
        const { intensity, motion, contrast } = data.theme;
        setEmotionData(prev => ({
          ...prev,
          intensity: intensity || prev.intensity,
          motion: motion || prev.motion,
          contrast: contrast || prev.contrast,
          timestamp: Date.now()
        }));
        setUpdateCount(prev => prev + 1);
      }
    };

    // 监听情绪输入事件
    const handleMoodUpdate = (event: any) => {
      const mood = event?.data?.mood;
      if (mood) {
        setEmotionData(prev => ({
          ...prev,
          energy: mood.energy || prev.energy,
          valence: mood.valence || prev.valence,
          arousal: mood.arousal || prev.arousal,
          timestamp: Date.now()
        }));
        setUpdateCount(prev => prev + 1);
      }
    };

    // 监听BPM事件
    const handleBpmUpdate = (event: any) => {
      const bpm = event?.data?.bpm;
      if (typeof bpm === 'number') {
        // BPM影响能量计算
        const energyFromBpm = Math.max(0, Math.min(1, (bpm - 90) / 60));
        setEmotionData(prev => ({
          ...prev,
          energy: energyFromBpm,
          timestamp: Date.now()
        }));
        setUpdateCount(prev => prev + 1);
      }
    };

    // 订阅事件
    const { UnifiedEventBus } = window as any;
    if (UnifiedEventBus) {
      const unsubscribe1 = UnifiedEventBus.on('global', 'config', handleEmotionUpdate);
      const unsubscribe2 = UnifiedEventBus.on('automix', 'mood', handleMoodUpdate);
      const unsubscribe3 = UnifiedEventBus.on('automix', 'bpm', handleBpmUpdate);

      return () => {
        if (unsubscribe1) unsubscribe1();
        if (unsubscribe2) unsubscribe2();
        if (unsubscribe3) unsubscribe3();
      };
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  // 计算颜色渐变
  const getEnergyColor = (value: number) => {
    const hue = 120 + (value * 60); // 绿色到黄色
    return `hsl(${hue}, 70%, 60%)`;
  };

  const getValenceColor = (value: number) => {
    const hue = 200 + (value * 40); // 蓝色到青色
    return `hsl(${hue}, 70%, 60%)`;
  };

  const getArousalColor = (value: number) => {
    const hue = 300 + (value * 60); // 紫色到红色
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <motion.div
      className={`emotion-monitor ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        width: '320px',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        fontFamily: 'monospace'
      }}
    >
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#00ff88',
            marginRight: '10px',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
          }}>
            AI情绪监控
          </span>
        </div>
        
        {/* 更新计数器 */}
        <div style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(0, 255, 136, 0.1)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 136, 0.3)'
        }}>
          #{updateCount.toString().padStart(4, '0')}
        </div>
      </div>

      {/* 核心情绪指标 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          核心情绪向量
        </div>
        
        {/* 能量 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>能量</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: getEnergyColor(emotionData.energy)
            }}>
              {emotionData.energy.toFixed(3)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${getEnergyColor(emotionData.energy)}, rgba(0, 255, 136, 0.3))`,
                borderRadius: '3px'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${emotionData.energy * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 效价 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>效价</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: getValenceColor((emotionData.valence + 1) / 2)
            }}>
              {emotionData.valence.toFixed(3)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${getValenceColor((emotionData.valence + 1) / 2)}, rgba(0, 150, 255, 0.3))`,
                borderRadius: '3px'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${((emotionData.valence + 1) / 2) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 唤醒 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>唤醒</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: getArousalColor(emotionData.arousal)
            }}>
              {emotionData.arousal.toFixed(3)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${getArousalColor(emotionData.arousal)}, rgba(255, 0, 150, 0.3))`,
                borderRadius: '3px'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${emotionData.arousal * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* 衍生指标 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          衍生视觉指标
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>强度</div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#00ff88'
            }}>
              {emotionData.intensity.toFixed(3)}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>运动</div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#00ff88'
            }}>
              {emotionData.motion.toFixed(3)}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>对比</div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#00ff88'
            }}>
              {emotionData.contrast.toFixed(3)}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>时间</div>
            <div style={{ 
              fontSize: '10px', 
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {new Date(emotionData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* 关闭按钮 */}
      {onToggleVisibility && (
        <button
          onClick={onToggleVisibility}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
            borderRadius: '6px',
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
          隐藏
        </button>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
};

export default EmotionMonitor;
