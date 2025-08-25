/**
 * 高级音乐整理器组件
 * 对接后端API，支持Spotify导出、网易云整理、任务监控等功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getBackendConnector,
  type SpotifyExportRequest,
  type MusicOrganizeRequest,
  type TaskResponse,
  type TaskStatus,
  type OrganizeResult,
  type MediaFile,
  type EnvironmentCheck
} from './util/backendConnector';
import { getTranslations } from './util/i18n';
import WavesurferPlayer from './WavesurferPlayer';
import ExportSectionLayout from './layout/ExportSectionLayout';

// 组件状态类型
interface OrganizerState {
  currentTab: 'export' | 'organize' | 'player';
  isLoading: boolean;
  error: string | null;
  success: string | null;
  
  // Spotify导出相关
  playlistUrl: string;
  exportTask: TaskResponse | null;
  exportStatus: TaskStatus | null;
  
  // 音乐整理相关
  selectedExportFile: string;
  musicRoots: string[];
  organizeOptions: {
    aggressive: boolean;
    autoConvertNcm: boolean;
    forceMp3: boolean;
  };
  organizeTask: TaskResponse | null;
  organizeStatus: TaskStatus | null;
  organizeResult: OrganizeResult | null;
  
  // 媒体播放相关
  mediaFiles: MediaFile[];
  selectedMediaFile: MediaFile | null;
  
  // 环境检查
  environmentCheck: EnvironmentCheck | null;
  backendHealth: {
    webService: boolean;
    termusicGateway: boolean;
    audioGateway: boolean;
  } | null;
}

// 组件属性
interface AdvancedMusicOrganizerProps {
  language?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const AdvancedMusicOrganizer: React.FC<AdvancedMusicOrganizerProps> = ({
  language = 'zh',
  onError,
  onSuccess,
}) => {
  const [state, setState] = useState<OrganizerState>({
    currentTab: 'export',
    isLoading: false,
    error: null,
    success: null,
    
    playlistUrl: '',
    exportTask: null,
    exportStatus: null,
    
    selectedExportFile: '',
    musicRoots: [],
    organizeOptions: {
      aggressive: true,
      autoConvertNcm: true,
      forceMp3: true,
    },
    organizeTask: null,
    organizeStatus: null,
    organizeResult: null,
    
    mediaFiles: [],
    selectedMediaFile: null,
    
    environmentCheck: null,
    backendHealth: null,
  });

  const t = getTranslations(language);
  const backendConnector = getBackendConnector();

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (taskId: string, taskType: 'export' | 'organize') => {
    try {
      const status = await backendConnector.getExportTaskStatus(taskId);
      
      if (taskType === 'export') {
        setState(prev => ({ ...prev, exportStatus: status }));
      } else {
        setState(prev => ({ ...prev, organizeStatus: status }));
        
        // 如果整理任务完成，保存结果
        if (status.task_status === 'completed' && status.result) {
          setState(prev => ({ ...prev, organizeResult: status.result }));
        }
      }
      
      // 如果任务还在进行中，继续轮询
      if (status.task_status === 'pending' || status.task_status === 'running') {
        setTimeout(() => pollTaskStatus(taskId, taskType), 2000);
      }
      
    } catch (error) {
      console.error('Failed to poll task status:', error);
    }
  }, [backendConnector]);

  // 检查后端健康状态
  const checkBackendHealth = useCallback(async () => {
    try {
      const [healthCheck, envCheck] = await Promise.all([
        backendConnector.healthCheck(),
        backendConnector.checkEnvironment(),
      ]);
      
      setState(prev => ({
        ...prev,
        backendHealth: healthCheck,
        environmentCheck: envCheck,
      }));
      
    } catch (error) {
      console.warn('Backend health check failed - using mock data:', error);
      // 设置模拟的后端健康状态，避免阻断界面
      setState(prev => ({
        ...prev,
        backendHealth: {
          webService: false,
          termusicGateway: false,
          audioGateway: false,
        },
        environmentCheck: {
          python: false,
          ffmpeg: false,
          termusic: false,
          spotify_dl: false,
          ncmdump: false,
        },
      }));
    }
  }, [backendConnector, language]);

  // 获取默认音乐根目录
  const loadDefaultMusicRoots = useCallback(async () => {
    try {
      const roots = await backendConnector.getDefaultMusicRoots();
      setState(prev => ({ ...prev, musicRoots: roots }));
    } catch (error) {
      console.warn('Failed to load default music roots - using defaults:', error);
      // 使用默认的音乐根目录
      setState(prev => ({ 
        ...prev, 
        musicRoots: [
          '~/Music',
          '~/Downloads/Music',
          '/tmp/music'
        ]
      }));
    }
  }, [backendConnector]);

  // 加载媒体文件列表
  const loadMediaFiles = useCallback(async () => {
    try {
      // 首先尝试自动挂载网易云
      await backendConnector.autoMountNetease();
      
      // 然后获取媒体文件列表
      const files = await backendConnector.listMedia('@柔', 'netease_auto');
      setState(prev => ({ ...prev, mediaFiles: files }));
      
    } catch (error) {
      console.warn('Failed to load media files - using mock data:', error);
      // 使用模拟的媒体文件数据
      setState(prev => ({ 
        ...prev, 
        mediaFiles: [
          {
            name: 'Demo Track 1.mp3',
            url: '/demo/track1.mp3',
            size: 5242880,
            suffix: 'mp3'
          },
          {
            name: 'Demo Track 2.flac',
            url: '/demo/track2.flac',
            size: 15728640,
            suffix: 'flac'
          }
        ]
      }));
    }
  }, [backendConnector]);

  // 处理Spotify导出
  const handleSpotifyExport = useCallback(async () => {
    if (!state.playlistUrl.trim()) {
      setState(prev => ({ 
        ...prev, 
        error: language === 'zh' ? '请输入Spotify播放列表URL' : 'Please enter Spotify playlist URL' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: SpotifyExportRequest = {
        playlist: state.playlistUrl.trim(),
      };
      
      const task = await backendConnector.exportSpotifyTask(request);
      
      setState(prev => ({
        ...prev,
        exportTask: task,
        isLoading: false,
        success: language === 'zh' ? '导出任务已开始' : 'Export task started',
      }));
      
      // 开始轮询任务状态
      if (task.data.task_id) {
        pollTaskStatus(task.data.task_id, 'export');
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }));
    }
  }, [state.playlistUrl, language, backendConnector, pollTaskStatus]);

  // 处理音乐整理
  const handleMusicOrganize = useCallback(async () => {
    if (!state.selectedExportFile) {
      setState(prev => ({ 
        ...prev, 
        error: language === 'zh' ? '请选择导出文件' : 'Please select export file' 
      }));
      return;
    }

    if (state.musicRoots.length === 0) {
      setState(prev => ({ 
        ...prev, 
        error: language === 'zh' ? '请设置音乐根目录' : 'Please set music root directories' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: MusicOrganizeRequest = {
        export_path: state.selectedExportFile,
        music_roots: state.musicRoots,
        aggressive: state.organizeOptions.aggressive,
        auto_convert_ncm: state.organizeOptions.autoConvertNcm,
        force_mp3: state.organizeOptions.forceMp3,
      };
      
      const task = await backendConnector.organizeMusicTask(request);
      
      setState(prev => ({
        ...prev,
        organizeTask: task,
        isLoading: false,
        success: language === 'zh' ? '整理任务已开始' : 'Organize task started',
      }));
      
      // 开始轮询任务状态
      if (task.data.task_id) {
        pollTaskStatus(task.data.task_id, 'organize');
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Organize failed',
      }));
    }
  }, [state.selectedExportFile, state.musicRoots, state.organizeOptions, language, backendConnector, pollTaskStatus]);

  // 初始化 - 延迟执行以避免阻塞界面
  useEffect(() => {
    // 延迟执行后端检查，避免阻塞界面渲染
    const initTimeout = setTimeout(() => {
      checkBackendHealth();
      loadDefaultMusicRoots();
      loadMediaFiles();
    }, 1000);

    return () => clearTimeout(initTimeout);
  }, [checkBackendHealth, loadDefaultMusicRoots, loadMediaFiles]);

  // 清除消息
  useEffect(() => {
    if (state.error || state.success) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null, success: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, state.success]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 渲染状态指示器
  const renderStatusIndicator = (status: boolean | null, label: string) => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        status === true ? 'bg-white/80' :
        status === false ? 'bg-white/40' : 'bg-white/60 animate-pulse'
      }`} />
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );

  // 渲染任务日志
  const renderTaskLogs = (logs: string[]) => (
    <div className="mt-4 p-3 rounded-lg max-h-40 overflow-y-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(192, 197, 206, 0.1)'
      }}
    >
      <div className="text-xs font-mono space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="text-white/60">
            {log}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* 状态消息 */}
      <AnimatePresence>
        {(state.error || state.success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg ${
              state.error 
                ? 'text-white/90'
                : 'text-white/90'
            }`}
            style={{
              background: state.error 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(192, 197, 206, 0.1)',
              border: state.error 
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid rgba(192, 197, 206, 0.3)'
            }}
          >
            {state.error || state.success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 后端状态面板 */}
      <div 
        className="mb-6 p-4 rounded-xl"
        style={{
          background: 'rgba(192, 197, 206, 0.05)',
          border: '1px solid rgba(192, 197, 206, 0.15)'
        }}
      >
        <h3 className="text-white/90 text-lg mb-4 font-mono">{t.backendStatus}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStatusIndicator(state.backendHealth?.webService, 'Web Service')}
          {renderStatusIndicator(state.backendHealth?.termusicGateway, 'Termusic Gateway')}
          {renderStatusIndicator(state.backendHealth?.audioGateway, 'Audio Gateway')}
        </div>
        
        {state.environmentCheck && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(192, 197, 206, 0.15)' }}>
            <div className="text-xs text-white/60 mb-2">{language === 'zh' ? '环境依赖' : 'Dependencies'}:</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(state.environmentCheck).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-white/80' : 'bg-white/40'}`} />
                  <span className="text-xs text-white/70">{key}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 标签页导航 */}
      <div className="flex space-x-1 mb-6">
        {(['export', 'organize', 'player'] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setState(prev => ({ ...prev, currentTab: tab }))}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              state.currentTab === tab
                ? 'text-white/90'
                : 'text-white/60 hover:text-white/80'
            }`}
            style={{
              background: state.currentTab === tab 
                ? 'rgba(192, 197, 206, 0.15)' 
                : 'transparent',
              border: state.currentTab === tab 
                ? '1px solid rgba(192, 197, 206, 0.25)' 
                : '1px solid transparent'
            }}
          >
            {tab === 'export' ? (language === 'zh' ? 'SPOTIFY 导出' : 'SPOTIFY EXPORT') : 
             tab === 'organize' ? (language === 'zh' ? '音乐库整理' : 'LIBRARY ORGANIZER') : 
             (language === 'zh' ? '音频播放器' : 'AUDIO PLAYER')}
          </motion.button>
        ))}
      </div>

      {/* 标签页内容 */}
      <AnimatePresence mode="wait">
        {state.currentTab === 'export' && (
          <motion.div
            key="export"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ExportSectionLayout
              A={
                /* A. Spotify播放列表URL输入 */
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(192, 197, 206, 0.05)',
                    border: '1px solid rgba(192, 197, 206, 0.15)'
                  }}
                >
                  <h4 className="text-white/90 text-lg mb-4 font-mono">{t.spotifyExport}</h4>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      {language === 'zh' ? 'Spotify播放列表URL' : 'Spotify Playlist URL'}
                    </label>
                    <input
                      type="text"
                      value={state.playlistUrl}
                      onChange={(e) => setState(prev => ({ ...prev, playlistUrl: e.target.value }))}
                      placeholder="https://open.spotify.com/playlist/..."
                      className="w-full p-3 rounded-lg text-white placeholder-white/40 focus:outline-none"
                      style={{
                        background: 'rgba(192, 197, 206, 0.1)',
                        border: '1px solid rgba(192, 197, 206, 0.2)',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(192, 197, 206, 0.4)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(192, 197, 206, 0.2)';
                      }}
                    />
                  </div>
                </div>
              }
              D={
                /* D. 操作按钮区域 */
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(192, 197, 206, 0.05)',
                    border: '1px solid rgba(192, 197, 206, 0.15)'
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSpotifyExport}
                    disabled={state.isLoading}
                    className="w-full py-4 rounded-lg text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono text-base font-medium"
                    style={{
                      background: 'rgba(192, 197, 206, 0.2)',
                      border: '1px solid rgba(192, 197, 206, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      if (!state.isLoading) {
                        e.currentTarget.style.background = 'rgba(192, 197, 206, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(192, 197, 206, 0.2)';
                    }}
                  >
                    {state.isLoading ? (language === 'zh' ? '导出中...' : 'Exporting...') : t.startExport}
                  </motion.button>
                </div>
              }
              E={
                /* E. 任务状态显示 */
                state.exportStatus && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(192, 197, 206, 0.05)',
                      border: '1px solid rgba(192, 197, 206, 0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-sm">{language === 'zh' ? '导出状态' : 'Export Status'}</span>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: state.exportStatus.task_status === 'completed' 
                            ? 'rgba(192, 197, 206, 0.2)' 
                            : state.exportStatus.task_status === 'failed' 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : 'rgba(192, 197, 206, 0.15)',
                          color: state.exportStatus.task_status === 'completed' 
                            ? 'rgba(192, 197, 206, 1)' 
                            : state.exportStatus.task_status === 'failed' 
                            ? 'rgba(239, 68, 68, 0.9)' 
                            : 'rgba(192, 197, 206, 0.8)'
                        }}
                      >
                        {state.exportStatus.task_status}
                      </span>
                    </div>
                  </div>
                )
              }
              G={
                /* G. 任务日志（可滚动区域） */
                state.exportStatus && state.exportStatus.logs.length > 0 && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(192, 197, 206, 0.05)',
                      border: '1px solid rgba(192, 197, 206, 0.15)'
                    }}
                  >
                    <h5 className="text-white/80 text-sm mb-3">{language === 'zh' ? '任务日志' : 'Task Logs'}</h5>
                    {renderTaskLogs(state.exportStatus.logs)}
                  </div>
                )
              }
            />
          </motion.div>
        )}

        {state.currentTab === 'organize' && (
          <motion.div
            key="organize"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div 
              className="p-6 rounded-xl"
              style={{
                background: 'rgba(192, 197, 206, 0.05)',
                border: '1px solid rgba(192, 197, 206, 0.15)'
              }}
            >
              <h4 className="text-white/90 text-lg mb-4 font-mono">{t.libraryOrganizer}</h4>
              
              <div className="space-y-4">
                {/* 导出文件选择 */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    {language === 'zh' ? '选择导出文件' : 'Select Export File'}
                  </label>
                  <input
                    type="text"
                    value={state.selectedExportFile}
                    onChange={(e) => setState(prev => ({ ...prev, selectedExportFile: e.target.value }))}
                    placeholder="/path/to/export.json"
                    className="w-full p-3 rounded-lg text-white placeholder-white/40 focus:outline-none"
                    style={{
                      background: 'rgba(192, 197, 206, 0.1)',
                      border: '1px solid rgba(192, 197, 206, 0.2)'
                    }}
                  />
                </div>
                
                {/* 音乐根目录 */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    {language === 'zh' ? '音乐根目录' : 'Music Root Directories'}
                  </label>
                  <div className="space-y-2">
                    {state.musicRoots.map((root, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={root}
                          onChange={(e) => {
                            const newRoots = [...state.musicRoots];
                            newRoots[index] = e.target.value;
                            setState(prev => ({ ...prev, musicRoots: newRoots }));
                          }}
                          className="flex-1 p-2 rounded text-white text-sm"
                          style={{
                            background: 'rgba(192, 197, 206, 0.1)',
                            border: '1px solid rgba(192, 197, 206, 0.2)'
                          }}
                        />
                        <button
                          onClick={() => {
                            const newRoots = state.musicRoots.filter((_, i) => i !== index);
                            setState(prev => ({ ...prev, musicRoots: newRoots }));
                          }}
                          className="text-white/60 hover:text-white/80"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setState(prev => ({ ...prev, musicRoots: [...prev.musicRoots, ''] }))}
                      className="text-white/60 hover:text-white/80 text-sm"
                    >
                      + {language === 'zh' ? '添加目录' : 'Add Directory'}
                    </button>
                  </div>
                </div>
                
                {/* 整理选项 */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    {language === 'zh' ? '整理选项' : 'Organize Options'}
                  </label>
                  <div className="space-y-2">
                    {Object.entries(state.organizeOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            organizeOptions: {
                              ...prev.organizeOptions,
                              [key]: e.target.checked,
                            }
                          }))}
                          className="rounded"
                          style={{
                            accentColor: 'rgba(192, 197, 206, 0.8)'
                          }}
                        />
                        <span className="text-white/70 text-sm">
                          {key === 'aggressive' ? (language === 'zh' ? '激进模式' : 'Aggressive Mode') :
                           key === 'autoConvertNcm' ? (language === 'zh' ? '自动转换NCM' : 'Auto Convert NCM') :
                           (language === 'zh' ? '强制MP3' : 'Force MP3')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMusicOrganize}
                  disabled={state.isLoading}
                  className="w-full py-4 rounded-lg text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono text-base font-medium"
                  style={{
                    background: 'rgba(192, 197, 206, 0.2)',
                    border: '1px solid rgba(192, 197, 206, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (!state.isLoading) {
                      e.currentTarget.style.background = 'rgba(192, 197, 206, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(192, 197, 206, 0.2)';
                  }}
                >
                  {state.isLoading ? (language === 'zh' ? '整理中...' : 'Organizing...') : t.startOrganize || 'Start Organize'}
                </motion.button>
              </div>
              
              {/* 整理任务状态 */}
              {state.organizeStatus && (
                <div 
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(192, 197, 206, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">{language === 'zh' ? '整理状态' : 'Organize Status'}</span>
                    <span 
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: state.organizeStatus.task_status === 'completed' 
                          ? 'rgba(192, 197, 206, 0.2)' 
                          : state.organizeStatus.task_status === 'failed' 
                          ? 'rgba(239, 68, 68, 0.2)' 
                          : 'rgba(192, 197, 206, 0.15)',
                        color: state.organizeStatus.task_status === 'completed' 
                          ? 'rgba(192, 197, 206, 1)' 
                          : state.organizeStatus.task_status === 'failed' 
                          ? 'rgba(239, 68, 68, 0.9)' 
                          : 'rgba(192, 197, 206, 0.8)'
                      }}
                    >
                      {state.organizeStatus.task_status}
                    </span>
                  </div>
                  
                  {state.organizeStatus.logs.length > 0 && renderTaskLogs(state.organizeStatus.logs)}
                </div>
              )}
              
              {/* 整理结果 */}
              {state.organizeResult && (
                <div 
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(192, 197, 206, 0.1)'
                  }}
                >
                  <h5 className="text-white/80 text-sm mb-3">{language === 'zh' ? '整理结果' : 'Organize Result'}</h5>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl text-white/90">{state.organizeResult.matched.length}</div>
                      <div className="text-xs text-white/60">{language === 'zh' ? '匹配' : 'Matched'}</div>
                    </div>
                    <div>
                      <div className="text-2xl text-white/70">{state.organizeResult.missing.length}</div>
                      <div className="text-xs text-white/60">{language === 'zh' ? '缺失' : 'Missing'}</div>
                    </div>
                    <div>
                      <div className="text-2xl text-white/80">{state.organizeResult.multi_candidates.length}</div>
                      <div className="text-xs text-white/60">{language === 'zh' ? '多候选' : 'Multi-candidates'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {state.currentTab === 'player' && (
          <motion.div
            key="player"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* 媒体文件列表 */}
            <div 
              className="p-6 rounded-xl"
              style={{
                background: 'rgba(192, 197, 206, 0.05)',
                border: '1px solid rgba(192, 197, 206, 0.15)'
              }}
            >
              <h4 className="text-white/90 text-lg mb-4 font-mono">{language === 'zh' ? '媒体文件' : 'Media Files'}</h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {state.mediaFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ backgroundColor: 'rgba(192, 197, 206, 0.08)' }}
                    onClick={() => setState(prev => ({ ...prev, selectedMediaFile: file }))}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      state.selectedMediaFile?.name === file.name
                        ? ''
                        : ''
                    }`}
                    style={{
                      background: state.selectedMediaFile?.name === file.name 
                        ? 'rgba(192, 197, 206, 0.15)'
                        : 'rgba(192, 197, 206, 0.05)',
                      border: state.selectedMediaFile?.name === file.name 
                        ? '1px solid rgba(192, 197, 206, 0.25)'
                        : '1px solid rgba(192, 197, 206, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white/90 text-sm">{file.name}</div>
                        <div className="text-white/50 text-xs">
                          {formatFileSize(file.size)} • {file.suffix.toUpperCase()}
                        </div>
                      </div>
                      {state.selectedMediaFile?.name === file.name && (
                        <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* 音频播放器 */}
            {state.selectedMediaFile && (
              <WavesurferPlayer
                audioSrc={state.selectedMediaFile.url}
                language={language}
                config={{
                  windowDuration: 10,
                  peaksPerSecond: 50,
                  height: 100,
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedMusicOrganizer;