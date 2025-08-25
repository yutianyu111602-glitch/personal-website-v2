import React from 'react';

/** ThreeColumn —— 三栏布局（仅位置与尺寸） */
export interface ThreeColumnProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}
const ThreeColumn: React.FC<ThreeColumnProps> = ({ left, center, right, className }) => {
  return (
    <div className={['grid grid-cols-12 gap-4 lg:gap-6', className||''].join(' ')}>
      <section className="col-span-12 lg:col-span-3 space-y-4">{left}</section>
      <section className="col-span-12 lg:col-span-6 space-y-4">{center}</section>
      <aside className="col-span-12 lg:col-span-3 space-y-4">{right}</aside>
    </div>
  );
};
export default ThreeColumn;
