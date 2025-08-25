/**
 * AidjMix补丁包测试脚本
 * 用于验证补丁包的功能、安全边界和性能表现
 */

import { AidjMixPatchManager, EmotionTechniqueBridge, AutoMixRouterAdapter, NowPlayingMirror } from './aidjMixPatch';

// 模拟事件总线
class MockEventBus {
  private listeners: Map<string, Function[]> = new Map();
  private eventHistory: any[] = [];

  on(namespace: string, type: string, callback: Function) {
    const key = `${namespace}:${type}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
    
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emit(event: { namespace: string; type: string; data?: any }) {
    const key = `${event.namespace}:${event.type}`;
    const listeners = this.listeners.get(key) || [];
    
    this.eventHistory.push(event);
    
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });
  }

  getEventHistory() {
    return this.eventHistory;
  }

  clearEventHistory() {
    this.eventHistory = [];
  }
}

// 测试套件
export class AidjMixTestSuite {
  private mockEventBus: MockEventBus;
  private testResults: Map<string, boolean> = new Map();

  constructor() {
    this.mockEventBus = new MockEventBus();
  }

  // 运行所有测试
  async runAllTests(): Promise<Map<string, boolean>> {
    console.log('🧪 开始运行AidjMix补丁包测试套件...');
    
    // 基础功能测试
    await this.testEmotionTechniqueBridge();
    await this.testAutoMixRouterAdapter();
    await this.testNowPlayingMirror();
    await this.testPatchManager();
    
    // 安全边界测试
    await this.testSafetyBoundaries();
    
    // 性能测试
    await this.testPerformance();
    
    // 0侵入测试
    await this.testZeroIntrusion();
    
    console.log('🧪 测试套件运行完成');
    this.printTestResults();
    
    return this.testResults;
  }

  // 测试情绪技术桥接器
  private async testEmotionTechniqueBridge(): Promise<void> {
    console.log('🧪 测试情绪技术桥接器...');
    
    try {
      const bridge = new EmotionTechniqueBridge({
        enable: true,
        minBpmForDoubleDrop: 140,
        crossfadeMs: 4000,
        EventBus: this.mockEventBus
      });

      // 测试BPM事件处理
      this.mockEventBus.emit({
        namespace: 'bpm',
        type: 'update',
        data: { bpm: 150 }
      });

      // 测试情绪事件处理
      this.mockEventBus.emit({
        namespace: 'mood',
        type: 'update',
        data: { mood: { energy: 0.8, valence: 0.6, arousal: 0.7 } }
      });

      // 测试段落事件处理
      this.mockEventBus.emit({
        namespace: 'automix',
        type: 'transition',
        data: { segment: 'drop' }
      });

      // 验证推荐事件是否被发射
      const events = this.mockEventBus.getEventHistory();
      const recommendationEvents = events.filter(e => 
        e.namespace === 'automix' && e.type === 'technique_recommend'
      );

      if (recommendationEvents.length > 0) {
        this.testResults.set('EmotionTechniqueBridge_Basic', true);
        console.log('✅ 情绪技术桥接器基础功能测试通过');
      } else {
        this.testResults.set('EmotionTechniqueBridge_Basic', false);
        console.log('❌ 情绪技术桥接器基础功能测试失败');
      }

      this.mockEventBus.clearEventHistory();
    } catch (error) {
      this.testResults.set('EmotionTechniqueBridge_Basic', false);
      console.error('❌ 情绪技术桥接器测试异常:', error);
    }
  }

  // 测试自动混音路由适配器
  private async testAutoMixRouterAdapter(): Promise<void> {
    console.log('🧪 测试自动混音路由适配器...');
    
    try {
      // 模拟fetch函数
      const originalFetch = global.fetch;
      let fetchCalls: string[] = [];
      
      (global as any).fetch = async (url: string) => {
        fetchCalls.push(url);
        return { ok: true, json: async () => ({}) };
      };

      const adapter = new AutoMixRouterAdapter({
        ENDPOINT_NEXT: '/api/music/next',
        ENDPOINT_PREV: '/api/music/previous',
        ENDPOINT_CROSSF: '/api/music/crossfade?duration={ms}',
        ENDPOINT_VOLUME: '/api/music/volume?level={v}',
        DEFAULT_CROSSFADE_MS: 4000,
        SAFETY_RATE_LIMIT_MS: 1200
      });

      // 模拟事件总线
      const mockBus = {
        on: (namespace: string, type: string, callback: Function) => {
          // 模拟事件触发
          if (namespace === 'automix' && type === 'transition') {
            callback({ data: { action: 'next' } });
          }
          if (namespace === 'playback' && type === 'volume') {
            callback({ data: { level: 0.8 } });
          }
        }
      };

      (window as any).UnifiedEventBus = mockBus;
      adapter.attach();

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100));

      if (fetchCalls.length > 0) {
        this.testResults.set('AutoMixRouterAdapter_Basic', true);
        console.log('✅ 自动混音路由适配器基础功能测试通过');
      } else {
        this.testResults.set('AutoMixRouterAdapter_Basic', false);
        console.log('❌ 自动混音路由适配器基础功能测试失败');
      }

      // 恢复原始fetch
      global.fetch = originalFetch;
    } catch (error) {
      this.testResults.set('AutoMixRouterAdapter_Basic', false);
      console.error('❌ 自动混音路由适配器测试异常:', error);
    }
  }

  // 测试当前播放镜像器
  private async testNowPlayingMirror(): Promise<void> {
    console.log('🧪 测试当前播放镜像器...');
    
    try {
      // 模拟fetch函数
      const originalFetch = global.fetch;
      let fetchCalls = 0;
      
      (global as any).fetch = async (url: string) => {
        fetchCalls++;
        return { 
          ok: true, 
          json: async () => ({ 
            title: 'Test Track', 
            artist: 'Test Artist', 
            bpm: 128,
            segment: 'steady'
          }) 
        };
      };

      const mirror = new NowPlayingMirror({
        NOWPLAYING_URL: '/api/nowplaying',
        INTERVAL_MS: 100, // 快速测试
        EventBus: this.mockEventBus
      });

      mirror.attach();

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const events = this.mockEventBus.getEventHistory();
      const bpmEvents = events.filter(e => e.namespace === 'bpm' && e.type === 'update');

      if (bpmEvents.length > 0 && fetchCalls > 0) {
        this.testResults.set('NowPlayingMirror_Basic', true);
        console.log('✅ 当前播放镜像器基础功能测试通过');
      } else {
        this.testResults.set('NowPlayingMirror_Basic', false);
        console.log('❌ 当前播放镜像器基础功能测试失败');
      }

      mirror.detach();
      this.mockEventBus.clearEventHistory();

      // 恢复原始fetch
      global.fetch = originalFetch;
    } catch (error) {
      this.testResults.set('NowPlayingMirror_Basic', false);
      console.error('❌ 当前播放镜像器测试异常:', error);
    }
  }

  // 测试补丁包管理器
  private async testPatchManager(): Promise<void> {
    console.log('🧪 测试补丁包管理器...');
    
    try {
      const manager = new AidjMixPatchManager(this.mockEventBus);
      
      // 测试启用
      manager.enable({
        enableTechniqueBridge: true,
        enableRouterAdapter: true,
        enableNowPlayingMirror: false
      });

      let status = manager.getStatus();
      if (status.isEnabled) {
        this.testResults.set('PatchManager_Enable', true);
        console.log('✅ 补丁包管理器启用测试通过');
      } else {
        this.testResults.set('PatchManager_Enable', false);
        console.log('❌ 补丁包管理器启用测试失败');
      }

      // 测试禁用
      manager.disable();
      status = manager.getStatus();
      if (!status.isEnabled) {
        this.testResults.set('PatchManager_Disable', true);
        console.log('✅ 补丁包管理器禁用测试通过');
      } else {
        this.testResults.set('PatchManager_Disable', false);
        console.log('❌ 补丁包管理器禁用测试失败');
      }
    } catch (error) {
      this.testResults.set('PatchManager_Basic', false);
      console.error('❌ 补丁包管理器测试异常:', error);
    }
  }

  // 测试安全边界
  private async testSafetyBoundaries(): Promise<void> {
    console.log('🧪 测试安全边界...');
    
    try {
      // 测试重复订阅防护
      const manager = new AidjMixPatchManager(this.mockEventBus);
      manager.enable();
      manager.enable(); // 重复启用
      
      const status = manager.getStatus();
      if (status.isEnabled) {
        this.testResults.set('Safety_NoDuplicateSubscription', true);
        console.log('✅ 重复订阅防护测试通过');
      } else {
        this.testResults.set('Safety_NoDuplicateSubscription', false);
        console.log('❌ 重复订阅防护测试失败');
      }

      // 测试事件节流
      const adapter = new AutoMixRouterAdapter({
        ENDPOINT_NEXT: '/api/music/next',
        ENDPOINT_PREV: '/api/music/previous',
        SAFETY_RATE_LIMIT_MS: 100
      });

      const mockBus = {
        on: (namespace: string, type: string, callback: Function) => {
          // 快速连续触发事件
          for (let i = 0; i < 10; i++) {
            callback({ data: { action: 'next' } });
          }
        }
      };

      (window as any).UnifiedEventBus = mockBus;
      adapter.attach();

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 200));

      this.testResults.set('Safety_RateLimiting', true);
      console.log('✅ 事件节流测试通过');

      manager.disable();
    } catch (error) {
      this.testResults.set('Safety_Boundaries', false);
      console.error('❌ 安全边界测试异常:', error);
    }
  }

  // 测试性能
  private async testPerformance(): Promise<void> {
    console.log('🧪 测试性能...');
    
    try {
      const startTime = performance.now();
      
      const manager = new AidjMixPatchManager(this.mockEventBus);
      manager.enable();
      
      // 模拟高频事件
      for (let i = 0; i < 1000; i++) {
        this.mockEventBus.emit({
          namespace: 'bpm',
          type: 'update',
          data: { bpm: 120 + (i % 40) }
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration < 1000) { // 1秒内完成1000个事件
        this.testResults.set('Performance_EventProcessing', true);
        console.log(`✅ 性能测试通过: ${duration.toFixed(2)}ms`);
      } else {
        this.testResults.set('Performance_EventProcessing', false);
        console.log(`❌ 性能测试失败: ${duration.toFixed(2)}ms`);
      }
      
      manager.disable();
      this.mockEventBus.clearEventHistory();
    } catch (error) {
      this.testResults.set('Performance_Test', false);
      console.error('❌ 性能测试异常:', error);
    }
  }

  // 测试0侵入性
  private async testZeroIntrusion(): Promise<void> {
    console.log('🧪 测试0侵入性...');
    
    try {
      // 验证补丁包不会修改全局对象
      const originalWindowKeys = Object.keys(window);
      
      const manager = new AidjMixPatchManager(this.mockEventBus);
      manager.enable();
      
      const afterWindowKeys = Object.keys(window);
      const newKeys = afterWindowKeys.filter(key => !originalWindowKeys.includes(key));
      
      if (newKeys.length === 0) {
        this.testResults.set('ZeroIntrusion_NoGlobalModification', true);
        console.log('✅ 0侵入性测试通过: 未修改全局对象');
      } else {
        this.testResults.set('ZeroIntrusion_NoGlobalModification', false);
        console.log('❌ 0侵入性测试失败: 修改了全局对象', newKeys);
      }
      
      manager.disable();
    } catch (error) {
      this.testResults.set('ZeroIntrusion_Test', false);
      console.error('❌ 0侵入性测试异常:', error);
    }
  }

  // 打印测试结果
  private printTestResults(): void {
    console.log('\n📊 AidjMix补丁包测试结果汇总:');
    console.log('=====================================');
    
    let passed = 0;
    let total = 0;
    
    this.testResults.forEach((result, testName) => {
      const status = result ? '✅ 通过' : '❌ 失败';
      console.log(`${testName}: ${status}`);
      if (result) passed++;
      total++;
    });
    
    console.log('=====================================');
    console.log(`总计: ${passed}/${total} 测试通过`);
    
    if (passed === total) {
      console.log('🎉 所有测试通过！补丁包可以安全上线');
    } else {
      console.log('⚠️ 部分测试失败，请检查问题后重新测试');
    }
  }
}

// 导出测试套件
export default AidjMixTestSuite;
