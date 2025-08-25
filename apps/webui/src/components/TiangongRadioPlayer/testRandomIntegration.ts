/**
 * 随机算法集成简单测试
 * 验证基本功能是否正常工作
 */

import { randomStateManager } from './randomStateManager';
import { randomStateRecovery } from './randomStateRecovery';
import { randomEmotionIntegration } from './randomEmotionIntegration';

/**
 * 运行基本功能测试
 */
export async function testRandomAlgorithmBasics(): Promise<void> {
  console.log('🧪 开始随机算法基础功能测试...');
  
  try {
    // 测试1: 随机数生成
    console.log('\n🔍 测试随机数生成...');
    const randomValue = randomStateManager.random();
    console.log(`随机值: ${randomValue}`);
    if (typeof randomValue === 'number' && randomValue >= 0 && randomValue <= 1) {
      console.log('✅ 随机数生成正常');
    } else {
      console.log('❌ 随机数生成异常');
    }
    
    // 测试2: 状态恢复
    console.log('\n🔍 测试状态恢复...');
    const backup = await randomStateRecovery.createBackup('测试备份');
    if (backup) {
      console.log('✅ 备份创建成功');
      console.log(`备份ID: ${backup.id}`);
    } else {
      console.log('❌ 备份创建失败');
    }
    
    // 测试3: 情绪集成
    console.log('\n🔍 测试情绪集成...');
    randomEmotionIntegration.setEmotionState(0.8, 0.2, 0.6);
    randomEmotionIntegration.triggerRandomnessUpdate();
    
    const status = randomEmotionIntegration.getIntegrationStatus();
    if (status) {
      console.log('✅ 情绪集成正常');
      console.log('集成状态:', status);
    } else {
      console.log('❌ 情绪集成异常');
    }
    
    console.log('\n🎉 基础功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 测试随机预设选择
 */
export function testRandomPresetSelection(): void {
  console.log('\n🎨 测试随机预设选择...');
  
  try {
    // 模拟预设推荐
    const mockPresets = [
      'liquid_metal_polish',
      'rhythmic_pulse', 
      'cosmic_silver',
      'silver_pure',
      'metallic_flow'
    ];
    
    // 使用随机算法选择预设
    const randomIndex = Math.floor(randomStateManager.random() * mockPresets.length);
    const selectedPreset = mockPresets[randomIndex];
    
    console.log(`可用预设: ${mockPresets.join(', ')}`);
    console.log(`随机选择: ${selectedPreset}`);
    
    if (selectedPreset && mockPresets.includes(selectedPreset)) {
      console.log('✅ 随机预设选择正常');
    } else {
      console.log('❌ 随机预设选择异常');
    }
    
  } catch (error) {
    console.error('❌ 预设选择测试失败:', error);
  }
}

/**
 * 运行完整测试
 */
export async function runCompleteTest(): Promise<void> {
  console.log('🚀 开始完整随机算法集成测试...');
  console.log('=====================================');
  
  await testRandomAlgorithmBasics();
  testRandomPresetSelection();
  
  console.log('\n=====================================');
  console.log('🎯 测试完成！');
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中
  (window as any).testRandomAlgorithm = {
    testBasics: testRandomAlgorithmBasics,
    testPresetSelection: testRandomPresetSelection,
    runComplete: runCompleteTest
  };
  
  console.log('🧪 随机算法测试模块已加载到 window.testRandomAlgorithm');
}
