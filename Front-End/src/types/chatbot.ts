export type BotType = "public" | "pre_marriage" | "pregnancy" | "motherhood";

export interface ChatMessage {
  id: number | string;
  role: "user" | "assistant";
  message: string;
  bot_type: BotType;
  created_at: string;
  isLoading?: boolean;
}

export interface ChatSession {
  session_id: string;
  title?: string;
  bot_type: BotType;
  started_at: string;
  last_message_at: string;
  messages_count: number;
}

export interface ChatConfig {
  bot_type: BotType;
  name: string;
  welcome_message: string;
  suggested_questions: string[];
  has_life_stage?: boolean;
}

export interface SendMessagePayload {
  message: string;
  session_id?: string;
  bot_type?: BotType;
  force_new_session?: boolean;
}

export interface SendMessageResponse {
  status: "processing" | "ready" | "failed";
  session_id: string;
  bot_type: BotType;
  message_id: number;
  user_message: ChatMessage;
}

export interface MessageStatusResponse {
  status: "processing" | "ready" | "failed";
  reply?: ChatMessage;
  message?: string;
}

export interface PublicMessageResponse {
  reply: string;
  bot_type: "public";
  cached: boolean;
}

// === Patient Data Preferences ===

export interface ChatbotPreferences {
  data_access_enabled: boolean;
  share_predictions: boolean;
  share_trackers: boolean;
  share_medical_file: boolean;
  share_consultations: boolean;
  updated_at?: string;
}
