# 🎛️ AidjMix算法移植技术文档

## 📋 文档信息
- **创建时间**: 2025-01-25
- **项目版本**: V2版本
- **移植目标**: 0侵入集成AidjMix智能DJ算法
- **安全策略**: 完整退路，一键回滚

---

## 🏗️ AidjMix算法架构分析

### **核心组件结构**
```
AidjMix算法系统
├── 核心算法层
│   ├── aidjmix-techniques-v1 (20种切歌手法)
│   ├── aidjmix-techno-presets (5种预设策略)
│   └── aidjmix-logic-rotation-and-logs (轮换逻辑)
├── 桥接适配层
│   ├── EventBusAdapter.unified.ts (事件总线映射)
│   ├── EmotionTechniqueBridge.ts (情绪核心桥接)
│   └── AutoMixRouterAdapter.ts (自动混音路由)
├── 前端集成层
│   ├── AidjPlaylistClient.ts (自动歌单客户端)
│   ├── AIDJConsoleSkeleton.tsx (命令台骨架)
│   └── ConsoleStore.ts (状态管理)
└── 安全兜底层
    ├── simpleHeadTail (基础兜底)
    ├── 网络稳定性检测
    └── 错误计数与降级
```

### **算法核心特性**
1. **智能手法选择**: 基于BPM、调性、段落、人声等20+维度
2. **情绪感知**: 与现有EmotionCoreManager完全集成
3. **预设轮换**: 24小时智能预设切换，支持时区配置
4. **安全优先**: 多重安全策略，确保系统稳定性

---

## 🔄 移植策略与安全原则

### **0侵入原则**
- ✅ **不改动现有代码**: AutoMixManager、EmotionCoreManager保持原样
- ✅ **只添加适配层**: 通过事件总线桥接，不修改核心逻辑
- ✅ **保持接口兼容**: 所有现有API和事件保持不变
- ✅ **支持一键回滚**: 关闭开关即可回到原状态

### **安全兜底策略**
1. **simpleHeadTail优先**: 任何异常情况下强制使用基础手法
2. **网络稳定性检测**: dropoutRate > 5% 时自动降级
3. **错误计数保护**: recentErrors > 0 时启用保守模式
4. **性能监控**: 实时监控系统性能，超出阈值自动降级

### **阶段化启用策略**
- **阶段1**: 仅启用 `enableTechniqueBridge`，UI展示推荐
- **阶段2**: UI默认采用推荐（用户未选时）
- **阶段3**: 考虑启用 `enableUnifiedLoop`（非必需）

---

## 📁 文件移植清单

### **核心算法文件 (必须移植)**
```
src/core/aidjmix/
├── techniques/
│   ├── techniqueSelector.ts      # 20种手法选择器
│   ├── techniqueParams.ts        # 手法参数模板
│   └── safetyRules.ts           # 安全规则引擎
├── presets/
│   ├── presetManager.ts         # 预设管理器
│   ├── rotationScheduler.ts     # 轮换调度器
│   └── presetConfigs.ts         # 预设配置
└── bridge/
    ├── emotionBridge.ts         # 情绪核心桥接
    ├── eventAdapter.ts          # 事件总线适配
    └── safetyMonitor.ts         # 安全监控器
```

### **桥接适配文件 (必须移植)**
```
src/adapters/
├── EventBusAdapter.unified.ts   # 事件总线映射
├── EmotionTechniqueBridge.ts    # 情绪技术桥接
├── AutoMixRouterAdapter.ts      # 自动混音路由
└── NowPlayingMirror.ts          # 播放状态镜像
```

### **前端集成文件 (必须移植)**
```
src/components/aidj/
├── AidjPlaylistClient.ts        # 自动歌单客户端
├── AIDJConsoleSkeleton.tsx      # 命令台骨架
├── ConsoleStore.ts              # 状态管理
└── SpaceSilverTokens.css        # 太空银主题
```

### **类型定义文件 (必须移植)**
```
src/types/aidj/
├── techniques.ts                 # 手法相关类型
├── presets.ts                   # 预设相关类型
├── bridge.ts                    # 桥接相关类型
└── contracts.ts                 # 接口契约
```

---

## 🔌 系统集成步骤

### **步骤1: 事件总线映射**
```typescript
// 在项目入口处添加
import { EventBusAdapter } from './adapters/EventBusAdapter.unified';

// 映射到现有的UnifiedEventBus
const adapter = new EventBusAdapter({
  EventBus: UnifiedEventBus,
  enable: true
});

// 确保事件命名空间对齐
adapter.mapEvents({
  'automix:mood': 'mood',
  'automix:bpm': 'bpm', 
  'automix:transition': 'transition',
  'automix:technique_recommend': 'technique_recommend'
});
```

### **步骤2: 情绪核心桥接**
```typescript
// 配置EmotionCoreManager
import { EmotionCoreManager } from './core/EmotionCoreManager';

const emotionCore = new EmotionCoreManager({
  enableUnifiedLoop: false,        // 避免与现有循环冲突
  enableTechniqueBridge: true,     // 启用技术桥接
  enableNowPlayingPull: false,     // 需要时再启用
  AUTODJ_STATUS_URL: '',           // 留空不请求
  NOWPLAYING_URL: ''               // 留空不请求
});

// 注册到管理器
managerRegistry.register(emotionCore);
```

### **步骤3: 前端客户端集成**
```typescript
// 在电台组件中集成
import { AidjPlaylistClient } from './components/aidj/AidjPlaylistClient';

const client = new AidjPlaylistClient('/api/aidjmix/autoplaylist');

// 订阅推荐事件
UnifiedEventBus.on('automix', 'technique_recommend', (e) => {
  const recommendation = e.data;
  // 更新UI显示推荐手法
  setRecommendedTechnique(recommendation.technique);
  setRecommendationReason(recommendation.reason);
});

// 生成自动歌单
const handleGenerate = async () => {
  const technique = userSelectedTechnique ?? recommendedTechnique ?? 'simple_head_tail';
  
  try {
    const result = await client.requestAutoPlaylist(tracks, {
      minutes: 60,
      beamWidth: 24,
      preset: currentPreset,
      simpleHeadTail: enableSimpleHeadTail,
      technique: technique
    });
    
    // 处理结果
    handlePlaylistResult(result);
  } catch (error) {
    // 错误处理，自动降级到simpleHeadTail
    console.warn('自动歌单生成失败，使用兜底策略:', error);
    useFallbackStrategy();
  }
};
```

---

## 🎯 20种切歌手法详解

### **基础手法 (4种)**
1. **bass_swap**: 低频交接，24拍，安全稳定
2. **long_layer_24**: 24拍长层叠，慢速/极简
3. **phrase_cut_16**: 16拍短语切，高速/硬核
4. **simple_head_tail**: 仅头尾相接，最终兜底

### **进阶手法 (8种)**
5. **long_layer_32**: 32拍超长层叠，hypnotic/深夜
6. **mid_scoop_cross**: 中频挖槽交叉，减浑浊
7. **hat_carry**: 用目标曲的ride/hat先入场
8. **percussion_tease**: 只引入打击循环，build前铺垫
9. **hp_sweep_in**: 高通扫入，A保持B扫入
10. **lp_sweep_out**: 低通扫出，配hp_sweep_in连用
11. **delay_tail_1_2**: 尾拍延迟冻结，回声遮蔽切换
12. **reverb_wash**: 尾拍房混洗出，氛围流

### **高级手法 (8种)**
13. **loop_roll_4**: 尾部4拍循环再切，对齐短语边界
14. **backspin_safe**: 安全回盘，硬核强调
15. **brake_fx**: 盘停效果，夜场高潮
16. **double_drop_32**: 32拍时点对齐DROP同时落
17. **stutter_gate**: 尾部门限断续，riser前
18. **kick_replace**: 先替换KICK，8拍后完成切换
19. **bass_duck_side**: 侧链duck让A低频引导
20. **noise_riser_cross**: 白噪riser叠加作为胶水

---

## 🛡️ 安全策略与约束

### **BPM约束**
- **≤128**: `long_layer_24/32`, `hp_sweep_in`, `percussion_tease`
- **128–134**: `bass_swap`, `mid_scoop_cross`, `hat_carry`
- **≥140**: `phrase_cut_16`, `backspin_safe`, `brake_fx`

### **调性约束**
- **优先**: 同键/邻键/同主音
- **禁用**: `double_drop_32` 在Key不匹配时
- **保守**: 不兼容时使用 `mid_scoop_cross`

### **人声约束**
- **vocality > 0.2**: 禁用 `stutter_gate/brake_fx/backspin_safe`
- **原因**: 防止撕裂感，保护人声质量

### **网络约束**
- **dropoutRate > 5%**: 限制为温和手法
- **recentErrors > 0**: 强制使用 `bass_swap/long_layer_*`

---

## 🔍 测试与验证

### **冒烟测试清单**
- [ ] BPM→能量映射: 90/120/150 各触发一次
- [ ] 情绪偏置: arousal=0.8 → 推荐偏向 `phrase_cut_16`
- [ ] 网络抖动: dropoutRate=0.08 → 推荐退回安全手法
- [ ] 人声保护: vocality=0.6 → 禁用FX-heavy手法

### **性能测试指标**
- **算法响应时间**: < 200ms
- **事件处理频率**: ≤ 10Hz
- **内存使用**: 增长 < 20%
- **CPU占用**: 增长 < 15%

### **稳定性测试**
- **长时间运行**: 12小时无异常
- **多标签页**: 并发处理正常
- **错误恢复**: 异常后自动降级
- **回滚测试**: 一键回到原状态

---

## 🚨 风险控制与监控

### **实时监控指标**
```typescript
// 健康度计数器
const healthMetrics = {
  request_total: 0,      // 总请求数
  plan_ok: 0,            // 成功生成数
  plan_error: 0,         // 失败数
  technique_recommend: 0, // 推荐命中数
  recentErrors: 0,       // 最近错误数
  dropoutRate: 0         // 网络丢包率
};

// 60秒心跳快照
const heartbeatSnapshot = {
  timestamp: Date.now(),
  bpm: currentBpm,
  energy: currentEnergy,
  preset: currentPreset,
  technique: currentTechnique
};
```

### **自动降级策略**
1. **网络不稳定**: 自动切换到温和手法
2. **错误率过高**: 强制使用 `simpleHeadTail`
3. **性能下降**: 降低事件处理频率
4. **内存泄漏**: 自动清理事件监听器

### **告警机制**
- **红色**: 错误率 > 10%，系统不稳定
- **黄色**: 错误率 5-10%，需要关注
- **绿色**: 错误率 < 5%，系统正常

---

## 📝 部署与上线

### **环境配置**
```bash
# .env 配置
VITE_API_BASE=/
VITE_AUTODJ_POLL_MS=2000
VITE_NOWPLAYING_POLL_MS=5000
VITE_BEAM_WIDTH=24
VITE_TARGET_MINUTES=60
VITE_DEFAULT_PRESET=classic
VITE_TIMEZONE=Asia/Bangkok
```

### **灰度上线步骤**
1. **准备阶段**: 部署代码，配置开关
2. **灰度10%**: 仅启用 `enableTechniqueBridge`
3. **观察指标**: 监控错误率和性能
4. **逐步扩大**: 稳定后扩大灰度范围
5. **全量上线**: 确认稳定后全量启用

### **回滚策略**
```typescript
// 一键回滚
const emergencyRollback = () => {
  // 关闭所有AidjMix功能
  emotionCore.disableTechniqueBridge();
  emotionCore.disableUnifiedLoop();
  
  // 强制使用兜底策略
  forceSimpleHeadTail();
  
  // 清理事件监听器
  cleanupEventListeners();
  
  console.log('🚨 紧急回滚完成，系统已回到安全状态');
};
```

---

## 📊 预期效果与收益

### **功能增强**
- ✅ **智能编排**: 20种专业切歌手法
- ✅ **情绪感知**: 与现有情绪核心完全集成
- ✅ **预设轮换**: 24小时智能预设切换
- ✅ **安全兜底**: 多重保护，确保稳定性

### **性能提升**
- ✅ **响应速度**: 算法响应 < 200ms
- ✅ **资源效率**: 内存增长 < 20%
- ✅ **事件处理**: 高频事件受控
- ✅ **错误恢复**: 自动降级，快速恢复

### **用户体验**
- ✅ **专业感**: AI智能推荐，专业DJ体验
- ✅ **可视化**: 实时反馈，进度指示
- ✅ **个性化**: 支持手动覆盖，灵活控制
- ✅ **稳定性**: 兜底机制，永不崩溃

---

## 📝 总结

AidjMix算法移植是一个**0侵入、高安全、强兜底**的系统增强项目。通过事件总线桥接、情绪核心集成、智能手法选择，将为电台系统带来专业的DJ混音能力，同时保持系统的稳定性和可维护性。

**关键成功因素**:
1. **严格遵循0侵入原则**，不改动现有代码
2. **多重安全兜底**，确保系统在任何情况下都有退路
3. **阶段化启用**，支持渐进式部署和快速回滚
4. **实时监控**，及时发现和处理问题

**下一步**: 开始执行TODOLIST第一阶段任务
**负责人**: AI助手
**预计完成时间**: 2025-01-27
