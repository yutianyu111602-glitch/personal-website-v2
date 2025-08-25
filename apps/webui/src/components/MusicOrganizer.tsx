import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

interface TaskStatus {
  id: string;
  type: 'spotify_export' | 'netease_organize';
  status: 'queue' | 'running' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

interface OrganizeConfig {
  rootPath: string;
  scanOnly: boolean;
  conflictStrategy: 'skip' | 'overwrite' | 'backup';
  namingStrategy: 'artist_title' | 'title_artist' | 'original';
}

interface ExportConfig {
  playlistUrl: string;
  format: 'json' | 'xlsx' | 'txt';
}

export function MusicOrganizer() {
  const [activeTab, setActiveTab] = useState('export');
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    playlistUrl: '',
    format: 'json'
  });
  const [organizeConfig, setOrganizeConfig] = useState<OrganizeConfig>({
    rootPath: '',
    scanOnly: true,
    conflictStrategy: 'skip',
    namingStrategy: 'artist_title'
  });
  const [envStatus, setEnvStatus] = useState<'checking' | 'ready' | 'warning' | 'error'>('checking');
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // 模拟环境检查
  useEffect(() => {
    const checkEnvironment = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEnvStatus('ready');
      setSystemInfo({
        spotifyApi: true,
        neteaseApi: true,
        diskSpace: '2.1TB',
        permissions: true
      });
    };
    checkEnvironment();
  }, []);

  // 模拟任务执行
  const startExportTask = async () => {
    const taskId = `export_${Date.now()}`;
    const newTask: TaskStatus = {
      id: taskId,
      type: 'spotify_export',
      status: 'running',
      progress: 0,
      stage: '连接API',
      startTime: new Date()
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟进度更新
    const stages = ['连接API', '解析歌单', '提取元数据', '格式转换', '生成文件'];
    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, progress: ((i + 1) / stages.length) * 100, stage: stages[i] }
          : task
      ));
    }

    // 完成任务
    await new Promise(resolve => setTimeout(resolve, 500));
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'completed', 
            progress: 100, 
            endTime: new Date(),
            result: { files: ['playlist_export.json', 'playlist_export.xlsx'], tracks: 247 }
          }
        : task
    ));
  };

  const startOrganizeTask = async () => {
    const taskId = `organize_${Date.now()}`;
    const newTask: TaskStatus = {
      id: taskId,
      type: 'netease_organize',
      status: 'running',
      progress: 0,
      stage: '索引',
      startTime: new Date()
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟整理进度
    const stages = ['索引', '分析', '整理', '验证', '报告'];
    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, progress: ((i + 1) / stages.length) * 100, stage: stages[i] }
          : task
      ));
    }

    // 完成任务
    await new Promise(resolve => setTimeout(resolve, 500));
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'completed', 
            progress: 100, 
            endTime: new Date(),
            result: { 
              organized: 1247, 
              conflicts: 12, 
              skipped: 5, 
              duration: '4m 32s',
              report: 'organize_report_20250119.json'
            }
          }
        : task
    ));
  };

  const getStatusColor = (status: TaskStatus['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* 环境状态 - 修复背景变暗问题：移除黑色背景，使用银色主题 */}
      <Card 
        className="minimal-glass border-white/10"
        style={{
          backdropFilter: 'none', // 强制禁用backdrop-filter
          WebkitBackdropFilter: 'none', // 强制禁用webkit版本
          background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                envStatus === 'ready' ? 'bg-green-400 animate-subtle-pulse' :
                envStatus === 'warning' ? 'bg-yellow-400' :
                envStatus === 'error' ? 'bg-red-400' : 'bg-gray-400 animate-pulse'
              }`} />
              <span className="text-white/90 font-medium">
                系统状态: {envStatus === 'ready' ? '就绪' : envStatus === 'checking' ? '检查中' : '异常'}
              </span>
            </div>
            {systemInfo && (
              <div className="flex space-x-4 text-sm text-white/60">
                <span>可用空间: {systemInfo.diskSpace}</span>
                <span>API连接: {systemInfo.spotifyApi && systemInfo.neteaseApi ? '正常' : '异常'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 主功能面板 - 修复背景变暗问题 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="grid w-full grid-cols-3 minimal-glass border-white/10"
          style={{
            backdropFilter: 'none', // 强制禁用backdrop-filter
            WebkitBackdropFilter: 'none', // 强制禁用webkit版本
            background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
          }}
        >
          <TabsTrigger value="export" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
            Spotify导出
          </TabsTrigger>
          <TabsTrigger value="organize" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
            音乐整理
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
            任务监控
          </TabsTrigger>
        </TabsList>

        {/* Spotify导出 - 移除黑色背景 */}
        <TabsContent value="export" className="space-y-4">
          <Card 
            className="minimal-glass border-white/10"
            style={{
              backdropFilter: 'none', // 强制禁用backdrop-filter
              WebkitBackdropFilter: 'none', // 强制禁用webkit版本
              background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
            }}
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium">歌单链接</label>
                <Input
                  placeholder="https://open.spotify.com/playlist/..."
                  value={exportConfig.playlistUrl}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, playlistUrl: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium">导出格式</label>
                <Select value={exportConfig.format} onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="minimal-glass border-white/20">
                    <SelectItem value="json">JSON格式</SelectItem>
                    <SelectItem value="xlsx">Excel表格</SelectItem>
                    <SelectItem value="txt">纯文本</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={startExportTask}
                disabled={!exportConfig.playlistUrl || envStatus !== 'ready'}
                className="w-full bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/30"
              >
                开始导出
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 音乐整理 - 移除黑色背景 */}
        <TabsContent value="organize" className="space-y-4">
          <Card 
            className="minimal-glass border-white/10"
            style={{
              backdropFilter: 'none', // 强制禁用backdrop-filter
              WebkitBackdropFilter: 'none', // 强制禁用webkit版本
              background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
            }}
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium">音乐根目录</label>
                <Input
                  placeholder="/Users/username/Music/网易云音乐"
                  value={organizeConfig.rootPath}
                  onChange={(e) => setOrganizeConfig(prev => ({ ...prev, rootPath: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">冲突策略</label>
                  <Select value={organizeConfig.conflictStrategy} onValueChange={(value: any) => setOrganizeConfig(prev => ({ ...prev, conflictStrategy: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="minimal-glass border-white/20">
                      <SelectItem value="skip">跳过</SelectItem>
                      <SelectItem value="overwrite">覆盖</SelectItem>
                      <SelectItem value="backup">备份</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">命名规范</label>
                  <Select value={organizeConfig.namingStrategy} onValueChange={(value: any) => setOrganizeConfig(prev => ({ ...prev, namingStrategy: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="minimal-glass border-white/20">
                      <SelectItem value="artist_title">艺术家 - 标题</SelectItem>
                      <SelectItem value="title_artist">标题 - 艺术家</SelectItem>
                      <SelectItem value="original">保持原有</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch 
                  checked={organizeConfig.scanOnly}
                  onCheckedChange={(checked) => setOrganizeConfig(prev => ({ ...prev, scanOnly: checked }))}
                />
                <label className="text-white/90 text-sm">仅扫描预览（不执行实际操作）</label>
              </div>

              <Button 
                onClick={startOrganizeTask}
                disabled={!organizeConfig.rootPath || envStatus !== 'ready'}
                className="w-full bg-purple-600/80 hover:bg-purple-600 text-white border-purple-500/30"
              >
                {organizeConfig.scanOnly ? '开始扫描' : '开始整理'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 任务监控 - 移除黑色背景 */}
        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card 
              className="minimal-glass border-white/10"
              style={{
                backdropFilter: 'none', // 强制禁用backdrop-filter
                WebkitBackdropFilter: 'none', // 强制禁用webkit版本
                background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
              }}
            >
              <div className="p-8 text-center text-white/60">
                暂无任务记录
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="minimal-glass border-white/10"
                      style={{
                        backdropFilter: 'none', // 强制禁用backdrop-filter
                        WebkitBackdropFilter: 'none', // 强制禁用webkit版本
                        background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
                      }}
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(task.status)}>
                              {task.type === 'spotify_export' ? 'Spotify导出' : '音乐整理'}
                            </Badge>
                            <span className="text-white/70 text-sm font-mono">
                              {task.id}
                            </span>
                          </div>
                          <span className="text-white/60 text-sm">
                            {formatDuration(task.startTime, task.endTime)}
                          </span>
                        </div>

                        {task.status === 'running' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/80">{task.stage}</span>
                              <span className="text-white/60">{Math.round(task.progress)}%</span>
                            </div>
                            <Progress 
                              value={task.progress} 
                              variant={task.type === 'spotify_export' ? 'tech' : 'data'}
                              className="h-2" 
                            />
                          </div>
                        )}

                        {task.status === 'completed' && task.result && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {task.type === 'spotify_export' ? (
                              <>
                                <div className="text-white/70">
                                  导出文件: <span className="text-white/90">{task.result.files?.length || 0}</span>
                                </div>
                                <div className="text-white/70">
                                  音轨数量: <span className="text-white/90">{task.result.tracks}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-white/70">
                                  已整理: <span className="text-white/90">{task.result.organized}</span>
                                </div>
                                <div className="text-white/70">
                                  冲突: <span className="text-yellow-400">{task.result.conflicts}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {task.error && (
                          <div className="text-red-400 text-sm bg-red-500/10 rounded p-2">
                            {task.error}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}