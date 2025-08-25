import React from 'react';
import { TiangongRadioPlayer } from './index';

/**
 * 电台模块测试页面
 * 用于验证重构后的电台模块功能
 */
export const RadioPlayerTest: React.FC = () => {
  const [syncActive, setSyncActive] = React.useState(false);
  const [showPlayer, setShowPlayer] = React.useState(true);

  const handleSyncToggle = () => {
    setSyncActive(prev => !prev);
    console.log('🔄 同步状态切换:', !syncActive);
  };

  const handleClose = () => {
    setShowPlayer(false);
    console.log('🚪 关闭播放器');
  };

  const handleShowPlayer = () => {
    setShowPlayer(true);
    console.log('🎵 显示播放器');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎵 电台模块功能测试
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🧪 测试控制</h2>
            <div className="space-y-4">
              <button
                onClick={handleShowPlayer}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                显示播放器
              </button>
              
              <div className="flex items-center space-x-4">
                <span>同步状态:</span>
                <button
                  onClick={handleSyncToggle}
                  className={`px-4 py-2 rounded ${
                    syncActive 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {syncActive ? '已启用' : '已禁用'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📊 测试状态</h2>
            <div className="space-y-2 text-sm">
              <div>播放器显示: <span className="text-green-400">{showPlayer ? '是' : '否'}</span></div>
              <div>同步状态: <span className={syncActive ? 'text-green-400' : 'text-red-400'}>{syncActive ? '已启用' : '已禁用'}</span></div>
              <div>语言: <span className="text-blue-400">中文</span></div>
            </div>
          </div>
        </div>

        {showPlayer && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🎵 电台播放器</h2>
            <TiangongRadioPlayer
              language="zh"
              syncActive={syncActive}
              onSyncToggle={handleSyncToggle}
              onClose={handleClose}
              autoPlayOnMount={false}
              preloadOnly={false}
            />
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">📋 测试清单</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>播放器正确渲染</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>吸附系统正常工作</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>播放/暂停按钮响应</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>音量控制正常工作</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>同步按钮状态切换</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>关闭按钮正常工作</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>事件系统集成正常</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>状态管理优化生效</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
