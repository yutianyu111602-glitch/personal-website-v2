/**
 * 随机算法集成验证脚本
 * 验证所有组件是否正确集成和工作
 */

import { randomStateManager } from './randomStateManager';
import { randomStateRecovery } from './randomStateRecovery';
import { randomEmotionIntegration } from './randomEmotionIntegration';

/**
 * 验证随机状态管理器
 */
function verifyRandomStateManager(): boolean {
  console.log('🔍 验证随机状态管理器...');
  
  try {
    // 检查模块是否存在
    if (!randomStateManager) {
      console.log('❌ randomStateManager 模块不存在');
      return false;
    }
    
    // 检查随机数生成
    const randomValue = randomStateManager.random();
    if (typeof randomValue !== 'number' || randomValue < 0 || randomValue > 1) {
      console.log('❌ 随机数生成异常:', randomValue);
      return false;
    }
    
    console.log('✅ 随机状态管理器验证通过');
    return true;
    
  } catch (error) {
    console.error('❌ 随机状态管理器验证失败:', error);
    return false;
  }
}

/**
 * 验证随机状态恢复
 */
async function verifyRandomStateRecovery(): Promise<boolean> {
  console.log('🔍 验证随机状态恢复...');
  
  try {
    if (!randomStateRecovery) {
      console.log('❌ randomStateRecovery 模块不存在');
      return false;
    }
    
    // 创建测试备份
    const backup = await randomStateRecovery.createBackup('验证测试备份');
    if (!backup || !backup.id) {
      console.log('❌ 备份创建失败');
      return false;
    }
    
    console.log('✅ 随机状态恢复验证通过');
    return true;
    
  } catch (error) {
    console.error('❌ 随机状态恢复验证失败:', error);
    return false;
  }
}

/**
 * 验证随机情绪集成
 */
function verifyRandomEmotionIntegration(): boolean {
  console.log('🔍 验证随机情绪集成...');
  
  try {
    if (!randomEmotionIntegration) {
      console.log('❌ randomEmotionIntegration 模块不存在');
      return false;
    }
    
    // 设置情绪状态
    randomEmotionIntegration.setEmotionState(0.7, 0.3, 0.5);
    
    // 触发随机性更新
    randomEmotionIntegration.triggerRandomnessUpdate();
    
    // 获取集成状态
    const status = randomEmotionIntegration.getIntegrationStatus();
    if (!status) {
      console.log('❌ 无法获取集成状态');
      return false;
    }
    
    console.log('✅ 随机情绪集成验证通过');
    return true;
    
  } catch (error) {
    console.error('❌ 随机情绪集成验证失败:', error);
    return false;
  }
}

/**
 * 验证模块间集成
 */
function verifyModuleIntegration(): boolean {
  console.log('🔍 验证模块间集成...');
  
  try {
    // 测试情绪驱动的随机性
    const testEmotions = [
      { energy: 0.2, valence: -0.5, arousal: 0.3 }, // 低能量，负面，低激活
      { energy: 0.5, valence: 0.0, arousal: 0.5 },  // 中等能量，中性，中等激活
      { energy: 0.8, valence: 0.6, arousal: 0.7 }   // 高能量，正面，高激活
    ];
    
    let successCount = 0;
    
    for (const emotion of testEmotions) {
      try {
        randomEmotionIntegration.setEmotionState(emotion.energy, emotion.valence, emotion.arousal);
        randomEmotionIntegration.triggerRandomnessUpdate();
        
        const status = randomEmotionIntegration.getIntegrationStatus();
        if (status) {
          successCount++;
        }
      } catch (error) {
        console.warn(`情绪状态 ${JSON.stringify(emotion)} 测试失败:`, error);
      }
    }
    
    if (successCount === testEmotions.length) {
      console.log('✅ 模块间集成验证通过');
      return true;
    } else {
      console.log(`⚠️ 模块间集成部分成功: ${successCount}/${testEmotions.length}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 模块间集成验证失败:', error);
    return false;
  }
}

/**
 * 运行完整验证
 */
export async function runFullVerification(): Promise<void> {
  console.log('🚀 开始随机算法集成完整验证...');
  console.log('=====================================');
  
  const results = {
    randomStateManager: false,
    randomStateRecovery: false,
    randomEmotionIntegration: false,
    moduleIntegration: false
  };
  
  // 验证各个模块
  results.randomStateManager = verifyRandomStateManager();
  results.randomStateRecovery = await verifyRandomStateRecovery();
  results.randomEmotionIntegration = verifyRandomEmotionIntegration();
  results.moduleIntegration = verifyModuleIntegration();
  
  // 输出验证结果
  console.log('\n📊 验证结果汇总:');
  console.log('=====================================');
  console.log(`随机状态管理器: ${results.randomStateManager ? '✅' : '❌'}`);
  console.log(`随机状态恢复: ${results.randomStateRecovery ? '✅' : '❌'}`);
  console.log(`随机情绪集成: ${results.randomEmotionIntegration ? '✅' : '❌'}`);
  console.log(`模块间集成: ${results.moduleIntegration ? '✅' : '❌'}`);
  console.log('=====================================');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n🎯 验证通过率: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  
  if (successRate === 100) {
    console.log('🎉 所有验证通过！随机算法集成完全正常！');
  } else if (successRate >= 75) {
    console.log('⚠️ 大部分验证通过，但存在一些问题需要修复');
  } else {
    console.log('❌ 验证失败较多，需要深入检查和修复');
  }
  
  // 输出详细状态信息
  console.log('\n📋 详细状态信息:');
  try {
    const rsmStatus = randomStateManager ? '已加载' : '未加载';
    const rsrStatus = randomStateRecovery ? '已加载' : '未加载';
    const reiStatus = randomEmotionIntegration ? '已加载' : '未加载';
    
    console.log(`- RandomStateManager: ${rsmStatus}`);
    console.log(`- RandomStateRecovery: ${rsrStatus}`);
    console.log(`- RandomEmotionIntegration: ${reiStatus}`);
    
    if (randomEmotionIntegration) {
      const integrationStatus = randomEmotionIntegration.getIntegrationStatus();
      console.log('- 集成状态:', integrationStatus);
    }
    
  } catch (error) {
    console.warn('获取详细状态时出错:', error);
  }
}

// 如果直接运行此文件，执行验证
if (typeof window !== 'undefined') {
  // 在浏览器环境中
  (window as any).verifyRandomAlgorithm = {
    runVerification: runFullVerification,
    verifyRandomStateManager,
    verifyRandomStateRecovery,
    verifyRandomEmotionIntegration,
    verifyModuleIntegration
  };
  
  console.log('🔍 随机算法验证模块已加载到 window.verifyRandomAlgorithm');
}
