
export enum InstallType {
  RESIDENTIAL = 'RESIDENTIAL',
  CORPORATE = 'CORPORATE',
  POSTE = 'POSTE',
  SERVICE = 'SERVICE',
  SERVICE_BASIC = 'SERVICE_BASIC',
  SERVICE_CORP = 'SERVICE_CORP',
  // New technical service categories
  SERVICE_REWIRING_CORP = 'SERVICE_REWIRING_CORP',
  SERVICE_REWIRING_PPAL = 'SERVICE_REWIRING_PPAL',
  SERVICE_REWIRING_AYUDANTE = 'SERVICE_REWIRING_AYUDANTE',
  SERVICE_RELOCATION = 'SERVICE_RELOCATION',
  SERVICE_REWIRING = 'SERVICE_REWIRING'
}

export type UserProfile = 'INSTALLER' | 'TECHNICIAN';

export interface InstallationRecord {
  id: string;
  userId?: string; 
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

export interface VoiceSettings {
  voiceURI: string;
  pitch: number;
  rate: number;
}

export interface AppSettings {
  nickname: string;
  profile: UserProfile; 
  apiKey: string; 
  ttsEnabled: boolean;
  theme: 'dark' | 'light';
  highContrast: boolean; // Recomendación 5: Modo Exteriores
  monthlyGoal: number;
  customPrices: {
    [key in InstallType]: number;
  };
  voiceSettings: VoiceSettings;
}

// Added ExtractedData interface to match the schema expected by Jarvis
export interface ExtractedData {
  intent: 'LOGGING' | 'QUERY' | 'GENERAL_CHAT' | 'DELETION';
  records: Array<{
    type: string;
    quantity: number;
    date?: string;
  }>;
  deletionTarget?: {
    last?: boolean;
    type?: string;
    date?: string;
  };
  jarvisResponse: string;
}
