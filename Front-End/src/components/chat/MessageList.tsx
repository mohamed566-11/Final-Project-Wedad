import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { ChatMessage } from '@/types/chat';
import MessageBubble from './MessageBubble';

function getLabel(isoDate: string): string {
    const d = parseISO(isoDate);
    if (isToday(d)) return 'اليوم';
    if (isYesterday(d)) return 'أمس';
    return format(d, 'EEEE d MMMM', { locale: ar });
}

interface Props { messages: ChatMessage[]; isLoading: boolean; }

const MessageList: React.FC<Props> = ({ messages, isLoading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">جاري تحميل الرسائل...</div>
    );
    if (!messages.length) return (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">لا توجد رسائل بعد — ابدأ المحادثة!</div>
    );

    const groups: { label: string; msgs: ChatMessage[] }[] = [];
    messages.forEach(m => {
        const l = getLabel(m.created_at);
        const last = groups[groups.length - 1];
        if (last?.label === l) last.msgs.push(m);
        else groups.push({ label: l, msgs: [m] });
    });

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {groups.map(g => (
                <div key={g.label}>
                    <div className="text-center text-xs text-gray-400 my-3 select-none">{g.label}</div>
                    {g.msgs.map(m => <MessageBubble key={m.id} message={m} />)}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default MessageList;
