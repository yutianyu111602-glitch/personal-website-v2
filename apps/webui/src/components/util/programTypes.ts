// 电台节目表类型定义

export interface Program {
  id: string;
  title: string;
  description: string;
  startTime: string; // HH:MM 格式
  endTime: string;   // HH:MM 格式
  duration: number;  // 分钟
  genre: string;     // 节目类型
  host?: string;     // 主持人
  coverUrl?: string; // 节目封面
  isLive?: boolean;  // 是否直播
  tags?: string[];   // 标签
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD 格式
  programs: Program[];
}

export interface RadioSchedule {
  stationName: string;
  stationId: string;
  timezone: string;
  schedule: DailySchedule[];
}

// 默认节目表数据
export const defaultPrograms: Program[] = [
  {
    id: 'program-1',
    title: '星河晨光',
    description: '清晨的宇宙音乐之旅，带你感受星空的宁静与美好',
    startTime: '06:00',
    endTime: '08:00',
    duration: 120,
    genre: '轻音乐',
    host: '晨星',
    isLive: true,
    tags: ['轻音乐', '晨间', '放松']
  },
  {
    id: 'program-2',
    title: '深空漫步',
    description: '探索宇宙深处的神秘音律，科幻与音乐的完美融合',
    startTime: '08:00',
    endTime: '10:00',
    duration: 120,
    genre: '科幻音乐',
    host: '星际旅者',
    isLive: true,
    tags: ['科幻', '电子', '探索']
  },
  {
    id: 'program-3',
    title: '银河咖啡厅',
    description: '午后的休闲时光，爵士与蓝调的温柔拥抱',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    genre: '爵士音乐',
    host: '月光女士',
    isLive: true,
    tags: ['爵士', '休闲', '咖啡']
  },
  {
    id: 'program-4',
    title: '星际午餐',
    description: '午餐时间的轻松音乐，为你的一天充满能量',
    startTime: '12:00',
    endTime: '14:00',
    duration: 120,
    genre: '流行音乐',
    host: '太阳使者',
    isLive: true,
    tags: ['流行', '活力', '午餐']
  },
  {
    id: 'program-5',
    title: '宇宙下午茶',
    description: '下午的温馨时光，古典音乐与现代的对话',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    genre: '古典音乐',
    host: '和谐先生',
    isLive: true,
    tags: ['古典', '优雅', '下午茶']
  },
  {
    id: 'program-6',
    title: '黄昏交响',
    description: '黄昏时分的深度音乐体验，感受一天的沉淀',
    startTime: '16:00',
    endTime: '18:00',
    duration: 120,
    genre: '交响乐',
    host: '暮光导师',
    isLive: true,
    tags: ['交响', '深度', '黄昏']
  },
  {
    id: 'program-7',
    title: '星夜电台',
    description: '夜晚的电子音乐派对，释放你的激情与活力',
    startTime: '18:00',
    endTime: '20:00',
    duration: 120,
    genre: '电子音乐',
    host: 'DJ 星尘',
    isLive: true,
    tags: ['电子', '派对', '夜晚']
  },
  {
    id: 'program-8',
    title: '深夜漫谈',
    description: '深夜的心灵音乐，陪伴你的每一个静谧夜晚',
    startTime: '20:00',
    endTime: '22:00',
    duration: 120,
    genre: '心灵音乐',
    host: '夜语者',
    isLive: true,
    tags: ['心灵', '深夜', '陪伴']
  },
  {
    id: 'program-9',
    title: '午夜星河',
    description: '午夜时分的宁静音乐，让心灵在音符中得到安息',
    startTime: '22:00',
    endTime: '00:00',
    duration: 120,
    genre: '新世纪音乐',
    host: '星河守望者',
    isLive: true,
    tags: ['新世纪', '宁静', '午夜']
  },
  {
    id: 'program-10',
    title: '凌晨冥想',
    description: '凌晨的冥想音乐，在安静中寻找内心的平静',
    startTime: '00:00',
    endTime: '06:00',
    duration: 360,
    genre: '冥想音乐',
    host: '静心导师',
    isLive: false,
    tags: ['冥想', '安静', '凌晨']
  }
];

// 工具函数
export const getCurrentProgram = (programs: Program[]): Program | null => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  for (const program of programs) {
    const start = program.startTime;
    const end = program.endTime;
    
    // 处理跨日节目（如00:00-06:00）
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return program;
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return program;
      }
    }
  }
  
  return null;
};

export const getNextProgram = (programs: Program[]): Program | null => {
  const current = getCurrentProgram(programs);
  if (!current) return programs[0] || null;
  
  const currentIndex = programs.findIndex(p => p.id === current.id);
  const nextIndex = (currentIndex + 1) % programs.length;
  
  return programs[nextIndex] || null;
};

export const formatTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getTimeUntilNextProgram = (programs: Program[]): number => {
  const next = getNextProgram(programs);
  if (!next) return 0;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextProgramMinutes = formatTimeToMinutes(next.startTime);
  
  // 处理跨日情况
  if (nextProgramMinutes < currentMinutes) {
    return (24 * 60) - currentMinutes + nextProgramMinutes;
  }
  
  return nextProgramMinutes - currentMinutes;
};