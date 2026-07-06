import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import MessageBubble, { clearImageBlobCache, flushImageBlobCache, IMAGE_BLOB_CACHE } from '../MessageBubble';
import type { ChatMessage } from '@/types/chat';

// ── Mock chatService ────────────────────────────────────────────────────────
vi.mock('@/services/chatService', () => ({
    chatService: {
        downloadImage: vi.fn(),
    },
}));

// ── Stub browser APIs that jsdom doesn't implement ──────────────────────────
const FAKE_BLOB_URL = 'blob:http://localhost/fake-image-uuid';
const FAKE_BLOB = new Blob(['fake image bytes'], { type: 'image/jpeg' });

let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
    return {
        id: 42,
        consultation_id: 7,
        sender_type: 'patient',
        sender_id: 1,
        sender_name: 'مريضة',
        sender_avatar: null,
        message: null,
        image_url: 'http://api.test/api/v1/patient/consultations/7/chat/messages/42/download',
        message_type: 'image',
        is_delivered: true,
        delivered_at: new Date().toISOString(),
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        is_mine: true,
        ...overrides,
    };
}

// ── Setup / Teardown ────────────────────────────────────────────────────────
beforeEach(async () => {
    vi.clearAllMocks();
    // Clear the module-level cache before every test
    clearImageBlobCache();

    // Spy on URL APIs
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(FAKE_BLOB_URL);
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Import fresh mock and configure it
    const { chatService } = await import('@/services/chatService');
    (chatService.downloadImage as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: FAKE_BLOB,
    });
});

afterEach(() => {
    vi.clearAllMocks();
    clearImageBlobCache();
});

// ── Tests ───────────────────────────────────────────────────────────────────
describe('MessageBubble — IMAGE_BLOB_CACHE и revokeObjectURL behaviour', () => {

    it('T-BUBBLE-01: loads image once, no revoke on unmount, cache serves remount', async () => {
        const { chatService } = await import('@/services/chatService');
        const message = makeMessage();

        // ── 3. First render ──────────────────────────────────────────────
        const { unmount, rerender } = render(<MessageBubble message={message} />);

        // Wait for the async downloadImage to resolve and blob url to be set
        await waitFor(() => {
            expect(chatService.downloadImage).toHaveBeenCalledTimes(1);
        });
        expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
        expect(createObjectURLSpy).toHaveBeenCalledWith(FAKE_BLOB);

        // ── 4. Unmount ───────────────────────────────────────────────────
        unmount();

        // ── 5. revokeObjectURL must NOT have been called after unmount ───
        expect(revokeObjectURLSpy).not.toHaveBeenCalled();

        // ── 6. Remount with same message.id → cache hit, no new download ─
        const { unmount: unmount2 } = render(<MessageBubble message={message} />);

        // Give React a tick to settle effects
        await waitFor(() => {
            // downloadImage must still be exactly 1 (not 2) — served from cache
            expect(chatService.downloadImage).toHaveBeenCalledTimes(1);
        });

        // createObjectURL also stays at 1 — no new blob created
        expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

        // revokeObjectURL still never called
        expect(revokeObjectURLSpy).not.toHaveBeenCalled();

        unmount2();
    });

    it('T-BUBBLE-02: different message.id triggers a separate download', async () => {
        const { chatService } = await import('@/services/chatService');
        const msg1 = makeMessage({ id: 42 });
        const msg2 = makeMessage({ id: 99 });

        // Render first message
        const { unmount: u1 } = render(<MessageBubble message={msg1} />);
        await waitFor(() => expect(chatService.downloadImage).toHaveBeenCalledTimes(1));
        u1();

        // Render second message — different id → must fetch again
        const { unmount: u2 } = render(<MessageBubble message={msg2} />);
        await waitFor(() => expect(chatService.downloadImage).toHaveBeenCalledTimes(2));
        expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
        expect(revokeObjectURLSpy).not.toHaveBeenCalled();
        u2();
    });

    it('T-BUBBLE-03: flushImageBlobCache revokes all cached blob URLs', async () => {
        const { chatService } = await import('@/services/chatService');
        // Each call returns a distinct blob URL
        createObjectURLSpy
            .mockReturnValueOnce('blob:http://localhost/img-t3-42')
            .mockReturnValueOnce('blob:http://localhost/img-t3-99');
        (chatService.downloadImage as ReturnType<typeof vi.fn>).mockResolvedValue({ data: FAKE_BLOB });

        const msg1 = makeMessage({ id: 42 });
        const msg2 = makeMessage({ id: 99 });

        const { unmount: u1 } = render(<MessageBubble message={msg1} />);
        await waitFor(() => expect(chatService.downloadImage).toHaveBeenCalledTimes(1));
        u1();

        const { unmount: u2 } = render(<MessageBubble message={msg2} />);
        await waitFor(() => expect(chatService.downloadImage).toHaveBeenCalledTimes(2));
        u2();

        // Verify both blobs are in cache before flush
        expect(IMAGE_BLOB_CACHE.get(42)).toBe('blob:http://localhost/img-t3-42');
        expect(IMAGE_BLOB_CACHE.get(99)).toBe('blob:http://localhost/img-t3-99');

        // revokeObjectURL must NOT have been called yet
        expect(revokeObjectURLSpy).not.toHaveBeenCalled();

        // Call flush directly (same path as beforeunload in production)
        flushImageBlobCache();

        // Both cached blobs revoked exactly once
        expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/img-t3-42');
        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/img-t3-99');

        // Cache must be empty after flush
        expect(IMAGE_BLOB_CACHE.size).toBe(0);
    });
});
