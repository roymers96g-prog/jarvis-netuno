
import { AppSettings, InstallType } from '../types';
import { DEFAULT_PRICES, SETTINGS_STORAGE_KEY } from '../constants';

// Declare process for TS
declare var process: any;

const USER_ID_KEY = 'netuno_device_user_id';

const DEFAULT_SETTINGS: AppSettings = {
  nickname: '', 
  profile: 'INSTALLER', // Default profile
  apiKey: '',   
  ttsEnabled: true,
  theme: 'dark',
  monthlyGoal: 0,
  customPrices: { ...DEFAULT_PRICES },
  voiceSettings: {
    voiceURI: '', 
    pitch: 0.8, 
    rate: 1.1   
  }
};

// Genera o recupera un ID único para este usuario/dispositivo
// Esto permite filtrar los datos en Supabase para que no se mezclen con otros usuarios
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    
    // Robust merge to ensure nested objects like voiceSettings and customPrices exist
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customPrices: { ...DEFAULT_SETTINGS.customPrices, ...(parsed.customPrices || {}) },
      voiceSettings: { ...DEFAULT_SETTINGS.voiceSettings, ...(parsed.voiceSettings || {}) }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const getPrice = (type: InstallType): number => {
  const settings = getSettings();
  return settings.customPrices[type] ?? DEFAULT_PRICES[type];
};

export const getAllPrices = () => {
  return getSettings().customPrices;
};

// Helper to get effective key (User Setting > Environment Variable)
export const getEffectiveApiKey = (): string => {
  const settings = getSettings();
  if (settings.apiKey && settings.apiKey.trim().length > 0) {
    return settings.apiKey.trim();
  }
  return process.env.API_KEY || '';
};
