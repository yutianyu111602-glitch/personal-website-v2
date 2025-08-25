# Docked AI DJ Console PRO（底部抽屉 + EmotionMonitor PRO）
更新：2025-08-25 02:12:34

本包 = 你要的“**从底边缘弹出**的 AI 控制台（Dock）” + 升级后的 **EmotionMonitor PRO**。
- **零侵入**：不改任何后端/端口；只依赖 `window.UnifiedEventBus` 事件。
- **接口稳定**：所有按钮**仅广播事件**（不直连 API），与你现有路由/管理器解耦，便于灰度。
- **银色太空主题**：玻璃态、霓虹微光、扫描线、网格、实时曲线（低开销）。

## 快速接入
1. 把 `src/console` 整个目录拷贝到你的前端项目。
2. 在你的 App 根组件里挂载：
```tsx
import DockedAIDJConsole from '@/console/DockedAIDJConsole';
export default function App() { return (<><DockedAIDJConsole /></>); }
```
3. 你的 SYNC 按钮或任意位置发送事件即可打开：
```ts
window.UnifiedEventBus?.emit({ namespace:'ui', type:'sync_toggle', data:{ active:true } });
```
（不带 `active` 也行，会toggle）

## 与你系统的事件约定（只广播，不绑端口）
- 切歌：`automix:transition` → `{{ action:'next'|'prev'|'crossfade', durationMs? }}`
- 情绪微调：`automix:mood` → `{{ mood: {{ energy/valence/arousal }} }}`
- 预设强制：`visualization:preset_force` → `{{ name: 'silver_pure'|'silver_mist'|'liquid_chrome'|'metallic_flow'|'cosmic_silver' }}`
- 监听：`bpm:update`、`visualization:preset`、`global:config`、`automix:mood`。

## Cursor 任务单（直接丢给他就能干活）
- [ ] 确认项目已引入 `motion/react`（framer-motion v11）。
- [ ] 把 `src/console` 放到 `src/` 下；路径别改。
- [ ] 在根组件添加 `<DockedAIDJConsole />`。
- [ ] 确认 `window.UnifiedEventBus` 存在（若没有，会自动启用本地 LocalBus 兜底）。
- [ ] 点击页面右下“AI 控制台”按钮，或发 `ui:sync_toggle` 事件，抽屉应弹出。
- [ ] 面板按钮仅广播事件；后续由现有 Router/Manager 接手落地到 API。

## 性能注意
- 曲线为 SVG + RAF 单通道，历史长度 64，负载极低。
- 动效走 spring + CSS，不阻塞主循环。
