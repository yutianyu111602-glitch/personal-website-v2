// AppStub.tsx —— 仅示例挂载（不渲染 UI）。实际样式/动效交给 Cursor。
// 用法：把此文件里的组件挂在电台播放器下方即可。
import React from 'react';
import AIDJConsoleSkeleton from '../src/console/AIDJConsoleSkeleton';
export default function AppStub(){
  return (<>
    {/* 你的电台播放器 */}
    <div id="radio-root">{/* TODO: Radio Player Mount */}</div>
    {/* 命令台骨架 */}
    <AIDJConsoleSkeleton attachTo="radio-root" />
  </>);
}
