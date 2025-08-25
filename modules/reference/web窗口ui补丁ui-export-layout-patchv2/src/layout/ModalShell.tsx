import React from 'react';

/** ModalShell —— 模态框的内容壳（只做内边距与宽度，阴影与背景由你原有样式负责） */
export interface ModalShellProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: number; // 默认 720
}
const ModalShell: React.FC<ModalShellProps> = ({ title, body, footer, className, maxWidth=720 }) => {
  return (
    <div className={['mx-auto w-full', `max-w-[${maxWidth}px]`, 'px-4', className||''].join(' ')}>
      {title ? <div className="mb-3">{title}</div> : null}
      <div>{body}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
};
export default ModalShell;
