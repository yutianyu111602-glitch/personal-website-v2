import React from 'react';

/** TwoColumn —— 左右两栏；仅位置与尺寸 */
export interface TwoColumnProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** 左列栅格宽度（默认 8/12），右列自动为剩余 */
  leftColsLg?: number;   // 1..11
  leftColsXl?: number;   // 1..11
  gap?: number;          // 4/6 等 tailwind gap
}
const TwoColumn: React.FC<TwoColumnProps> = ({ left, right, className, leftColsLg=8, leftColsXl=9, gap=6 }) => {
  const leftLg = Math.min(Math.max(leftColsLg,1),11);
  const leftXl = Math.min(Math.max(leftColsXl,1),11);
  const cls = [
    'grid grid-cols-12',
    `gap-4 lg:gap-${gap}`,
    className || ''
  ].join(' ');
  return (
    <div className={cls}>
      <section className={`col-span-12 lg:col-span-${leftLg} xl:col-span-${leftXl} space-y-4`}>{left}</section>
      <aside className={`col-span-12 lg:col-span-${12-leftLg} xl:col-span-${12-leftXl} space-y-4`}>{right}</aside>
    </div>
  );
};
export default TwoColumn;
