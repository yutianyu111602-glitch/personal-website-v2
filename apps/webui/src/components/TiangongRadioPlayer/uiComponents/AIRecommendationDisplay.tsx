import React from "react";

/**
 * 🤖 AI推荐显示组件
 * 
 * 功能：
 * - 展示AI分析后的混音技术建议
 * - 显示推荐手法、参数和理由
 * - 支持多种推荐类型的展示
 * - 优雅的视觉布局和交互体验
 * 
 * 职责：
 * - AI推荐信息展示
 * - 推荐内容格式化
 * - 视觉布局管理
 */
export const AIRecommendationDisplay: React.FC<{
  aiRecommendation: any;
}> = ({ aiRecommendation }) => {
  if (!aiRecommendation) return null;

  return (
    <div className="bg-silver-primary-90/80 backdrop-blur-sm rounded-lg p-3 border border-silver-primary-60">
      {/* 🎯 推荐手法 */}
      <div className="text-center mb-2">
        <div className="text-silver-primary-20 font-medium text-sm">
          推荐手法: {aiRecommendation.technique}
        </div>
        {aiRecommendation.hint && (
          <div className="text-silver-primary-50 text-xs mt-1">
            参数: {JSON.stringify(aiRecommendation.hint)}
          </div>
        )}
      </div>
      
      {/* 📝 推荐理由 */}
      <div className="space-y-1">
        <div className="text-silver-primary-40 text-xs font-medium">推荐理由:</div>
        {aiRecommendation.reason.map((reason: string, index: number) => (
          <div key={index} className="text-silver-primary-50 text-xs pl-2">
            • {reason}
          </div>
        ))}
      </div>
    </div>
  );
};
