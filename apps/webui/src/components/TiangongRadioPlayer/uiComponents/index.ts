/**
 * 🎨 UI组件模块导出文件
 * 
 * 功能：
 * - 统一导出所有UI组件
 * - 提供清晰的组件接口
 * - 支持按需导入和批量导入
 * - 维护组件依赖关系
 * 
 * 职责：
 * - 组件统一导出
 * - 接口文档管理
 * - 依赖关系维护
 */

// 导入所有UI组件
import TechniqueSelector from './TechniqueSelector';
import EmotionMonitor from './EmotionMonitor';
import AidjMixDecisionDisplay from './AidjMixDecisionDisplay';
import PresetUsageMonitor from './PresetUsageMonitor';
import RealTimeVectorDisplay from './RealTimeVectorDisplay';
import DockedAIDJConsole from './DockedAIDJConsole';

// 导出所有UI组件
export { default as TechniqueSelector } from './TechniqueSelector';
export { default as EmotionMonitor } from './EmotionMonitor';
export { default as AidjMixDecisionDisplay } from './AidjMixDecisionDisplay';
export { default as PresetUsageMonitor } from './PresetUsageMonitor';
export { default as RealTimeVectorDisplay } from './RealTimeVectorDisplay';
export { default as DockedAIDJConsole } from './DockedAIDJConsole';

// 导出组件属性类型
export type {
  TechniqueSelectorProps,
  EmotionMonitorProps,
  AidjMixDecisionDisplayProps,
  PresetUsageMonitorProps,
  RealTimeVectorDisplayProps
} from './types';

// 导出组件集合
export const UIComponents = {
  TechniqueSelector,
  EmotionMonitor,
  AidjMixDecisionDisplay,
  PresetUsageMonitor,
  RealTimeVectorDisplay,
  DockedAIDJConsole
};

// 导出工具类
export { default as LocalBus } from './LocalBus';
export { localBus } from './LocalBus';

export default UIComponents;
