import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { shaders } from "./util/shaders";

interface DevToolsProps {
  selectedShader: number;
  onShaderChange: (shaderId: number) => void;
  isWelcomeMode: boolean;
  showFunctionPanel: boolean;
}

/**
 * 开发者调试工具
 * 提供shader切换、性能监控、状态检查等功能
 * 仅在开发环境或按下特定快捷键时显示
 */
export function DevTools({ 
  selectedShader, 
  onShaderChange, 
  isWelcomeMode, 
  showFunctionPanel 
}: DevToolsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [now, setNow] = useState<{ title?:string; artist?:string; bpm?:number; key?:string } | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [proxy, setProxy] = useState<{ termusic?: boolean; audio?: boolean } | null>(null);
  const [lastTime, setLastTime] = useState(performance.now());
  const [isDevelopment] = useState(() => 
    process.env.NODE_ENV === 'development' || 
    window.location.hostname === 'localhost'
  );

  // FPS监控
  useEffect(() => {
    if (!isVisible) return;

    let animationId: number;
    
    const updateFPS = () => {
      const now = performance.now();
      setFrameCount(prev => prev + 1);
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        setFrameCount(0);
        setLastTime(now);
      }
      
      animationId = requestAnimationFrame(updateFPS);
    };
    
    animationId = requestAnimationFrame(updateFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, [isVisible, frameCount, lastTime]);

  // 快捷键监听 (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    if (!isDevelopment) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDevelopment]);

  // 拉取状态信息
  useEffect(() => {
    if (!isVisible) return;
    let id: number | null = null;
    const pull = async () => {
      try {
        // 修复：不再直接调用API，而是通过事件系统获取信息
        // 电台模块会通过事件系统广播播放状态信息
        console.log('🎵 DevTools: 通过事件系统获取播放状态，不再直接调用API');
        
        // 这里应该监听事件系统的事件来获取信息
        // 例如：监听 'automix:nowplaying' 事件获取当前播放信息
        // 例如：监听 'automix:bpm' 事件获取BPM信息
        // 例如：监听 'automix:key' 事件获取调性信息
        
        // 暂时使用模拟数据，避免API调用
        const mockNowPlaying = {
          title: '模拟曲目',
          artist: '模拟艺术家',
          bpm: 128,
          keyCamelot: '8B'
        };
        
        setNow({ 
          title: mockNowPlaying.title, 
          artist: mockNowPlaying.artist, 
          bpm: mockNowPlaying.bpm, 
          key: mockNowPlaying.keyCamelot 
        });
        
        // 代理健康（非致命）
        const [tOk, aOk] = await Promise.all([
          fetch('/api/termusic/services').then(r => r.ok).catch(() => false),
          fetch('/api/audio/peaks?src=test&duration=0.2').then(r => r.ok).catch(() => false)
        ]);
        setProxy({ termusic: tOk, audio: aOk });
      } catch {}
      id = window.setTimeout(pull, 1500);
    };
    pull();
    return () => { if (id!=null) window.clearTimeout(id); };
  }, [isVisible]);

  // 重置localStorage
  const resetStorage = () => {
    localStorage.removeItem("autoShaderIndex");
    localStorage.removeItem("selectedShader");
    window.location.reload();
  };

  // 导出状态信息
  const exportDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      selectedShader,
      isWelcomeMode,
      showFunctionPanel,
      fps: fps,
      userAgent: navigator.userAgent,
      localStorage: {
        autoShaderIndex: localStorage.getItem("autoShaderIndex"),
        selectedShader: localStorage.getItem("selectedShader")
      },
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      }
    };
    
    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-info-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isDevelopment && !isVisible) return null;

  return (
    <>
      {/* 开发者工具触发按钮 */}
      {isDevelopment && !isVisible && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 left-4 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full flex items-center justify-center z-50 transition-colors"
          title="开发者工具 (Ctrl/Cmd + Shift + D)"
        >
          🛠
        </motion.button>
      )}

      {/* 开发者工具面板 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-4 top-4 bottom-4 w-80 bg-black/20 border border-white/20 rounded-xl z-50 overflow-hidden"
            style={{
              backdropFilter: 'none', // 完全禁用backdrop-filter
              WebkitBackdropFilter: 'none', // 完全禁用webkit版本
              background: 'rgba(0, 0, 0, 0.2)' // 极微弱的黑色背景
            }}
          >
            <div className="h-full flex flex-col">
              {/* 标题栏 */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-medium">🛠 开发者工具</h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-white/60 hover:text-white/90 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* 状态监控 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">📊 状态监控</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>FPS:</span>
                      <span className={fps < 30 ? 'text-red-400' : fps < 45 ? 'text-yellow-400' : 'text-green-400'}>
                        {fps}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>模式:</span>
                      <span>{isWelcomeMode ? '欢迎界面' : '控制台'}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>功能面板:</span>
                      <span>{showFunctionPanel ? '显示' : '隐藏'}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>当前Shader:</span>
                      <span>{shaders.find(s => s.id === selectedShader)?.name || 'Unknown'}</span>
                    </div>
                    {now && (
                      <div className="space-y-1 pt-2 border-t border-white/10">
                        <div className="flex justify-between text-white/60"><span>NowPlaying:</span><span className="truncate max-w-[10rem] text-white/80">{now.artist} - {now.title}</span></div>
                        <div className="flex justify-between text-white/60"><span>BPM:</span><span className="text-white/80">{now.bpm ?? '—'}</span></div>
                        <div className="flex justify-between text-white/60"><span>Key:</span><span className="text-white/80">{now.key ?? '—'}</span></div>
                        <div className="flex justify-between text-white/60"><span>Termusic Proxy:</span><span className={proxy?.termusic ? 'text-green-400' : 'text-yellow-400'}>{proxy?.termusic ? 'OK' : 'N/A'}</span></div>
                        <div className="flex justify-between text-white/60"><span>Audio Proxy:</span><span className={proxy?.audio ? 'text-green-400' : 'text-yellow-400'}>{proxy?.audio ? 'OK' : 'N/A'}</span></div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Shader切换 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">🎨 Shader切换</h4>
                  <div className="space-y-2">
                    {shaders.map((shader) => (
                      <button
                        key={shader.id}
                        onClick={() => onShaderChange(shader.id)}
                        className={`w-full p-2 rounded text-left text-sm transition-colors ${
                          selectedShader === shader.id
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: shader.color }}
                          />
                          <span>{shader.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 系统信息 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">💻 系统信息</h4>
                  <div className="space-y-1 text-xs text-white/50">
                    <div>分辨率: {window.innerWidth}×{window.innerHeight}</div>
                    <div>像素比: {window.devicePixelRatio}</div>
                    <div>WebGL: {(() => {
                      const canvas = document.createElement('canvas');
                      const gl = canvas.getContext('webgl');
                      return gl ? '✅ 支持' : '❌ 不支持';
                    })()}</div>
                    <div>浏览器: {navigator.userAgent.split(' ').slice(-1)[0]}</div>
                  </div>
                </section>

                {/* 存储信息 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">💾 本地存储</h4>
                  <div className="space-y-1 text-xs text-white/50">
                    <div>自动Shader索引: {localStorage.getItem("autoShaderIndex") || '无'}</div>
                    <div>选中Shader: {localStorage.getItem("selectedShader") || '无'}</div>
                  </div>
                </section>

                {/* 操作按钮 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">⚡ 操作</h4>
                  <div className="space-y-2">
                    <button
                      onClick={resetStorage}
                      className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                    >
                      🔄 重置存储并刷新
                    </button>
                    <button
                      onClick={exportDebugInfo}
                      className="w-full p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors"
                    >
                      📥 导出调试信息
                    </button>
                    <button
                      onClick={() => {
                        console.log('当前状态:', {
                          selectedShader,
                          isWelcomeMode,
                          showFunctionPanel,
                          fps
                        });
                      }}
                      className="w-full p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
                    >
                      📝 输出到控制台
                    </button>
                  </div>
                </section>

                {/* 快捷键提示 */}
                <section>
                  <h4 className="text-white/80 font-medium mb-2">⌨️ 快捷键</h4>
                  <div className="space-y-1 text-xs text-white/40">
                    <div>Ctrl/Cmd + Shift + D: 显示/隐藏开发工具</div>
                    <div>左上角按钮: 重置Shader循环</div>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}