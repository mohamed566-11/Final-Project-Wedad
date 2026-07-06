import React from 'react';
interface Props { count: number; }
const UnreadBadge: React.FC<Props> = ({ count }) => !count ? null : (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
        {count > 99 ? '99+' : count}
    </span>
);
export default UnreadBadge;
