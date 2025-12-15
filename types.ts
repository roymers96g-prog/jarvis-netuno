
export enum InstallType {
  RESIDENTIAL = 'RESIDENTIAL',
  CORPORATE = 'CORPORATE',
  POSTE = 'POSTE',
  // Legacy Service (kept for backward compatibility or generic use)
  SERVICE = 'SERVICE',
  // New Technical Service Types
  SERVICE_BASIC = 'SERVICE_BASIC',
  SERVICE_REWIRING = 'SERVICE_REWIRING',
  SERVICE_CORP = 'SERVICE_CORP'
}

export type UserProfile = 'INSTALLER' | 'TECHNICIAN';

export interface InstallationRecord {
  id: string;
  userId?: string; // Nuevo campo para aislar datos por usuario
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
  intent: 'LOGGING' | 'QUERY' | 'GENERAL_CHAT';
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
  profile: UserProfile; // New field for app mode
  apiKey: string; 
  ttsEnabled: boolean;
  theme: 'dark' | 'light';
  monthlyGoal: number;
  customPrices: {
    [key in InstallType]: number;
  };
  voiceSettings: VoiceSettings;
}
