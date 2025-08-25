import { UnifiedEventBus, onPlayback, onTransition, onBpm, onEnergy } from '../events/UnifiedEventBus';
import { RadioState } from './types';

/**
 * 事件系统集成模块
 * 负责处理事件监听、状态同步、事件发射等功能
 */

// 事件监听器设置
export const setupEventListeners = (
  setState: React.Dispatch<React.SetStateAction<RadioState>>,
  state: RadioState
) => {
  console.log('🎵 设置事件监听器');
  
  // 监听播放状态变化
  const offPlayback = onPlayback((e) => {
    const playbackState = e.data?.playbackState;
    console.log('🎵 播放状态事件:', playbackState);
    
    setState(prevState => {
      let newIsPlaying = prevState.isPlaying;
      
      if (playbackState === 'play' && !prevState.isPlaying) {
        newIsPlaying = true;
        console.log('✅ 播放状态同步: 播放中');
      }
      if (playbackState === 'pause' && prevState.isPlaying) {
        newIsPlaying = false;
        console.log('✅ 播放状态同步: 已暂停');
      }
      if (playbackState === 'stop') {
        newIsPlaying = false;
        console.log('✅ 播放状态同步: 已停止');
      }
      
      return { ...prevState, isPlaying: newIsPlaying };
    });
  });
  
  // 监听BPM变化
  const offBpm = onBpm((e) => {
    const newBpm = e.data?.bpm;
    if (newBpm && newBpm !== state.bpm) {
      setState(prevState => ({ ...prevState, bpm: newBpm }));
      console.log(`🎵 BPM变化: ${newBpm}`);
    }
  });
  
  // 监听能量变化
  const offEnergy = onEnergy((e) => {
    const newEnergy = e.data?.energy;
    if (newEnergy !== undefined && newEnergy !== state.energy) {
      setState(prevState => ({ ...prevState, energy: newEnergy }));
      console.log(`🎵 能量变化: ${newEnergy}`);
    }
  });
  
  // 监听过渡事件（歌单变化）
  const offTransition = onTransition((e) => {
    console.log('🎚️ 过渡事件:', e.data);
    
    // 通过过渡事件获取歌单信息
    if (e.data?.fromTrack && e.data?.toTrack) {
      // 这里可以根据过渡事件更新歌单信息
      console.log(`🎵 曲目切换: ${e.data.fromTrack} → ${e.data.toTrack}`);
    }
  });
  
  // 🎯 监听AI手法推荐事件
  const offAiRecommendation = UnifiedEventBus.on('automix', 'technique_recommend', (e) => {
    console.log('🎯 AI手法推荐事件:', e.data);
    
    setState(prevState => ({
      ...prevState,
      aiRecommendation: e.data,
      aiStatus: 'recommending'
    }));
    
    // 3秒后重置状态
    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        aiStatus: 'idle'
      }));
    }, 3000);
  });
  
  // 返回清理函数
  return () => {
    offPlayback();
    offBpm();
    offEnergy();
    offTransition();
    offAiRecommendation();
  };
};

// 播放/暂停事件发射
export const emitPlayPauseEvent = (isPlaying: boolean) => {
  if (isPlaying) {
    // 通过事件系统播放音乐
    console.log('🎵 通过事件系统开始播放');
    UnifiedEventBus.emitPlayback('play');
  } else {
    // 通过事件系统暂停音乐
    console.log('⏸️ 通过事件系统暂停音乐');
    UnifiedEventBus.emitPlayback('pause');
  }
};

// 音量控制事件发射
export const emitVolumeEvent = (volume: number) => {
  // 通过事件系统同步音量
  UnifiedEventBus.emitEnergy(volume);
  console.log(`🔊 音量变化: ${Math.round(volume * 100)}%`);
};

// 过渡事件发射
export const emitTransitionEvent = (action: 'next' | 'prev' | 'crossfade', durationMs?: number) => {
  UnifiedEventBus.emit({
    namespace: 'automix',
    type: 'transition',
    timestamp: Date.now(),
    data: { action, durationMs }
  });
  console.log(`🎚️ 发射过渡事件: ${action}`);
};
