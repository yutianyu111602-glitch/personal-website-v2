/**
 * 切歌手法桥接系统测试脚本
 * 在浏览器控制台中运行此脚本来测试系统功能
 */

// 全局测试函数
(window as any).testTechniqueBridge = async () => {
  console.log('🧪 开始测试切歌手法桥接系统...');
  
  try {
    // 1. 检查UnifiedEventBus是否可用
    const { UnifiedEventBus } = window as any;
    if (!UnifiedEventBus) {
      console.error('❌ UnifiedEventBus未找到');
      return false;
    }
    console.log('✅ UnifiedEventBus可用');

    // 2. 检查EmotionCoreManager是否启用
    const emotionCoreEnabled = (window as any).emotionCoreManager?.cfg?.enableTechniqueBridge;
    console.log('📊 EmotionCoreManager技术桥接状态:', emotionCoreEnabled);

    // 3. 检查AidjMix补丁包状态
    const aidjMixStatus = (window as any).aidjMixManagerRef?.current?.getStatus();
    console.log('📊 AidjMix补丁包状态:', aidjMixStatus);

    // 4. 模拟情绪变化事件
    console.log('🎯 模拟情绪变化事件...');
    UnifiedEventBus.emit({
      namespace: 'automix',
      type: 'mood',
      timestamp: Date.now(),
      data: {
        mood: {
          energy: 0.8,
          valence: 0.2,
          arousal: 0.7
        }
      }
    });

    // 5. 模拟BPM变化事件
    console.log('🎯 模拟BPM变化事件...');
    UnifiedEventBus.emit({
      namespace: 'automix',
      type: 'bpm',
      timestamp: Date.now(),
      data: {
        bpm: 140
      }
    });

    // 6. 模拟段落切换事件
    console.log('🎯 模拟段落切换事件...');
    UnifiedEventBus.emit({
      namespace: 'automix',
      type: 'transition',
      timestamp: Date.now(),
      data: {
        segment: 'drop'
      }
    });

    // 7. 等待事件处理
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 8. 检查是否收到技术推荐事件
    let recommendationReceived = false;
    const testListener = (event: any) => {
      if (event?.type === 'technique_recommend') {
        recommendationReceived = true;
        console.log('✅ 收到技术推荐事件:', event.data);
      }
    };

    UnifiedEventBus.on('automix', 'technique_recommend', testListener);

    // 再次触发情绪变化
    UnifiedEventBus.emit({
      namespace: 'automix',
      type: 'mood',
      timestamp: Date.now(),
      data: {
        mood: {
          energy: 0.9,
          valence: 0.3,
          arousal: 0.8
        }
      }
    });

    // 等待推荐生成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 清理测试监听器
    if (testListener) {
      // 这里应该调用unsubscribe，但为了测试简化处理
    }

    // 9. 测试结果
    if (recommendationReceived) {
      console.log('🎉 切歌手法桥接系统测试通过！');
      return true;
    } else {
      console.log('❌ 未收到技术推荐事件');
      return false;
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
};

// 快速状态检查函数
(window as any).checkTechniqueBridgeStatus = () => {
  console.log('🔍 检查切歌手法桥接系统状态...');
  
  // 检查配置
  const config = (window as any).dataConfig;
  console.log('📋 配置文件状态:', {
    emotionCoreUnifiedLoop: config?.featureFlags?.emotionCoreUnifiedLoop,
    enableTechniqueBridge: config?.featureFlags?.enableTechniqueBridge,
    emotionCoreConfig: config?.emotionCore,
    aidjMixConfig: config?.aidjMix
  });

  // 检查事件总线
  const { UnifiedEventBus } = window as any;
  console.log('📡 事件总线状态:', !!UnifiedEventBus);

  // 检查补丁包
  const aidjMixStatus = (window as any).aidjMixManagerRef?.current?.getStatus();
  console.log('🎯 AidjMix补丁包状态:', aidjMixStatus);

  return {
    config: config,
    eventBus: !!UnifiedEventBus,
    aidjMix: aidjMixStatus
  };
};

// 手动触发技术推荐函数
(window as any).triggerTechniqueRecommend = (energy = 0.7, bpm = 128, segment = 'steady') => {
  console.log('🎯 手动触发技术推荐...');
  
  const { UnifiedEventBus } = window as any;
  if (!UnifiedEventBus) {
    console.error('❌ UnifiedEventBus未找到');
    return;
  }

  // 触发情绪变化
  UnifiedEventBus.emit({
    namespace: 'automix',
    type: 'mood',
    timestamp: Date.now(),
    data: {
      mood: {
        energy: energy,
        valence: 0.0,
        arousal: energy * 0.8
      }
    }
  });

  // 触发BPM变化
  UnifiedEventBus.emit({
    namespace: 'automix',
    type: 'bpm',
    timestamp: Date.now(),
    data: {
      bpm: bpm
    }
  });

  // 触发段落变化
  UnifiedEventBus.emit({
    namespace: 'automix',
    type: 'transition',
    timestamp: Date.now(),
    data: {
      segment: segment
    }
  });

  console.log('✅ 手动触发完成，请查看技术推荐事件');
};

console.log('🎯 切歌手法桥接系统测试脚本已加载');
console.log('📋 可用测试函数:');
console.log('  - testTechniqueBridge() - 完整系统测试');
console.log('  - checkTechniqueBridgeStatus() - 状态检查');
console.log('  - triggerTechniqueRecommend(energy, bpm, segment) - 手动触发推荐');
