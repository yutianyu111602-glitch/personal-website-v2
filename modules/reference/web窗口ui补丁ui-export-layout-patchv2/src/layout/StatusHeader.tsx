import React from 'react';

/** StatusHeader —— 顶部状态条容器（左/中/右） */
export interface StatusHeaderProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}
const StatusHeader: React.FC<StatusHeaderProps> = ({ left, center, right }) => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
      <div className="w-full flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-[200px]">{left}</div>
        <div className="flex-1 min-w-[260px] flex items-center justify-center">{center}</div>
        <div className="min-w-[200px] flex items-center justify-end gap-3">{right}</div>
      </div>
    </div>
  );
};
export default StatusHeader;
