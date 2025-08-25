import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

/**
 * 预设使用监控组件
 * 显示当前使用的预设和选择原因，符合太空银网络电台主题
 */
export interface PresetUsage {
  presetName: string;
  presetType: 'techno' | 'ambient' | 'progressive' | 'minimal' | 'custom';
  reason: string[];
  confidence: number;
  lastUsed: number;
  usageCount: number;
  parameters: {
    bpmRange?: [number, number];
    keyCompatibility?: string[];
    energyLevel?: number;
    complexity?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  timestamp: number;
}

export interface PresetUsageMonitorProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const PresetUsageMonitor: React.FC<PresetUsageMonitorProps> = ({
  className = '',
  language = 'zh',
  isVisible = true,
  onToggleVisibility
}) => {
  const [currentPreset, setCurrentPreset] = useState<PresetUsage | null>(null);
  const [presetHistory, setPresetHistory] = useState<PresetUsage[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // 监听预设变化事件
    const handlePresetChange = (event: any) => {
      const data = event?.data;
      if (data && data.preset) {
        const preset: PresetUsage = {
          presetName: data.preset.name || 'Unknown',
          presetType: data.preset.type || 'custom',
          reason: data.preset.reason || ['自动选择'],
          confidence: data.preset.confidence || 0.8,
          lastUsed: data.preset.lastUsed || Date.now(),
          usageCount: data.preset.usageCount || 1,
          parameters: data.preset.parameters || {},
          timestamp: Date.now()
        };
        
        setCurrentPreset(preset);
        setPresetHistory(prev => [preset, ...prev.slice(0, 4)]); // 保留最近5个预设
        setUpdateCount(prev => prev + 1);
      }
    };

    // 监听情绪变化事件，模拟预设选择
    const handleEmotionUpdate = (event: any) => {
      const data = event?.data;
      if (data?.theme) {
        const { intensity, motion, contrast } = data.theme;
        
        // 根据情绪状态模拟预设选择
        let presetType: PresetUsage['presetType'] = 'techno';
        let reason = ['情绪变化触发'];
        
        if (intensity > 0.7 && motion > 0.6) {
          presetType = 'techno';
          reason = ['高能量高运动', '适合Techno风格'];
        } else if (intensity < 0.3 && motion < 0.4) {
          presetType = 'ambient';
          reason = ['低能量低运动', '适合环境音乐'];
        } else if (contrast > 0.6) {
          presetType = 'progressive';
          reason = ['高对比度', '适合渐进式风格'];
        }
        
        const mockPreset: PresetUsage = {
          presetName: `${presetType}_v${Math.floor(Math.random() * 10) + 1}`,
          presetType,
          reason,
          confidence: 0.7 + Math.random() * 0.2,
          lastUsed: Date.now(),
          usageCount: Math.floor(Math.random() * 50) + 1,
          parameters: {
            bpmRange: [120, 140],
            energyLevel: intensity,
            complexity: motion,
            riskLevel: contrast > 0.7 ? 'high' : 'low'
          },
          timestamp: Date.now()
        };
        
        setCurrentPreset(mockPreset);
        setPresetHistory(prev => [mockPreset, ...prev.slice(0, 4)]);
        setUpdateCount(prev => prev + 1);
      }
    };

    // 订阅事件
    const { UnifiedEventBus } = window as any;
    if (UnifiedEventBus) {
      const unsubscribe1 = UnifiedEventBus.on('automix', 'preset_change', handlePresetChange);
      const unsubscribe2 = UnifiedEventBus.on('global', 'config', handleEmotionUpdate);

      return () => {
        if (unsubscribe1) unsubscribe1();
        if (unsubscribe2) unsubscribe2();
      };
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  // 预设类型颜色映射
  const getPresetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'techno': '#ff8800',
      'ambient': '#0088ff',
      'progressive': '#8800ff',
      'minimal': '#00ff88',
      'custom': '#ff0088'
    };
    return colors[type] || colors.custom;
  };

  // 风险等级颜色
  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      'low': '#00ff88',
      'medium': '#ffff00',
      'high': '#ff4444'
    };
    return colors[risk] || colors.medium;
  };

  return (
    <motion.div
      className={`preset-usage-monitor ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        width: '360px',
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
            background: '#8800ff',
            marginRight: '10px',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(136, 0, 255, 0.5)'
          }}>
            预设使用监控
          </span>
        </div>
        
        {/* 更新计数器 */}
        <div style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(136, 0, 255, 0.1)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid rgba(136, 0, 255, 0.3)'
        }}>
          #{updateCount.toString().padStart(4, '0')}
        </div>
      </div>

      {/* 当前预设 */}
      {currentPreset && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            当前活跃预设
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            border: `2px solid ${getPresetTypeColor(currentPreset.presetType)}`,
            position: 'relative'
          }}>
            {/* 预设名称和类型 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600'
              }}>
                预设名称
              </span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '700',
                color: getPresetTypeColor(currentPreset.presetType),
                textShadow: `0 0 10px ${getPresetTypeColor(currentPreset.presetType)}`
              }}>
                {currentPreset.presetName}
              </span>
            </div>

            {/* 预设类型 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                类型
              </span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: getPresetTypeColor(currentPreset.presetType),
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {currentPreset.presetType}
              </span>
            </div>

            {/* 置信度 */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>置信度</span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: currentPreset.confidence > 0.8 ? '#00ff88' : 
                         currentPreset.confidence > 0.6 ? '#ffff00' : '#ff4444'
                }}>
                  {(currentPreset.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${getPresetTypeColor(currentPreset.presetType)}, rgba(136, 0, 255, 0.3))`,
                    borderRadius: '2px'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${currentPreset.confidence * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* 选择原因 */}
            {currentPreset.reason.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px'
                }}>
                  选择原因:
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {currentPreset.reason.join(' • ')}
                </div>
              </div>
            )}

            {/* 使用统计 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>使用次数</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#00ff88'
                }}>
                  {currentPreset.usageCount}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>最后使用</div>
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: '600',
                  color: '#00ff88'
                }}>
                  {new Date(currentPreset.lastUsed).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* 时间戳 */}
            <div style={{ 
              fontSize: '9px', 
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'right'
            }}>
              {new Date(currentPreset.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* 预设参数 */}
      {currentPreset?.parameters && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            预设参数
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            {currentPreset.parameters.bpmRange && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>BPM范围</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: '#00ff88'
                }}>
                  {currentPreset.parameters.bpmRange[0]} - {currentPreset.parameters.bpmRange[1]}
                </div>
              </div>
            )}
            
            {currentPreset.parameters.energyLevel !== undefined && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>能量等级</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: '#00ff88'
                }}>
                  {(currentPreset.parameters.energyLevel * 100).toFixed(0)}%
                </div>
              </div>
            )}
            
            {currentPreset.parameters.complexity !== undefined && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>复杂度</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: '#00ff88'
                }}>
                  {(currentPreset.parameters.complexity * 100).toFixed(0)}%
                </div>
              </div>
            )}
            
            {currentPreset.parameters.riskLevel && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>风险等级</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: getRiskColor(currentPreset.parameters.riskLevel)
                }}>
                  {currentPreset.parameters.riskLevel === 'low' ? '低' : 
                   currentPreset.parameters.riskLevel === 'medium' ? '中' : '高'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 预设历史 */}
      {presetHistory.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            预设历史
          </div>
          
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {presetHistory.slice(1).map((preset, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '9px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    color: getPresetTypeColor(preset.presetType),
                    fontWeight: '600'
                  }}>
                    {preset.presetName}
                  </span>
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '8px'
                  }}>
                    {new Date(preset.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '8px',
                  marginTop: '2px'
                }}>
                  {preset.reason.slice(0, 1).join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default PresetUsageMonitor;
