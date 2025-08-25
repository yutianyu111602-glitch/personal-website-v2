import React from 'react';

/** CardRail —— 横向滚动的卡片轨道（仅外壳；不改卡片样式） */
export interface CardRailProps {
  children?: React.ReactNode;
  className?: string;
}
const CardRail: React.FC<CardRailProps> = ({ children, className }) => {
  return (
    <div className={['w-full overflow-x-auto', className||''].join(' ')}>
      <div className="flex items-stretch gap-3 min-w-max">{children}</div>
    </div>
  );
};
export default CardRail;
