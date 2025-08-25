import React from "react";

/**
 * 🎵 音频数据信息组件
 * 
 * 功能：
 * - 显示BPM和能量等音频特征数据
 * - 实时更新音频分析结果
 * - 优雅处理数据加载状态
 * - 直观的数据可视化展示
 * 
 * 职责：
 * - 音频数据展示
 * - 加载状态处理
 * - 数据格式化
 */
export const AudioDataInfo: React.FC<{
  bpm: number | null;
  energy: number | null;
}> = ({ bpm, energy }) => {
  return (
    <div className="w-full h-12 bg-silver-primary-90 rounded mb-4 flex items-center justify-center">
      <div className="text-center">
        {/* 🎵 BPM信息 */}
        <div className="text-silver-primary-40 text-xs">
          {bpm ? `BPM: ${bpm}` : '等待音频数据...'}
        </div>
        
        {/* ⚡ 能量信息 */}
        {energy !== null && (
          <div className="text-silver-primary-50 text-xs mt-1">
            能量: {Math.round(energy * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};
