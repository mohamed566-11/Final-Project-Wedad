export interface ChatMessage {
    id: number;
    consultation_id: number;
    sender_type: 'patient' | 'doctor';
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    message: string | null;
    image_url: string | null;
    message_type: 'text' | 'image' | 'text_image';
    is_delivered: boolean;
    delivered_at: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    is_mine: boolean;
}

export interface SendMessagePayload {
    message?: string;
    image?: File;
}
