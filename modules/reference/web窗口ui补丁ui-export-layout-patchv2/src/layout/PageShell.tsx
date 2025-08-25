import React from 'react';

/** PageShell —— 通用页面容器（控制页面最大宽度与内边距） */
export interface PageShellProps {
  className?: string;
  children?: React.ReactNode;
  /** 最大宽度（默认 1400px）；只改尺寸，不改风格 */
  maxWidth?: number;
  /** 是否启用小屏更紧凑的左右 padding */
  compact?: boolean;
}
const PageShell: React.FC<PageShellProps> = ({ className, children, maxWidth=1400, compact=false }) => {
  const cls = [
    'mx-auto w-full',
    `max-w-[${maxWidth}px]`,
    compact ? 'px-3 lg:px-4' : 'px-4 lg:px-6',
    className || ''
  ].join(' ');
  return <div className={cls}>{children}</div>;
};
export default PageShell;
