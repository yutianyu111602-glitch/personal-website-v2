import React from "react";
import { getSyncButtonClass, getSyncButtonTitle } from "../styleLogic";

/**
 * 🎵 播放器头部组件
 * 
 * 功能：
 * - 显示播放器标题和状态
 * - 提供同步开关和关闭按钮
 * - 响应式设计，支持最小化状态
 * - 统一的视觉风格和交互体验
 * 
 * 职责：
 * - 头部UI渲染
 * - 控制按钮交互
 * - 状态显示管理
 */
export const PlayerHeader: React.FC<{
  isMinimized: boolean;
  syncActive: boolean;
  onSyncToggle?: () => void;
  onClose?: () => void;
  t: any;
}> = ({ isMinimized, syncActive, onSyncToggle, onClose, t }) => {
  // 处理同步状态切换
  const handleSyncToggle = () => {
    if (onSyncToggle) {
      onSyncToggle();
    }
  };

  // 处理关闭播放器
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-silver-primary-90/95 backdrop-blur-md border border-silver-primary-60 rounded-t-lg p-3 flex items-center justify-between">
      {/* 🎨 装饰性圆点 */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>

      {/* 📱 播放器标题 */}
      <div className="text-silver-primary-20 text-sm font-mono">
        {isMinimized ? 'RADIO' : 'TIANGONG RADIO'}
      </div>

      {/* 🔧 控制按钮组 */}
      <div className="flex items-center space-x-2">
        {/* 🔄 同步开关按钮 */}
        <button
          onClick={handleSyncToggle}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${getSyncButtonClass(syncActive)}`}
          title={getSyncButtonTitle(syncActive)}
          aria-label="切换同步状态"
        >
          🔄
        </button>

        {/* ✕ 关闭按钮 */}
        <button
          onClick={handleClose}
          className="w-6 h-6 rounded-full bg-silver-primary-40 text-silver-primary-60 hover:bg-silver-primary-60 hover:text-silver-primary-20 transition-colors flex items-center justify-center text-xs"
          title="关闭播放器"
          aria-label="关闭播放器"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
