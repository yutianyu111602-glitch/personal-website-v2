import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

/**
 * AidjMix决策显示组件
 * 实时显示AidjMix的瞬间决定和参数，符合太空银网络电台主题
 */
export interface AidjMixDecision {
  technique: string;
  hint?: any;
  reason: string[];
  from?: string;
  contextSnapshot?: {
    bpmFrom: number;
    bpmTo: number;
    keyFrom?: string;
    keyTo?: string;
    segment?: string;
    vocality?: number;
    simpleHeadTail?: boolean;
    dropoutRate?: number;
    recentErrors?: number;
    emotion?: any;
  };
  timestamp: number;
}

export interface AidjMixDecisionDisplayProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const AidjMixDecisionDisplay: React.FC<AidjMixDecisionDisplayProps> = ({
  className = '',
  language = 'zh',
  isVisible = true,
  onToggleVisibility
}) => {
  const [currentDecision, setCurrentDecision] = useState<AidjMixDecision | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<AidjMixDecision[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // 监听AidjMix技术推荐事件
    const handleTechniqueRecommend = (event: any) => {
      const data = event?.data;
      if (data && data.technique) {
        const decision: AidjMixDecision = {
          ...data,
          timestamp: Date.now()
        };
        
        setCurrentDecision(decision);
        setDecisionHistory(prev => [decision, ...prev.slice(0, 4)]); // 保留最近5个决策
        setUpdateCount(prev => prev + 1);
      }
    };

    // 订阅事件
    const { UnifiedEventBus } = window as any;
    if (UnifiedEventBus) {
      const unsubscribe = UnifiedEventBus.on('automix', 'technique_recommend', handleTechniqueRecommend);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  // 手法名称映射
  const techniqueNames: Record<string, string> = {
    'simple_head_tail': '简单头尾',
    'bass_swap': '低音交换',
    'long_layer_24': '24拍长层叠',
    'long_layer_32': '32拍长层叠',
    'phrase_cut_16': '16拍短切',
    'mid_scoop_cross': '中频挖空交叉',
    'hat_carry': '踩镲延续',
    'percussion_tease': '打击乐挑逗',
    'hp_sweep_in': '高通扫入',
    'lp_sweep_out': '低通扫出',
    'delay_tail_1_2': '延迟尾音1/2',
    'reverb_wash': '混响冲刷',
    'loop_roll_4': '4拍循环滚动',
    'backspin_safe': '安全回旋',
    'brake_fx': '刹车特效',
    'double_drop_32': '32拍双落',
    'stutter_gate': '结巴门限',
    'kick_replace': '踢鼓替换',
    'bass_duck_side': '低音侧链',
    'noise_riser_cross': '噪音上升交叉'
  };

  const getTechniqueColor = (technique: string) => {
    const colors: Record<string, string> = {
      'simple_head_tail': '#00ff88',
      'bass_swap': '#ff8800',
      'long_layer_24': '#0088ff',
      'long_layer_32': '#8800ff',
      'phrase_cut_16': '#ff0088',
      'double_drop_32': '#ffff00',
      'stutter_gate': '#ff00ff',
      'default': '#00ffff'
    };
    return colors[technique] || colors.default;
  };

  return (
    <motion.div
      className={`aidjmix-decision-display ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        width: '380px',
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
            background: '#ff8800',
            marginRight: '10px',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255, 136, 0, 0.5)'
          }}>
            AidjMix决策监控
          </span>
        </div>
        
        {/* 更新计数器 */}
        <div style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(255, 136, 0, 0.1)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 136, 0, 0.3)'
        }}>
          #{updateCount.toString().padStart(4, '0')}
        </div>
      </div>

      {/* 当前决策 */}
      {currentDecision && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            当前决策
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            border: `2px solid ${getTechniqueColor(currentDecision.technique)}`,
            position: 'relative'
          }}>
            {/* 决策类型 */}
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
                推荐手法
              </span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700',
                color: getTechniqueColor(currentDecision.technique),
                textShadow: `0 0 10px ${getTechniqueColor(currentDecision.technique)}`
              }}>
                {techniqueNames[currentDecision.technique] || currentDecision.technique}
              </span>
            </div>

            {/* 推荐理由 */}
            {currentDecision.reason.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px'
                }}>
                  推荐理由:
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {currentDecision.reason.join(' • ')}
                </div>
              </div>
            )}

            {/* 技术提示 */}
            {currentDecision.hint && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px'
                }}>
                  技术参数:
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {currentDecision.hint.beats && `节拍: ${currentDecision.hint.beats}`}
                  {currentDecision.hint.crossfadeMs && ` • 淡入: ${currentDecision.hint.crossfadeMs}ms`}
                  {currentDecision.hint.bars && ` • 小节: ${currentDecision.hint.bars}`}
                  {currentDecision.hint.eq && ` • EQ: ${JSON.stringify(currentDecision.hint.eq)}`}
                </div>
              </div>
            )}

            {/* 来源信息 */}
            <div style={{ 
              fontSize: '10px', 
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right'
            }}>
              来源: {currentDecision.from === 'themeTick' ? '情绪变化' : '段落切换'}
            </div>

            {/* 时间戳 */}
            <div style={{ 
              fontSize: '9px', 
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'right',
              marginTop: '4px'
            }}>
              {new Date(currentDecision.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* 上下文快照 */}
      {currentDecision?.contextSnapshot && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            决策上下文
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>BPM</div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#00ff88'
              }}>
                {currentDecision.contextSnapshot.bpmFrom} → {currentDecision.contextSnapshot.bpmTo}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>段落</div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#00ff88'
              }}>
                {currentDecision.contextSnapshot.segment || 'steady'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>调性</div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#00ff88'
              }}>
                {currentDecision.contextSnapshot.keyFrom || 'N/A'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)' }}>网络状态</div>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: '600',
                color: currentDecision.contextSnapshot.dropoutRate > 0.05 ? '#ff4444' : '#00ff88'
              }}>
                {currentDecision.contextSnapshot.dropoutRate > 0.05 ? '不稳定' : '稳定'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 决策历史 */}
      {decisionHistory.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            决策历史
          </div>
          
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {decisionHistory.slice(1).map((decision, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '10px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    color: getTechniqueColor(decision.technique),
                    fontWeight: '600'
                  }}>
                    {techniqueNames[decision.technique] || decision.technique}
                  </span>
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '9px'
                  }}>
                    {new Date(decision.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '9px',
                  marginTop: '2px'
                }}>
                  {decision.reason.slice(0, 2).join(' • ')}
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

export default AidjMixDecisionDisplay;
