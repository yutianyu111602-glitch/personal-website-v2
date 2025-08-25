import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

/**
 * 实时向量显示组件
 * 实现不停刷新的向量数值和信息流，符合太空银网络电台主题
 */
export interface VectorData {
  id: string;
  value: number;
  target: number;
  velocity: number;
  timestamp: number;
  category: 'emotion' | 'audio' | 'visual' | 'network' | 'ai';
  status: 'stable' | 'rising' | 'falling' | 'oscillating';
}

export interface RealTimeVectorDisplayProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const RealTimeVectorDisplay: React.FC<RealTimeVectorDisplayProps> = ({
  className = '',
  language = 'zh',
  isVisible = true,
  onToggleVisibility
}) => {
  const [vectors, setVectors] = useState<VectorData[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    // 初始化向量数据
    const initialVectors: VectorData[] = [
      { id: 'emotion_energy', value: 0.6, target: 0.6, velocity: 0, timestamp: Date.now(), category: 'emotion', status: 'stable' },
      { id: 'emotion_valence', value: 0.0, target: 0.0, velocity: 0, timestamp: Date.now(), category: 'emotion', status: 'stable' },
      { id: 'emotion_arousal', value: 0.5, target: 0.5, velocity: 0, timestamp: Date.now(), category: 'emotion', status: 'stable' },
      { id: 'audio_bpm', value: 128, target: 128, velocity: 0, timestamp: Date.now(), category: 'audio', status: 'stable' },
      { id: 'audio_key', value: 0.7, target: 0.7, velocity: 0, timestamp: Date.now(), category: 'audio', status: 'stable' },
      { id: 'visual_intensity', value: 0.6, target: 0.6, velocity: 0, timestamp: Date.now(), category: 'visual', status: 'stable' },
      { id: 'visual_motion', value: 0.55, target: 0.55, velocity: 0, timestamp: Date.now(), category: 'visual', status: 'stable' },
      { id: 'network_stability', value: 0.95, target: 0.95, velocity: 0, timestamp: Date.now(), category: 'network', status: 'stable' },
      { id: 'ai_confidence', value: 0.8, target: 0.8, velocity: 0, timestamp: Date.now(), category: 'ai', status: 'stable' },
      { id: 'ai_creativity', value: 0.6, target: 0.6, velocity: 0, timestamp: Date.now(), category: 'ai', status: 'stable' }
    ];
    setVectors(initialVectors);

    // 动画循环
    const animate = () => {
      if (!isPaused) {
        const now = Date.now();
        const deltaTime = now - lastUpdateRef.current;
        lastUpdateRef.current = now;

        setVectors(prevVectors => 
          prevVectors.map(vector => {
            // 添加随机扰动
            const noise = (Math.random() - 0.5) * 0.02;
            const newTarget = Math.max(0, Math.min(1, vector.target + noise));
            
            // 平滑过渡到目标值
            const diff = newTarget - vector.value;
            const newVelocity = vector.velocity * 0.9 + diff * 0.1;
            const newValue = Math.max(0, Math.min(1, vector.value + newVelocity));
            
            // 确定状态
            let status: VectorData['status'] = 'stable';
            if (Math.abs(newVelocity) > 0.01) {
              status = newVelocity > 0 ? 'rising' : 'falling';
            } else if (Math.abs(diff) > 0.05) {
              status = 'oscillating';
            }

            return {
              ...vector,
              value: newValue,
              target: newTarget,
              velocity: newVelocity,
              timestamp: now,
              status
            };
          })
        );

        setUpdateCount(prev => prev + 1);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    // 监听外部事件更新向量
    const handleEmotionUpdate = (event: any) => {
      const data = event?.data;
      if (data?.theme) {
        const { intensity, motion, contrast } = data.theme;
        setVectors(prev => prev.map(v => {
          if (v.id === 'visual_intensity') return { ...v, target: intensity };
          if (v.id === 'visual_motion') return { ...v, target: motion };
          if (v.id === 'visual_contrast') return { ...v, target: contrast };
          return v;
        }));
      }
    };

    const handleBpmUpdate = (event: any) => {
      const bpm = event?.data?.bpm;
      if (typeof bpm === 'number') {
        const normalizedBpm = Math.max(0, Math.min(1, (bpm - 90) / 60));
        setVectors(prev => prev.map(v => {
          if (v.id === 'audio_bpm') return { ...v, target: normalizedBpm };
          return v;
        }));
      }
    };

    // 订阅事件
    const { UnifiedEventBus } = window as any;
    if (UnifiedEventBus) {
      const unsubscribe1 = UnifiedEventBus.on('global', 'config', handleEmotionUpdate);
      const unsubscribe2 = UnifiedEventBus.on('automix', 'bpm', handleBpmUpdate);

      return () => {
        if (unsubscribe1) unsubscribe1();
        if (unsubscribe2) unsubscribe2();
      };
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'emotion': '#00ff88',
      'audio': '#ff8800',
      'visual': '#0088ff',
      'network': '#8800ff',
      'ai': '#ff0088'
    };
    return colors[category] || colors.ai;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'stable': '#00ff88',
      'rising': '#ffff00',
      'falling': '#ff4444',
      'oscillating': '#ff00ff'
    };
    return colors[status] || colors.stable;
  };

  // 获取向量名称
  const getVectorName = (id: string) => {
    const names: Record<string, string> = {
      'emotion_energy': '情绪能量',
      'emotion_valence': '情绪效价',
      'emotion_arousal': '情绪唤醒',
      'audio_bpm': '音频BPM',
      'audio_key': '音频调性',
      'visual_intensity': '视觉强度',
      'visual_motion': '视觉运动',
      'network_stability': '网络稳定性',
      'ai_confidence': 'AI置信度',
      'ai_creativity': 'AI创造力'
    };
    return names[id] || id;
  };

  return (
    <motion.div
      className={`real-time-vector-display ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        width: '400px',
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
            background: '#ff0088',
            marginRight: '10px',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255, 0, 136, 0.5)'
          }}>
            实时向量监控
          </span>
        </div>
        
        {/* 控制按钮 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              background: isPaused ? 'rgba(255, 0, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${isPaused ? 'rgba(255, 0, 136, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isPaused ? '继续' : '暂停'}
          </button>
          
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            background: 'rgba(255, 0, 136, 0.1)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 136, 0.3)'
          }}>
            #{updateCount.toString().padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* 向量列表 */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {vectors.map((vector) => (
          <motion.div
            key={vector.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '8px',
              border: `1px solid ${getCategoryColor(vector.category)}`,
              position: 'relative'
            }}
            animate={{
              scale: vector.status === 'oscillating' ? [1, 1.02, 1] : 1
            }}
            transition={{
              duration: 0.5,
              repeat: vector.status === 'oscillating' ? Infinity : 0
            }}
          >
            {/* 向量头部信息 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600'
              }}>
                {getVectorName(vector.id)}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 状态指示器 */}
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getStatusColor(vector.status),
                  animation: vector.status === 'oscillating' ? 'pulse 1s infinite' : 'none'
                }} />
                
                {/* 类别标签 */}
                <span style={{
                  fontSize: '9px',
                  color: getCategoryColor(vector.category),
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {vector.category}
                </span>
              </div>
            </div>

            {/* 数值显示 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>当前值</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: getCategoryColor(vector.category)
                }}>
                  {vector.value.toFixed(3)}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>目标值</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {vector.target.toFixed(3)}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>变化率</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: Math.abs(vector.velocity) > 0.01 ? '#ffff00' : 'rgba(255, 255, 255, 0.6)'
                }}>
                  {(vector.velocity * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 进度条 */}
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* 目标值指示器 */}
              <div style={{
                position: 'absolute',
                left: `${vector.target * 100}%`,
                top: '0',
                width: '2px',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.5)',
                zIndex: 2
              }} />
              
              {/* 当前值进度条 */}
              <motion.div
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${getCategoryColor(vector.category)}, rgba(255, 0, 136, 0.3))`,
                  borderRadius: '3px',
                  position: 'relative',
                  zIndex: 1
                }}
                initial={{ width: 0 }}
                animate={{ width: `${vector.value * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            {/* 时间戳 */}
            <div style={{ 
              fontSize: '8px', 
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'right',
              marginTop: '4px'
            }}>
              {new Date(vector.timestamp).toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
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

export default RealTimeVectorDisplay;
