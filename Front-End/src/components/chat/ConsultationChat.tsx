import React from 'react';
import { useConsultationChat } from '@/hooks/useConsultationChat';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Props {
    consultationId: number;
    consultationStatus: string;
    otherPartyName: string;
    otherPartyAvatar?: string | null;
    userType: 'patient' | 'doctor';
    isReadOnly?: boolean;
}

const ConsultationChat: React.FC<Props> = ({
    consultationId, consultationStatus, otherPartyName, otherPartyAvatar, userType, isReadOnly = false,
}) => {
    const { messages, isLoading, isSending, isActive, isOnline, sendMessage } =
        useConsultationChat(consultationId, consultationStatus, userType);

    const canSend = isActive && !isReadOnly;

    return (
        <div dir="rtl" className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <ChatHeader name={otherPartyName} avatar={otherPartyAvatar} isActive={isOnline} />

            {isReadOnly && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-700 dark:text-blue-300">
                    👁 وضع المراقبة — قراءة فقط
                </div>
            )}
            {!isActive && !isReadOnly && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-300">
                    🔒 انتهت الاستشارة — المحادثة مغلقة
                </div>
            )}

            <MessageList messages={messages} isLoading={isLoading} />
            <MessageInput onSend={sendMessage} isSending={isSending} disabled={!canSend} />
        </div>
    );
};

export default ConsultationChat;
