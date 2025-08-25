# 🧩 电台模块化架构说明

## 📋 概述

电台模块已重构为模块化架构，避免代码超过500行导致的超时问题。每个模块负责特定功能，代码更清晰、易维护。

## 🏗️ 模块结构

### 1. **主组件** (`index.tsx`) - **~80行**
- 负责组件组合和整体布局
- 使用各个子模块的hooks和组件
- 保持简洁，只处理核心逻辑

### 2. **状态管理模块** (`stateManager.ts`) - **~90行**
- 管理所有电台状态
- 提供状态更新函数
- 使用React hooks优化性能

### 3. **事件管理模块** (`eventManager.ts`) - **~80行**
- 处理事件监听和AidjMix集成
- 管理自动吸附逻辑
- 负责资源清理

### 4. **窗口管理模块** (`windowManager.ts`) - **~100行**
- 处理窗口大小变化
- 计算样式和位置
- 优化窗口交互

### 5. **UI组件模块** (`uiComponents.tsx`) - **~150行**
- 包含所有UI组件的实现
- 组件化设计，易于复用
- 清晰的组件接口

## 🔧 模块职责分工

| 模块 | 职责 | 代码行数 | 复杂度 |
|------|------|----------|--------|
| `index.tsx` | 主组件组合 | ~80行 | 低 |
| `stateManager.ts` | 状态管理 | ~90行 | 中 |
| `eventManager.ts` | 事件处理 | ~80行 | 中 |
| `windowManager.ts` | 窗口管理 | ~100行 | 中 |
| `uiComponents.tsx` | UI组件 | ~150行 | 低 |
| **总计** | **完整功能** | **~500行** | **分散** |

## 🎯 优势

### 1. **避免超时**
- 单个文件不超过150行
- 编译和加载更快
- 减少内存占用

### 2. **代码清晰**
- 每个模块职责单一
- 易于理解和维护
- 便于团队协作

### 3. **性能优化**
- 模块化懒加载
- 状态更新优化
- 组件渲染优化

### 4. **易于扩展**
- 新功能独立模块
- 不影响现有代码
- 模块间低耦合

## 🚀 使用方式

```typescript
// 主组件中使用
import { useRadioState } from "./stateManager";
import { useEventManager } from "./eventManager";
import { useWindowManager } from "./windowManager";
import { SnapToggleButton, PlayerHeader } from "./uiComponents";

export const TiangongRadioPlayer = () => {
  // 使用状态管理
  const { state, setState } = useRadioState();
  
  // 使用事件管理
  const { aidjMixManagerRef } = useEventManager(state, setState, updateSnapState);
  
  // 使用窗口管理
  const { containerStyle } = useWindowManager(state, setState, updatePosition);
  
  return (
    <div>
      <SnapToggleButton state={state} setState={setState} />
      <PlayerHeader />
      {/* 其他组件 */}
    </div>
  );
};
```

## 🔄 模块间通信

### 1. **状态共享**
- 通过`useRadioState`共享状态
- 状态更新函数传递给子模块
- 保持状态一致性

### 2. **事件传递**
- 事件管理模块负责事件监听
- 通过回调函数更新状态
- 模块间解耦

### 3. **样式计算**
- 窗口管理模块计算样式
- 样式对象传递给UI组件
- 响应式设计支持

## 📝 开发规范

### 1. **文件命名**
- 使用描述性名称
- 遵循驼峰命名法
- 模块名清晰表达功能

### 2. **代码组织**
- 相关功能放在同一模块
- 避免循环依赖
- 保持模块独立性

### 3. **性能考虑**
- 使用React hooks优化
- 避免不必要的重新渲染
- 合理使用useMemo和useCallback

## 🎉 总结

模块化架构成功解决了代码超时问题，同时提升了代码质量和可维护性。每个模块都有明确的职责，代码结构清晰，便于后续开发和维护。
