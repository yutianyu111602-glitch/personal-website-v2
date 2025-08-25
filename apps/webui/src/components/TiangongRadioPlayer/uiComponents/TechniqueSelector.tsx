import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

/**
 * 切歌手法选择器组件
 * 显示AI推荐的切歌手法，支持用户手动选择
 */
export interface TechniqueRecommendation {
  technique: string;
  hint?: any;
  reason: string[];
  from?: string;
  contextSnapshot?: any;
}

export interface TechniqueSelectorProps {
  className?: string;
  language?: string;
}

export const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({
  className = '',
  language = 'zh'
}) => {
  const [currentRecommendation, setCurrentRecommendation] = useState<TechniqueRecommendation | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 监听AI推荐事件
    const handleTechniqueRecommend = (event: any) => {
      const data = event?.data;
      if (data && data.technique) {
        setCurrentRecommendation(data);
        setIsVisible(true);
        
        // 3秒后自动隐藏
        setTimeout(() => setIsVisible(false), 3000);
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

  if (!currentRecommendation || !isVisible) {
    return null;
  }

  const { technique, hint, reason, from } = currentRecommendation;

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

  const displayName = techniqueNames[technique] || technique;

  return (
    <motion.div
      className={`technique-selector ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '320px',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        color: '#ffffff'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00ff88',
          marginRight: '8px',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#ffffff'
        }}>
          AI混音建议
        </span>
      </div>

      {/* 推荐手法 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '700',
          color: '#00ff88',
          marginBottom: '4px'
        }}>
          {displayName}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          推荐手法
        </div>
      </div>

      {/* 推荐理由 */}
      {reason.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '4px'
          }}>
            推荐理由:
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.4'
          }}>
            {reason.join(' • ')}
          </div>
        </div>
      )}

      {/* 技术提示 */}
      {hint && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '4px'
          }}>
            技术提示:
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.4'
          }}>
            {hint.beats && `节拍: ${hint.beats}`}
            {hint.crossfadeMs && ` • 淡入: ${hint.crossfadeMs}ms`}
            {hint.bars && ` • 小节: ${hint.bars}`}
          </div>
        </div>
      )}

      {/* 来源信息 */}
      {from && (
        <div style={{ 
          fontSize: '10px', 
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'right'
        }}>
          来源: {from === 'themeTick' ? '情绪变化' : '段落切换'}
        </div>
      )}

      {/* 关闭按钮 */}
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.background = 'none';
        }}
      >
        ×
      </button>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
};

export default TechniqueSelector;
