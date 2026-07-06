import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatWindow from '../ChatWindow';
import { useAuthChatbot, usePublicChatbot, useWidgetChatbot } from '../../../hooks/useChatbot';
import '@testing-library/jest-dom';

// Mocks
vi.mock('../../../hooks/useChatbot', () => ({
 useAuthChatbot: vi.fn(),
 usePublicChatbot: vi.fn(),
 useWidgetChatbot: vi.fn(),
}));

describe('ChatWindow', () => {
 const defaultPublicProps = {
 messages: [],
 isLoading: false,
 sendMessage: vi.fn(),
 clearChat: vi.fn(),
 };

 const defaultAuthProps = {
 messages: [],
 isLoading: false,
 sessions: [],
 config: { name: 'وداد', welcome_message: 'مرحباً بكِ', suggested_questions: ['ما هي أعراض الحمل؟'] },
 activeBotType: 'pregnancy',
 currentSessionId: null,
 sendMessage: vi.fn(),
 newConversation: vi.fn(),
 loadSession: vi.fn(),
 renameSession: vi.fn(),
 deleteSession: vi.fn(),
 resetChat: vi.fn(),
 isSessionActionLoading: false,
 isConfigLoading: false,
 };

 beforeEach(() => {
 vi.clearAllMocks();
 (usePublicChatbot as any).mockReturnValue(defaultPublicProps);
 (useAuthChatbot as any).mockReturnValue(defaultAuthProps);
 (useWidgetChatbot as any).mockReturnValue(defaultPublicProps);
 });

 it('T13-01 renders welcome screen with suggested questions when no messages exist', () => {
 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 
 expect(screen.getByText('مرحباً بكِ')).toBeInTheDocument();
 expect(screen.getByText('ما هي أعراض الحمل؟')).toBeInTheDocument();
 });

 it('T13-02 renders message list when messages exist', () => {
 (useAuthChatbot as any).mockReturnValue({
 ...defaultAuthProps,
 messages: [{ role: 'user', message: 'سؤالي هنا' }]
 });

 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 expect(screen.getByText('سؤالي هنا')).toBeInTheDocument();
 });

 it('T13-03 Sidebar is visible in full-page authenticated mode', () => {
 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 expect(screen.getByText('محادثة جديدة')).toBeInTheDocument();
 });

 it('T13-04 Sidebar is hidden in widget mode', () => {
 render(<ChatWindow isAuthenticated={true} isFullPage={false} onClose={vi.fn()} />);
 expect(screen.queryByText('محادثة جديدة')).not.toBeInTheDocument();
 });

 it('T13-05 clicking a session in Sidebar calls loadSession', () => {
 const loadSessionMock = vi.fn();
 (useAuthChatbot as any).mockReturnValue({
 ...defaultAuthProps,
 sessions: [{ session_id: 's1', title: 'جلسة ١' }],
 loadSession: loadSessionMock,
 });

 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 
 const sessionItem = screen.getByText('جلسة ١');
 fireEvent.click(sessionItem);
 
 expect(loadSessionMock).toHaveBeenCalledWith('s1');
 });

 it('T13-06 clicking"محادثة جديدة"button calls newConversation', () => {
 const newConversationMock = vi.fn();
 (useAuthChatbot as any).mockReturnValue({
 ...defaultAuthProps,
 newConversation: newConversationMock,
 });

 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 
 const newBtn = screen.getByText('محادثة جديدة');
 fireEvent.click(newBtn);
 
 expect(newConversationMock).toHaveBeenCalled();
 });

 it('T13-07 empty state message is shown when sessions list is empty', () => {
 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 expect(screen.getByText(/لا توجد محادثات/i)).toBeInTheDocument();
 });

 it('T13-08 send button is disabled while isLoading=true', () => {
 (useAuthChatbot as any).mockReturnValue({
 ...defaultAuthProps,
 isLoading: true,
 });

 render(<ChatWindow isAuthenticated={true} isFullPage={true} onClose={vi.fn()} />);
 
 const sendBtn = screen.getByRole('button', { name: /إرسال/i });
 expect(sendBtn).toBeDisabled();
 });

 it('T13-09 medical disclaimer is always visible', () => {
 render(<ChatWindow isAuthenticated={false} onClose={vi.fn()} />);
 expect(screen.getByText(/لا يعتبر بديلاً عن الاستشارة الطبية/i)).toBeInTheDocument();
 });

 it('T13-10 emergency card shows when message contains emergency keywords', () => {
 (usePublicChatbot as any).mockReturnValue({
 ...defaultPublicProps,
 messages: [{ role: 'user', message: 'أعاني من نزيف شديد' }]
 });

 render(<ChatWindow isAuthenticated={false} onClose={vi.fn()} />);
 expect(screen.getByText(/إشعار طارئ/i)).toBeInTheDocument();
 });
});
