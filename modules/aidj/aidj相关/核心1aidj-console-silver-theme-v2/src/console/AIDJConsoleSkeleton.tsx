// AIDJConsoleSkeleton.tsx —— 只写框架，不做渲染（参考 DJ Pro · 空间银主题）
// - 放置位置：贴在电台播放器下方。点击 SYNC，自下边缘弹出 bottom sheet。
// - 接口：事件总线对齐 automix（onMood/onBpm/onTransition/onPreset/onPlan）。
// - UI/动效：全部留给 Cursor，用 shadcn/ui + Tailwind + framer-motion 完成。

import React, { useEffect, useRef } from 'react';
import { useConsoleStore } from './ConsoleStore';
import { onPreset, onMood, onBpm, onTransition, onPlan } from './EventBusAdapter';
import type { PresetName, TechniqueName, TrackFeature } from '../types/shared';
import { AidjPlaylistClient } from '../clients/AidjPlaylistClient';
import './SpaceSilverTokens.css';

type Props = { attachTo?: string };
export default function AIDJConsoleSkeleton(props: Props){
  const { panel, set, preset, technique, simpleHeadTail, emotion, radio, now, plan, toggle } = useConsoleStore();
  const clientRef = useRef(new AidjPlaylistClient());

  // 事件接线（与 automix 兼容）：
  useEffect(()=>{
    const off1 = onPreset((e)=> set({ emotion: { ...emotion, preset: e?.data?.name as PresetName }}));
    const off2 = onMood((e)=> set({ emotion: { ...emotion, ...(e?.data?.mood||{}) }}));
    const off3 = onBpm((e)=> set({ now: { ...now, bpm: e?.data?.bpm } }));
    const off4 = onTransition((e)=> { /* TODO(Cursor): 添加过渡日志/动画/高亮下一首 */ });
    const off5 = onPlan((e)=> { set({ plan: { ...plan, count: e?.data?.plan?.items?.length||0, preset } }); });
    return ()=>{ off1(); off2(); off3(); off4(); off5(); };
  }, [emotion, now, plan, preset, set]);

  // 动作（按钮/快捷键）：
  async function actionSyncGenerate(){
    const tracks: TrackFeature[] = []; // TODO(Cursor): 替换为真实曲库 TrackFeature[]
    await clientRef.current.requestAutoPlaylist(tracks, { minutes: plan.minutes||60, beamWidth:24, preset, simpleHeadTail, technique });
  }
  function actionTogglePanel(){ toggle(); }
  function actionApplyPreset(p: PresetName){ set({ preset: p, emotion: { ...emotion, preset: p } }); }
  function actionApplyTechnique(t: TechniqueName){ set({ technique: t }); }
  function actionToggleSimple(){ set({ simpleHeadTail: !simpleHeadTail }); }

  // 键盘：S=抽屉开关，G=生成歌单
  useEffect(()=>{
    const onKey = (ev: KeyboardEvent)=>{ const k=ev.key.toLowerCase(); if(k==='s') actionTogglePanel(); if(k==='g') actionSyncGenerate(); };
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey);
  }, [preset, technique, simpleHeadTail, plan.minutes]);

  // 占位 DOM：Cursor 去渲染（卡片布局、控件、日志、动效）
  return (
    <div data-theme="space-silver" style={{ position:'fixed', left:0, right:0, bottom:0, zIndex:60 }}>
      {/* SYNC 按钮（银色霓虹）：点击 → actionTogglePanel */}
      {/* TODO(Cursor): 悬浮于电台右下角；金属银外圈 + 霓虹蓝描边；hover 有脉冲 */}

      <div data-panel-state={panel} aria-hidden={panel==='hidden'}>
        {/* Bottom Sheet 容器：毛玻璃 + 拉丝金属背景 + 细网格 */}
        {/* Header：台站状态（listeners/uptime/dropout/avgBpm） + 预设选择器 */}
        {/* Body：情绪核心读数；NowPlaying；控制面板（Preset/Technique/Simple/Generate） */}
        {/* Feedback：请求中（automix:request）→ 进度条/呼吸灯；收到 plan → 绿色 OK 灯 */}
        {/* Logs：过渡 from→to（bpm/key/technique/ts）；点击可预览下个过渡 */}
      </div>
    </div>
  );
}
