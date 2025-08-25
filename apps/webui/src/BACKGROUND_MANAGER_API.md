# 背景管理器 API 完全指南

## 🎯 概述

BackgroundManager 是天宫科技应用的核心背景管理系统，提供统一的背景切换、预加载、兼容性检测和性能优化功能。

## 📋 API 接口文档

### BackgroundManager 组件

#### Props 接口

```tsx
interface BackgroundManagerProps {
  className?: string;           // CSS 类名
  onBackgroundChange?: (background: BackgroundConfig) => void; // 背景切换回调
  autoRotateInterval?: number;  // 自动切换间隔(毫秒，0表示禁用)
  enablePreload?: boolean;      // 是否启用预加载
  fallbackColor?: string;       // 回退背景色
  debugMode?: boolean;          // 调试模式
}
```

#### 使用示例

```tsx
<BackgroundManager
  className="absolute inset-0"
  onBackgroundChange={(background) => {
    console.log(`背景已切换: ${background.name}`);
    // 可以在这里更新应用状态
  }}
  enablePreload={true}
  debugMode={process.env.NODE_ENV === 'development'}
  fallbackColor="#c0c5ce"
/>
```

### BackgroundConfig 接口

```tsx
interface BackgroundConfig {
  id: number;                   // 唯一标识符
  name: string;                 // 显示名称
  type: 'shader' | 'static' | 'custom'; // 背景类型
  fragmentShader?: string;      // Shader 代码（可选）
  color: string;                // 主题色（银色系）
  category: 'liquid' | 'geometric' | 'atmospheric' | 'cosmic'; // 分类
  description: string;          // 描述
  performance: 'low' | 'medium' | 'high'; // 性能要求
  compatibility: string[];      // 兼容性要求
}
```

### 工具函数 API

```tsx
// 获取所有可用背景
const allBackgrounds = backgroundManagerUtils.getAllBackgrounds();

// 根据ID查找背景
const background = backgroundManagerUtils.findBackgroundById(1);

// 根据类别过滤
const liquidBackgrounds = backgroundManagerUtils.filterByCategory('liquid');

// 根据性能要求过滤
const lowPerfBackgrounds = backgroundManagerUtils.filterByPerformance('low');
```

## 🔧 扩展指南

### 添加新背景类型

1. **定义背景配置**

```tsx
const newBackground: BackgroundConfig = {
  id: 5,
  name: "Crystal Matrix",
  type: 'shader',
  color: '#c0c5ce',
  category: 'geometric',
  description: "晶体矩阵效果",
  performance: 'high',
  compatibility: ['webgl2', 'latest']
};
```

2. **创建渲染组件**

```tsx
const CrystalMatrixShader: React.FC<{ shaderId: number }> = ({ shaderId }) => {
  // 实现晶体矩阵渲染逻辑
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};
```

3. **集成到背景管理器**

```tsx
// 在 DEFAULT_BACKGROUNDS 数组中添加新配置
const DEFAULT_BACKGROUNDS: BackgroundConfig[] = [
  // ... 现有背景
  newBackground
];

// 在渲染函数中添加对应逻辑
const renderBackground = useCallback((background: BackgroundConfig) => {
  if (background.id === 5) {
    return <CrystalMatrixShader shaderId={background.id} />;
  }
  // ... 其他背景类型
}, []);
```

### 自定义背景类型

1. **实现自定义渲染器**

```tsx
interface CustomBackgroundRenderer {
  render: (config: BackgroundConfig) => React.ReactElement;
  preload?: (config: BackgroundConfig) => Promise<void>;
  cleanup?: (config: BackgroundConfig) => void;
}

const videoBackgroundRenderer: CustomBackgroundRenderer = {
  render: (config) => (
    <video 
      src={config.fragmentShader} 
      autoPlay 
      loop 
      muted 
      className="absolute inset-0 w-full h-full object-cover"
    />
  ),
  preload: async (config) => {
    // 预加载视频
    const video = document.createElement('video');
    video.src = config.fragmentShader!;
    await video.load();
  }
};
```

2. **注册自定义渲染器**

```tsx
// 扩展背景管理器以支持自定义渲染器
const BackgroundManagerExtended: React.FC<BackgroundManagerProps & {
  customRenderers?: Map<string, CustomBackgroundRenderer>;
}> = ({ customRenderers, ...props }) => {
  // 实现逻辑
};
```

## 🎨 银色主题集成

### 颜色规范

所有新背景必须遵循银色主题：

```tsx
const SILVER_THEME_COLORS = {
  primary: '#c0c5ce',    // 纯银色
  secondary: '#a8b2c4',  // 液态铬色  
  tertiary: '#9399a8'    // 银雾色
};

// 背景配置示例
const silverBackground: BackgroundConfig = {
  // ...
  color: SILVER_THEME_COLORS.primary, // 必须使用银色系
  // ...
};
```

### 视觉一致性

确保新背景与整体设计语言一致：

- 使用银色调色板
- 保持适当的对比度
- 支持透明度变化
- 与UI元素协调

## 🚀 性能优化

### 预加载策略

```tsx
// 智能预加载实现
const preloadStrategy = {
  // 预加载下一个背景
  next: (currentIndex: number, backgrounds: BackgroundConfig[]) => {
    const nextIndex = (currentIndex + 1) % backgrounds.length;
    return backgrounds[nextIndex];
  },
  
  // 预加载高优先级背景
  priority: (backgrounds: BackgroundConfig[]) => {
    return backgrounds.filter(bg => bg.performance === 'low');
  },
  
  // 基于使用频率预加载
  frequency: (backgrounds: BackgroundConfig[], usage: Map<number, number>) => {
    return backgrounds.sort((a, b) => (usage.get(b.id) || 0) - (usage.get(a.id) || 0));
  }
};
```

### 内存管理

```tsx
// 背景资源清理
const cleanupBackground = (backgroundId: number) => {
  // 清理 WebGL 资源
  if (glContexts.has(backgroundId)) {
    const gl = glContexts.get(backgroundId);
    gl.deleteProgram(programs.get(backgroundId));
    gl.deleteBuffer(buffers.get(backgroundId));
    glContexts.delete(backgroundId);
  }
  
  // 清理图片资源
  if (imageCache.has(backgroundId)) {
    imageCache.delete(backgroundId);
  }
};
```

## 🔍 调试功能

### 调试模式

启用 `debugMode={true}` 时的功能：

1. **控制台日志**
   - 背景切换事件
   - 性能指标
   - 兼容性检测结果
   - 预加载状态

2. **视觉调试器**
   - 显示当前背景信息
   - 实时性能监控
   - 内存使用情况

3. **开发者控制面板**
   - 手动切换背景
   - 重置循环状态
   - 性能测试工具

### 错误处理

```tsx
// 全面的错误处理机制
try {
  // 背景渲染逻辑
} catch (error) {
  console.error('背景渲染失败:', error);
  
  // 降级到安全背景
  return <FallbackBackground config={background} />;
} finally {
  // 清理资源
  cleanup();
}
```

## 📱 兼容性系统

### 浏览器检测

```tsx
const checkCompatibility = (): string[] => {
  const support: string[] = ['all'];
  
  // WebGL 支持
  if (hasWebGLSupport()) {
    support.push('webgl');
    
    if (hasWebGL2Support()) {
      support.push('webgl2');
    }
  }
  
  // 现代特性
  if (hasModernFeatures()) {
    support.push('modern');
  }
  
  // 最新特性
  if (hasLatestFeatures()) {
    support.push('latest');
  }
  
  return support;
};
```

### 降级策略

```tsx
const getDegradedBackground = (
  background: BackgroundConfig, 
  compatibility: string[]
): BackgroundConfig => {
  // 如果不兼容，返回简化版本
  if (!isCompatible(background, compatibility)) {
    return {
      ...background,
      type: 'static',
      performance: 'low',
      compatibility: ['all']
    };
  }
  
  return background;
};
```

## 🧪 测试指南

### 单元测试

```tsx
describe('BackgroundManager', () => {
  test('应该正确初始化背景', () => {
    render(<BackgroundManager />);
    expect(screen.getByTestId('background-container')).toBeInTheDocument();
  });
  
  test('应该处理背景切换', async () => {
    const onBackgroundChange = jest.fn();
    render(<BackgroundManager onBackgroundChange={onBackgroundChange} />);
    
    // 模拟背景切换
    fireEvent.click(screen.getByTestId('next-background'));
    
    await waitFor(() => {
      expect(onBackgroundChange).toHaveBeenCalled();
    });
  });
});
```

### 性能测试

```tsx
const performanceTest = async () => {
  const start = performance.now();
  
  // 测试背景切换性能
  await switchBackground(newBackgroundId);
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`背景切换耗时: ${duration}ms`);
  
  // 断言性能要求
  expect(duration).toBeLessThan(500); // 应该在500ms内完成
};
```

## 🔮 未来扩展

### 计划功能

1. **动态背景**
   - 基于时间的背景变化
   - 用户活动响应背景
   - 季节性主题背景

2. **AI背景生成**
   - 基于用户偏好生成
   - 实时风格迁移
   - 个性化推荐

3. **多媒体背景**
   - 视频背景支持
   - 音频可视化
   - 3D场景集成

### 扩展接口预留

```tsx
interface FutureBackgroundConfig extends BackgroundConfig {
  // 动态属性
  dynamic?: {
    timeBasedVariation?: boolean;
    userActivityResponse?: boolean;
    seasonalThemes?: boolean;
  };
  
  // AI生成
  aiGenerated?: {
    userPreferences?: UserPreference[];
    styleTransfer?: StyleConfig;
    personalizedRecommendation?: boolean;
  };
  
  // 多媒体
  multimedia?: {
    video?: VideoConfig;
    audio?: AudioConfig;
    scene3D?: Scene3DConfig;
  };
}
```

## 📞 支持

如有问题或需要帮助，请：

1. 查看控制台日志（调试模式下）
2. 检查浏览器兼容性
3. 验证背景配置格式
4. 参考示例代码

---

*此文档将随着功能迭代持续更新。最后更新：2025年8月*