import React from 'react';
import PlayerSectionLayout from '../src/layout/PlayerSectionLayout';

const Card = (t:string)=>(
  <div className="p-4 rounded-xl" style={{background:'rgba(192,197,206,0.05)',border:'1px solid rgba(192,197,206,0.15)'}}>
    <div className="text-sm opacity-70">{t}</div>
  </div>
);

export default function PlayerPageExample(){
  return (
    <PlayerSectionLayout
      header={Card('播放器/波形')}
      left={<div className="space-y-4">{Card('队列')}{Card('更多列表')}</div>}
      right={<div className="space-y-4">{Card('曲目信息')}{Card('分析/歌词')}</div>}
    />
  );
}
