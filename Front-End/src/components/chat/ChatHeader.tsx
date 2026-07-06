import React from 'react';

interface Props { name: string; avatar?: string | null; isActive: boolean; }

const ChatHeader: React.FC<Props> = ({ name, avatar, isActive }) => (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
            {avatar
                ? <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 font-bold text-sm">{name.charAt(0)}</div>
            }
            <span className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
        </div>
        <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{name}</p>
            <p className="text-xs text-gray-500">{isActive ? '🟢 متصل الآن' : '⚫ غير متاح'}</p>
        </div>
    </div>
);

export default ChatHeader;
