import React from 'react';

/** BottomSheetDock —— 底部抽屉外壳（仅容器；动画/外观由你现有样式控制） */
export interface BottomSheetDockProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
const BottomSheetDock: React.FC<BottomSheetDockProps> = ({ header, body, footer, className }) => {
  return (
    <div className={['w-full', className||''].join(' ')}>
      <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
        {header}
        <div className="mt-3">{body}</div>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
};
export default BottomSheetDock;
