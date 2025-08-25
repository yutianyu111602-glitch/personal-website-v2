import React from 'react';

/** ToolbarDock —— 顶部工具条停靠（仅位置；内部外观由调用方决定） */
export interface ToolbarDockProps {
  left?: React.ReactNode;     // 左：主操作（筛选/搜索/按钮群）
  center?: React.ReactNode;   // 中：状态摘要/统计
  right?: React.ReactNode;    // 右：二级操作/帮助/图标
  className?: string;
}
const ToolbarDock: React.FC<ToolbarDockProps> = ({ left, center, right, className }) => {
  return (
    <div className={['w-full flex items-center justify-between gap-3 flex-wrap', className||''].join(' ')}>
      <div className="flex items-center gap-3 min-w-[200px]">{left}</div>
      <div className="flex-1 min-w-[260px] flex items-center justify-center">{center}</div>
      <div className="flex items-center gap-3 min-w-[200px] justify-end">{right}</div>
    </div>
  );
};
export default ToolbarDock;
