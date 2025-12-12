export enum InstallType {
  RESIDENTIAL = 'RESIDENTIAL',
  CORPORATE = 'CORPORATE',
  POSTE = 'POSTE'
}

export interface InstallationRecord {
  id: string;
  type: InstallType;
  date: string; // ISO String
  amount: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  isProcessing?: boolean;
}

export interface ProductionStats {
  totalEarnings: number;
  countResidential: number;
  countCorporate: number;
  countPoste: number;
}

// Gemini Response Schema Structure
export interface ExtractedData {
  records: Array<{
    type: string; // Will map to InstallType
    quantity: number;
    date?: string; // Optional override, defaults to today
  }>;
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
  customPrices: {
    [key in InstallType]: number;
  };
  voiceSettings: VoiceSettings;
}