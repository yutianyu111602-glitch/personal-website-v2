// 国际化工具 - 天宫科技全屏视觉体验应用
export interface Translations {
  // 欢迎页面
  welcome: string;
  clickToContinue: string;
  currentTime: string;
  tiangongTech: string;
  fullScreenApp: string;
  clickAnywhereToEnter: string;
  
  // 天宫卫星系统
  spaceStationStatus: string;
  tiangongStation: string;
  coreModule: string;
  labModule: string;
  powerSystem: string;
  communicationSystem: string;
  lifeSupportSystem: string;
  operational: string;
  standby: string;
  maintenance: string;
  
  // 地理位置和轨道信息
  locationInfo: string;
  coordinates: string;
  latitude: string;
  longitude: string;
  altitude: string;
  groundAltitude: string;
  orbitalAltitude: string;
  orbitalVelocity: string;
  orbitalPeriod: string;
  groundTrack: string;
  nextPassTime: string;
  visibility: string;
  locating: string;
  locationError: string;
  
  // 音乐系统
  musicSystem: string;
  spotifyExport: string;
  libraryOrganizer: string;
  taskMonitor: string;
  backendStatus: string;
  termusicBackend: string;
  wavesurferEngine: string;
  audioSystem: string;
  quickActions: string;
  connectBackend: string;
  loadPlaylists: string;
  audioSettings: string;
  connecting: string;
  ready: string;
  startExport: string;
  startOrganize: string;
  
  // 播放器
  tiangongRadio: string;
  deepSpaceChannel: string;
  radioPlayer: string;
  closeRadio: string;
  dragToMove: string;
  
  // 电台播放器新增翻译
  radio: {
    stationName: string;
    frequency: string;
    playButton: string;
    pauseButton: string;
    volumeControl: string;
    syncButton: string;
    syncActive: string;
    syncInactive: string;
    liveStatus: string;
    offStatus: string;
    hoverHint: string;
    dragHint: string;
    snapToEdge: string;
    expandOnHover: string;
    closePlayer: string;
    waveformReady: string;
    waveformError: string;
    startPlaying: string;
    stopPlaying: string;
    mouseEnterLog: string;
    mouseLeaveLog: string;
    stickyDelayStart: string;
    stickyDelayEnd: string;
    dragStart: string;
    dragEnd: string;
    snapToLeft: string;
    snapToRight: string;
    snapToTop: string;
    snapToBottom: string;
  };
  
  // 任务日志翻译
  taskLogger: {
    title: string;
    systemLog: string;
    clearLog: string;
    exportLog: string;
    minimizeLog: string;
    maximizeLog: string;
    noTasks: string;
    taskCompleted: string;
    taskError: string;
    taskInProgress: string;
    backgroundInit: string;
    backgroundSwitch: string;
    languageSwitch: string;
    modeSwitch: string;
    memoryUsage: string;
    performanceMetrics: string;
  };
  
  // 空间站状态翻译
  spaceStation: {
    title: string;
    status: string;
    location: string;
    systems: string;
    telemetry: string;
    lastUpdate: string;
    nextContact: string;
    signalStrength: string;
    dataRate: string;
    temperature: string;
    pressure: string;
    humidity: string;
    oxygenLevel: string;
    co2Level: string;
    solarPanels: string;
    batteries: string;
    thrusters: string;
    attitude: string;
    gpsLock: string;
    networkStatus: string;
  };
  
  // 控制界面
  deepSpaceVisualPlatform: string;
  integratedMusicManagement: string;
  currentTheme: string;
  nextSwitch: string;
  
  // 着色器名称
  shaderNames: {
    pureSilver: string;
    liquidChrome: string;
    silverMist: string;
    metallicFlow: string;
    cosmicSilver: string;
  };
  
  // 功能描述
  exportPlaylistsDesc: string;
  intelligentMusicDesc: string;
  realtimeMonitoringDesc: string;
  
  // 系统状态
  connectingToBackend: string;
  waveformEngineReady: string;
  
  // 版权信息
  copyright: string;
  madeBy: string;
  
  // 按钮文本
  language: string;
  switchBackground: string;
  resetCycle: string;
  
  // 通用状态和操作
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    close: string;
    open: string;
    minimize: string;
    maximize: string;
    save: string;
    cancel: string;
    confirm: string;
    reset: string;
    refresh: string;
    settings: string;
    help: string;
    about: string;
    volume: string;
    play: string;
    pause: string;
    stop: string;
    next: string;
    previous: string;
    shuffle: string;
    repeat: string;
    mute: string;
    unmute: string;
  };
}

const translations: Record<string, Translations> = {
  'zh': {
    // 欢迎页面
    welcome: '欢迎',
    clickToContinue: '点击任意处继续',
    currentTime: '当前时间',
    tiangongTech: '天宫科技',
    fullScreenApp: '全屏体验应用',
    clickAnywhereToEnter: '点击任意位置进入控制台',
    
    // 天宫卫星系统
    spaceStationStatus: '天宫空间站状态',
    tiangongStation: '天宫空间站',
    coreModule: '核心舱',
    labModule: '实验舱',
    powerSystem: '电力系统',
    communicationSystem: '通信系统',
    lifeSupportSystem: '生命保障系统',
    operational: '运行正常',
    standby: '待机状态',
    maintenance: '维护中',
    
    // 地理位置和轨道信息
    locationInfo: '位置信息',
    coordinates: '坐标',
    latitude: '纬度',
    longitude: '经度',
    altitude: '高度',
    groundAltitude: '地面高度',
    orbitalAltitude: '轨道高度',
    orbitalVelocity: '轨道速度',
    orbitalPeriod: '轨道周期',
    groundTrack: '地面轨迹',
    nextPassTime: '下次过境',
    visibility: '可见性',
    locating: '定位中...',
    locationError: '定位失败',
    
    // 音乐系统
    musicSystem: '音乐系统',
    spotifyExport: 'Spotify 导出',
    libraryOrganizer: '音乐库整理',
    taskMonitor: '任务监控',
    backendStatus: '后端状态',
    termusicBackend: 'Termusic 后端',
    wavesurferEngine: 'Wavesurfer 引擎',
    audioSystem: '音频系统',
    quickActions: '快速操作',
    connectBackend: '连接后端',
    loadPlaylists: '加载播放列表',
    audioSettings: '音频设置',
    connecting: '连接中...',
    ready: '就绪',
    startExport: '开始导出',
    startOrganize: '开始整理',
    
    // 播放器
    tiangongRadio: '天宫电台',
    deepSpaceChannel: '深空频道',
    radioPlayer: '电台播放器',
    closeRadio: '关闭电台',
    dragToMove: '拖动移动',
    
    // 电台播放器新增翻译
    radio: {
      stationName: '电台名称',
      frequency: '频率',
      playButton: '播放',
      pauseButton: '暂停',
      volumeControl: '音量控制',
      syncButton: '同步',
      syncActive: '同步中',
      syncInactive: '未同步',
      liveStatus: '直播',
      offStatus: '关闭',
      hoverHint: '鼠标悬停提示',
      dragHint: '拖动提示',
      snapToEdge: '边缘吸附',
      expandOnHover: '悬停展开',
      closePlayer: '关闭播放器',
      waveformReady: '波形已就绪',
      waveformError: '波形错误',
      startPlaying: '开始播放',
      stopPlaying: '停止播放',
      mouseEnterLog: '鼠标进入日志',
      mouseLeaveLog: '鼠标离开日志',
      stickyDelayStart: '粘滞开始延迟',
      stickyDelayEnd: '粘滞结束延迟',
      dragStart: '拖动开始',
      dragEnd: '拖动结束',
      snapToLeft: '向左吸附',
      snapToRight: '向右吸附',
      snapToTop: '向上吸附',
      snapToBottom: '向下吸附'
    },
    
    // 任务日志翻译
    taskLogger: {
      title: '任务日志',
      systemLog: '系统日志',
      clearLog: '清除日志',
      exportLog: '导出日志',
      minimizeLog: '最小化日志',
      maximizeLog: '最大化日志',
      noTasks: '没有任务',
      taskCompleted: '任务完成',
      taskError: '任务错误',
      taskInProgress: '任务进行中',
      backgroundInit: '背景初始化',
      backgroundSwitch: '背景切换',
      languageSwitch: '语言切换',
      modeSwitch: '模式切换',
      memoryUsage: '内存使用',
      performanceMetrics: '性能指标'
    },
    
    // 空间站状态翻译
    spaceStation: {
      title: '空间站状态',
      status: '状态',
      location: '位置',
      systems: '系统',
      telemetry: '遥测',
      lastUpdate: '最后更新',
      nextContact: '下次联系',
      signalStrength: '信号强度',
      dataRate: '数据速率',
      temperature: '温度',
      pressure: '压力',
      humidity: '湿度',
      oxygenLevel: '氧气水平',
      co2Level: '二氧化碳水平',
      solarPanels: '太阳能板',
      batteries: '电池',
      thrusters: '推进器',
      attitude: '姿态',
      gpsLock: 'GPS 锁定',
      networkStatus: '网络状态'
    },
    
    // 控制界面
    deepSpaceVisualPlatform: '深空视觉体验平台',
    integratedMusicManagement: '集成音乐管理与播放功能',
    currentTheme: '当前主题',
    nextSwitch: '下次切换',
    
    // 着色器名称
    shaderNames: {
      pureSilver: '纯银色',
      liquidChrome: '液态铬',
      silverMist: '银雾',
      metallicFlow: '金属流动',
      cosmicSilver: '宇宙银河'
    },
    
    // 功能描述
    exportPlaylistsDesc: '导出播放列表和音乐库数据，支持格式转换。',
    intelligentMusicDesc: '智能音乐管理，自动分类和元数据优化。',
    realtimeMonitoringDesc: '实时监控处理任务和系统性能指标。',
    
    // 系统状态
    connectingToBackend: '正在连接音乐后端...',
    waveformEngineReady: '波形引擎已就绪',
    
    // 版权信息
    copyright: '@天宫科技',
    madeBy: 'Made By 麻蛇',
    
    // 按钮文本
    language: '语言',
    switchBackground: '切换背景',
    resetCycle: '重置背景循环'
  },
  'en': {
    // 欢迎页面
    welcome: 'Welcome',
    clickToContinue: 'Click anywhere to continue',
    currentTime: 'Current Time',
    tiangongTech: 'Tiangong Technology',
    fullScreenApp: 'Immersive Experience App',
    clickAnywhereToEnter: 'Click anywhere to enter console',
    
    // 天宫卫星系统
    spaceStationStatus: 'Tiangong Space Station Status',
    tiangongStation: 'Tiangong Space Station',
    coreModule: 'Core Module',
    labModule: 'Lab Module',
    powerSystem: 'Power System',
    communicationSystem: 'Communication System',
    lifeSupportSystem: 'Life Support System',
    operational: 'Operational',
    standby: 'Standby',
    maintenance: 'Maintenance',
    
    // 地理位置和轨道信息
    locationInfo: 'Location Info',
    coordinates: 'Coordinates',
    latitude: 'Latitude',
    longitude: 'Longitude',
    altitude: 'Altitude',
    groundAltitude: 'Ground Altitude',
    orbitalAltitude: 'Orbital Altitude',
    orbitalVelocity: 'Orbital Velocity',
    orbitalPeriod: 'Orbital Period',
    groundTrack: 'Ground Track',
    nextPassTime: 'Next Pass',
    visibility: 'Visibility',
    locating: 'Locating...',
    locationError: 'Location Failed',
    
    // 音乐系统
    musicSystem: 'Music System',
    spotifyExport: 'Spotify Export',
    libraryOrganizer: 'Library Organizer',
    taskMonitor: 'Task Monitor',
    backendStatus: 'Backend Status',
    termusicBackend: 'Termusic Backend',
    wavesurferEngine: 'Wavesurfer Engine',
    audioSystem: 'Audio System',
    quickActions: 'Quick Actions',
    connectBackend: 'Connect Backend',
    loadPlaylists: 'Load Playlists',
    audioSettings: 'Audio Settings',
    connecting: 'Connecting...',
    ready: 'Ready',
    startExport: 'Start Export',
    startOrganize: 'Start Organize',
    
    // 播放器
    tiangongRadio: 'Tiangong Radio',
    deepSpaceChannel: 'Deep Space Channel',
    radioPlayer: 'Radio Player',
    closeRadio: 'Close Radio',
    dragToMove: 'Drag to Move',
    
    // 电台播放器新增翻译
    radio: {
      stationName: 'Radio Station',
      frequency: 'Frequency',
      playButton: 'Play',
      pauseButton: 'Pause',
      volumeControl: 'Volume Control',
      syncButton: 'Sync',
      syncActive: 'Syncing',
      syncInactive: 'Not Synced',
      liveStatus: 'Live',
      offStatus: 'Off',
      hoverHint: 'Hover Hint',
      dragHint: 'Drag Hint',
      snapToEdge: 'Snap to Edge',
      expandOnHover: 'Expand on Hover',
      closePlayer: 'Close Player',
      waveformReady: 'Waveform Ready',
      waveformError: 'Waveform Error',
      startPlaying: 'Start Playing',
      stopPlaying: 'Stop Playing',
      mouseEnterLog: 'Mouse Enter Log',
      mouseLeaveLog: 'Mouse Leave Log',
      stickyDelayStart: 'Sticky Start Delay',
      stickyDelayEnd: 'Sticky End Delay',
      dragStart: 'Drag Start',
      dragEnd: 'Drag End',
      snapToLeft: 'Snap to Left',
      snapToRight: 'Snap to Right',
      snapToTop: 'Snap to Top',
      snapToBottom: 'Snap to Bottom'
    },
    
    // 任务日志翻译
    taskLogger: {
      title: 'Task Logger',
      systemLog: 'System Log',
      clearLog: 'Clear Log',
      exportLog: 'Export Log',
      minimizeLog: 'Minimize Log',
      maximizeLog: 'Maximize Log',
      noTasks: 'No Tasks',
      taskCompleted: 'Task Completed',
      taskError: 'Task Error',
      taskInProgress: 'Task In Progress',
      backgroundInit: 'Background Initialization',
      backgroundSwitch: 'Background Switch',
      languageSwitch: 'Language Switch',
      modeSwitch: 'Mode Switch',
      memoryUsage: 'Memory Usage',
      performanceMetrics: 'Performance Metrics'
    },
    
    // 空间站状态翻译
    spaceStation: {
      title: 'Space Station Status',
      status: 'Status',
      location: 'Location',
      systems: 'Systems',
      telemetry: 'Telemetry',
      lastUpdate: 'Last Update',
      nextContact: 'Next Contact',
      signalStrength: 'Signal Strength',
      dataRate: 'Data Rate',
      temperature: 'Temperature',
      pressure: 'Pressure',
      humidity: 'Humidity',
      oxygenLevel: 'Oxygen Level',
      co2Level: 'CO2 Level',
      solarPanels: 'Solar Panels',
      batteries: 'Batteries',
      thrusters: 'Thrusters',
      attitude: 'Attitude',
      gpsLock: 'GPS Lock',
      networkStatus: 'Network Status'
    },
    
    // 控制界面
    deepSpaceVisualPlatform: 'Deep Space Visual Platform',
    integratedMusicManagement: 'Integrated music management and playback',
    currentTheme: 'Current Theme',
    nextSwitch: 'Next Switch',
    
    // 着色器名称
    shaderNames: {
      pureSilver: 'Pure Silver',
      liquidChrome: 'Liquid Chrome',
      silverMist: 'Silver Mist',
      metallicFlow: 'Metallic Flow',
      cosmicSilver: 'Cosmic Silver'
    },
    
    // 功能描述
    exportPlaylistsDesc: 'Export playlists and music library data with format conversion support.',
    intelligentMusicDesc: 'Intelligent music management with automated classification and metadata optimization.',
    realtimeMonitoringDesc: 'Real-time monitoring of processing tasks and system performance metrics.',
    
    // 系统状态
    connectingToBackend: 'Connecting to music backend...',
    waveformEngineReady: 'Waveform engine ready',
    
    // 版权信息
    copyright: '@Tiangong Technology',
    madeBy: 'Made By MaShe',
    
    // 按钮文本
    language: 'Language',
    switchBackground: 'Switch Background',
    resetCycle: 'Reset Background Cycle',
    
    // 通用状态和操作
    common: {
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      close: 'Close',
      open: 'Open',
      minimize: 'Minimize',
      maximize: 'Maximize',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      reset: 'Reset',
      refresh: 'Refresh',
      settings: 'Settings',
      help: 'Help',
      about: 'About',
      volume: 'Volume',
      play: 'Play',
      pause: 'Pause',
      stop: 'Stop',
      next: 'Next',
      previous: 'Previous',
      shuffle: 'Shuffle',
      repeat: 'Repeat',
      mute: 'Mute',
      unmute: 'Unmute'
    }
  }
};

export function getSystemLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  
  const lang = navigator.language.toLowerCase();
  
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

export function getTranslations(lang?: string): Translations {
  const currentLang = lang || getSystemLanguage();
  return translations[currentLang] || translations['en'];
}

export function getShaderName(shaderId: number, lang: string): string {
  const t = getTranslations(lang);
  const shaderNames = ['pureSilver', 'liquidChrome', 'silverMist', 'metallicFlow', 'cosmicSilver'] as const;
  const shaderKey = shaderNames[shaderId] || 'pureSilver';
  return t.shaderNames[shaderKey];
}