export enum InstallType {
  RESIDENTIAL = 'residencial',
  CORPORATE = 'corporativo',
  POSTE = 'poste',
  SERVICE = 'servicio_tecnico'
}

export interface ProductionRecord {
  id: string;
  user_id: string;
  installation_type: InstallType;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number;
  record_date: string; // ISO String from DB
  created_at: string; // from DB
  notes: string | null;
  description: string | null;
  manual_amount: number | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  isProcessing?: boolean;
}

// Gemini Response Schema Structure
export interface ExtractedData {
  intent: 'LOGGING' | 'QUERY' | 'CORRECTION' | 'GENERAL_CHAT';
  records: Array<{
    type: InstallType;
    quantity?: number;
    date?: string; // Optional override, defaults to today
    description?: string;
    manual_amount?: number;
  }>;
  correction?: {
    new_quantity: number;
  };
  jarvisResponse: string;
}

export interface VoiceSettings {
  voiceURI: string;
  pitch: number;
  rate: number;
}

export interface AppSettings {
  nickname: string;
  apiKey: string; // Manual API Key override
  ttsEnabled: boolean;
  theme: 'dark' | 'light';
  monthlyGoal: number;
  customPrices: {
    [key in InstallType]: number;
  };
  voiceSettings: VoiceSettings;
}
