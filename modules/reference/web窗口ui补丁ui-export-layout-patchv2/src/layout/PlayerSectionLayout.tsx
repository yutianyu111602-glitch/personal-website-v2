import React from 'react';

/** PlayerSectionLayout —— 播放器页：上方播放器/波形，下方两栏（队列/信息） */
export interface PlayerSlots {
  header?: React.ReactNode;  // 播放器/波形/主操作
  left?: React.ReactNode;    // 队列/播放列表
  right?: React.ReactNode;   // 曲目信息/分析/歌词等
}
const PlayerSectionLayout: React.FC<PlayerSlots> = ({ header, left, right }) => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6 space-y-4">
      {header ? <div>{header}</div> : null}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">{left}</section>
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">{right}</aside>
      </div>
    </div>
  );
};
export default PlayerSectionLayout;
