import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConsultationChat } from '../useConsultationChat';
import { chatService } from '@/services/chatService';

vi.mock('@/services/chatService', () => ({
  chatService: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  }
}));

describe('useConsultationChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T-CHAT-01: stops polling when consultation is completed', async () => {
    (chatService.getMessages as any).mockResolvedValue({ data: { data: [] } });
    
    // Status 'completed' is not in ACTIVE array
    const { result, unmount } = renderHook(() => useConsultationChat(1, 'completed', 'patient'));
    
    // Fast forward enough for an interval if it were active
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    // Initial load happens once, but interval shouldn't call it again
    expect(chatService.getMessages).toHaveBeenCalledTimes(1);
    
    unmount();
  });

  it('T-CHAT-02: rolls back optimistic message when sending fails', async () => {
    (chatService.getMessages as any).mockResolvedValue({ data: { data: [] } });
    const { result } = renderHook(() => useConsultationChat(1, 'confirmed', 'patient'));

    // Wait for initial fetch
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Mock API failure for sending
    (chatService.sendMessage as any).mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      await result.current.sendMessage({ message: 'Hello' });
    });

    // The message should be rolled back and not exist in the messages array
    expect(result.current.messages).toHaveLength(0);
  });
});
