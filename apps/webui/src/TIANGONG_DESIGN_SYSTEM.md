# 天宫科技银色主题设计系统 v4.0
## Tiangong Technology Silver Theme Design System

> **专业级配色方案与视觉规范**  
> 适用于全屏视觉体验应用 | 2025 Apple风格 | 无毛玻璃效果版本  
> @天宫科技 Made By 麻蛇

---

## 🎨 核心配色方案 | Core Color Palette

### 银色主调系统 | Primary Silver System
```css
/* 银色三级主调 - 精确色值 */
--silver-primary: #c0c5ce;    /* 高级银金属色 - 主要UI元素 */
--silver-secondary: #a8b2c4;  /* 液态铬银色 - 次要UI元素 */
--silver-tertiary: #9399a8;   /* 银雾色 - 辅助UI元素 */

/* RGB分解值（便于编程计算） */
Primary:   RGB(192, 197, 206) | HSL(218°, 17%, 78%)
Secondary: RGB(168, 178, 196) | HSL(219°, 18%, 71%) 
Tertiary:  RGB(147, 153, 168) | HSL(223°, 10%, 62%)
```

### 透明度变体系统 | Alpha Variants System
```css
/* 银色主调透明度梯度 - 精确到1% */
--silver-primary-05: rgba(192, 197, 206, 0.05);   /* 极淡背景 */
--silver-primary-10: rgba(192, 197, 206, 0.1);    /* 淡背景 */
--silver-primary-15: rgba(192, 197, 206, 0.15);   /* 边框 */
--silver-primary-20: rgba(192, 197, 206, 0.2);    /* 悬停状态 */
--silver-primary-30: rgba(192, 197, 206, 0.3);    /* 激活状态 */
--silver-primary-40: rgba(192, 197, 206, 0.4);    /* 高亮元素 */
--silver-primary-60: rgba(192, 197, 206, 0.6);    /* 重要文字 */
--silver-primary-80: rgba(192, 197, 206, 0.8);    /* 主要文字 */

/* 次要银色透明度梯度 */
--silver-secondary-05: rgba(168, 178, 196, 0.05);
--silver-secondary-10: rgba(168, 178, 196, 0.1);
--silver-secondary-15: rgba(168, 178, 196, 0.15);
--silver-secondary-20: rgba(168, 178, 196, 0.2);
--silver-secondary-30: rgba(168, 178, 196, 0.3);
--silver-secondary-40: rgba(168, 178, 196, 0.4);
--silver-secondary-60: rgba(168, 178, 196, 0.6);
--silver-secondary-80: rgba(168, 178, 196, 0.8);

/* 辅助银色透明度梯度 */
--silver-tertiary-05: rgba(147, 153, 168, 0.05);
--silver-tertiary-10: rgba(147, 153, 168, 0.1);
--silver-tertiary-15: rgba(147, 153, 168, 0.15);
--silver-tertiary-20: rgba(147, 153, 168, 0.2);
--silver-tertiary-30: rgba(147, 153, 168, 0.3);
--silver-tertiary-40: rgba(147, 153, 168, 0.4);
--silver-tertiary-60: rgba(147, 153, 168, 0.6);
--silver-tertiary-80: rgba(147, 153, 168, 0.8);
```

### 状态指示色彩 | Status Indicator Colors
```css
/* 系统状态色 - 与银色主题协调 */
--status-dormant: var(--silver-tertiary-30);      /* 休眠状态 */
--status-active: var(--silver-secondary-80);      /* 激活状态 */
--status-pulse: var(--silver-primary-60);         /* 脉冲状态 */
--status-error: rgba(220, 38, 38, 0.8);          /* 错误状态 - 红色 */
--status-success: rgba(34, 197, 94, 0.8);        /* 成功状态 - 绿色 */
--status-warning: rgba(251, 191, 36, 0.8);       /* 警告状态 - 黄色 */
--status-sync-active: rgba(255, 193, 7, 0.35);   /* 同步激活 - 亮黄色 */
```

### 交互色彩系统 | Interaction Color System
```css
/* 统一的交互响应色彩 */
--interaction-bg: var(--silver-primary-10);        /* 默认背景 */
--interaction-border: var(--silver-secondary-20);  /* 默认边框 */
--interaction-text: var(--silver-secondary-80);    /* 默认文字 */
--interaction-text-muted: var(--silver-tertiary-60); /* 次要文字 */
--interaction-hover: var(--silver-primary-20);     /* 悬停背景 */
--interaction-active: var(--silver-primary-30);    /* 激活背景 */
```

---

## 🔤 字体系统 | Typography System

### 字体族定义 | Font Family Definitions
```css
/* 核心字体族 - 按优先级排序 */
--font-heading: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
--font-chinese: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

/* 字体回退策略 */
English Primary: SF Pro Display → Apple System → Segoe UI → Generic Sans
English Body: SF Pro Text → Apple System → Segoe UI → Generic Sans  
Monospace: SF Mono → Monaco → Menlo → Consolas → Generic Mono
Chinese: PingFang SC → Hiragino Sans GB → Microsoft YaHei → Generic Sans
```

### 字体规格系统 | Typography Scale System
```css
/* 标题层级 - 统一等宽字体规格 */
h1 { font-size: 18px; letter-spacing: 0.1em; font-weight: 400; }   /* 主标题 */
h2 { font-size: 16px; letter-spacing: 0.08em; font-weight: 400; }  /* 副标题 */
h3 { font-size: 14px; letter-spacing: 0.06em; font-weight: 400; }  /* 三级标题 */
h4 { font-size: 12px; letter-spacing: 0.05em; font-weight: 400; }  /* 四级标题 */
h5 { font-size: 11px; letter-spacing: 0.04em; font-weight: 400; }  /* 五级标题 */
h6 { font-size: 10px; letter-spacing: 0.03em; font-weight: 400; }  /* 六级标题 */

/* 系统文字层级 - 基于TaskLogger规格 */
.text-system-primary {
  font-size: 12px; font-weight: 400; letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.9); text-transform: uppercase;
}

.text-system-secondary {
  font-size: 11px; font-weight: 300; letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.7); text-transform: uppercase;
}

.text-system-tertiary {
  font-size: 10px; font-weight: 300; letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5); text-transform: uppercase;
}

.text-system-quaternary {
  font-size: 9px; font-weight: 300; letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.4); text-transform: uppercase;
}

/* 特殊用途字体 */
button, .button {
  font-size: 10px; font-weight: 400; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(255, 255, 255, 0.8);
}

input, textarea, select {
  font-size: 11px; font-weight: 300; letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.9);
}

code, .code, .mono {
  font-size: 10px; font-weight: 300; letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
}
```

### 数字字体专用规格 | Numeric Font Specifications
```css
/* 数字显示专用样式 - 确保最佳可读性 */
.numeric-display {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum' 1, 'kern' 1;  /* 等宽数字，启用字距调整 */
  font-variant-numeric: tabular-nums;          /* 表格数字对齐 */
  letter-spacing: 0.05em;                      /* 适度字符间距 */
}

/* 时钟数字 - 大尺寸显示 */
.clock-numeric {
  font-size: 48px; font-weight: 300; letter-spacing: 0.08em;
  font-feature-settings: 'tnum' 1, 'zero' 1;  /* 等宽数字 + 切开零 */
}

/* 小数字 - 状态指示器 */
.small-numeric {
  font-size: 9px; font-weight: 400; letter-spacing: 0.1em;
  font-feature-settings: 'tnum' 1;
}

/* 中等数字 - 面板数据 */
.medium-numeric {
  font-size: 11px; font-weight: 400; letter-spacing: 0.06em;
  font-feature-settings: 'tnum' 1;
}
```

---

## 🌟 光效与阴影系统 | Glow & Shadow System

### 银色光效系统 | Silver Glow System
```css
/* 银色光效渐变 - 无毛玻璃版本 */
--silver-glow-soft: rgba(192, 197, 206, 0.25);    /* 柔和光晕 */
--silver-glow-medium: rgba(192, 197, 206, 0.4);   /* 中等光晕 */
--silver-glow-strong: rgba(192, 197, 206, 0.6);   /* 强烈光晕 */

/* 深度阴影系统 */
--silver-shadow-soft: rgba(0, 0, 0, 0.1);         /* 柔和阴影 */
--silver-shadow-medium: rgba(0, 0, 0, 0.15);      /* 中等阴影 */
--silver-shadow-strong: rgba(0, 0, 0, 0.25);      /* 强烈阴影 */

/* 实际应用示例 */
/* 按钮悬停光效 */
box-shadow: 0 0 20px var(--silver-glow-medium);

/* 面板阴影效果 */
box-shadow: 0 4px 20px var(--silver-shadow-soft);

/* 激活状态光效 */
box-shadow: 0 0 30px var(--silver-glow-strong);
```

### 特殊效果系统 | Special Effects System
```css
/* 脉冲动画 - 黄色同步指示器 */
@keyframes radioSyncPulseYellow {
  0%, 100% { 
    background: rgba(255, 193, 7, 0.35);
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.4);
    transform: scale(1);
  }
  50% { 
    background: rgba(255, 193, 7, 0.55);
    box-shadow: 0 0 30px rgba(255, 193, 7, 0.6);
    transform: scale(1.02);
  }
}

/* 渐变背景系统 */
--gradient-silver-primary: linear-gradient(135deg, 
  var(--silver-primary-10) 0%, 
  var(--silver-primary-05) 50%, 
  var(--silver-primary-15) 100%);

--gradient-silver-secondary: linear-gradient(135deg, 
  var(--silver-secondary-10) 0%, 
  var(--silver-secondary-05) 50%, 
  var(--silver-secondary-15) 100%);

--gradient-radial-silver: radial-gradient(circle, 
  var(--silver-primary-10) 0%, 
  var(--silver-secondary-05) 50%, 
  transparent 100%);
```

---

## 📐 深度层次系统 | Depth Layer System

### Z-Index 层级管理 | Z-Index Hierarchy
```css
/* 严格的层级管理系统 - 2025年1月版本 */
z-index: -1;   /* 背景层 (BackgroundManager) */
z-index: 5;    /* 版权信息 */
z-index: 10;   /* 欢迎模式覆盖层 */
z-index: 20;   /* 控制台主容器 */
z-index: 25;   /* 主功能面板 (AdvancedMusicOrganizer) */
z-index: 30;   /* 任务日志面板 (TaskLogger) */
z-index: 40;   /* 卫星信息面板 (欢迎模式) */
z-index: 50;   /* 键盘提示弹窗 */
z-index: 60;   /* 时钟模块 (控制台模式) */
z-index: 70;   /* 时钟模块 (欢迎模式) */
z-index: 85;   /* 电台浮窗 - Wavesurfer集成 */
z-index: 90;   /* 右上角控件 (最高优先级) */

/* 深度视觉系统 */
--depth-background: var(--silver-primary-05);    /* 背景深度 */
--depth-surface: var(--silver-primary-10);       /* 表面深度 */
--depth-elevated: var(--silver-primary-15);      /* 提升深度 */
--depth-floating: var(--silver-secondary-15);    /* 浮动深度 */
--depth-overlay: var(--silver-secondary-20);     /* 覆盖深度 */
```

---

继续下一部分...