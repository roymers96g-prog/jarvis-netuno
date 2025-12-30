
import { AppSettings, InstallType } from '../types';
import { DEFAULT_PRICES, SETTINGS_STORAGE_KEY } from '../constants';

const USER_ID_KEY = 'netuno_device_user_id';

const DEFAULT_SETTINGS: AppSettings = {
  nickname: '', 
  profile: 'INSTALLER', 
  apiKey: '',   
  ttsEnabled: true,
  theme: 'dark',
  highContrast: false, // Recomendación 5: Modo exteriores
  monthlyGoal: 0,
  customPrices: { ...DEFAULT_PRICES },
  voiceSettings: {
    voiceURI: '', 
    pitch: 0.8, 
    rate: 1.1   
  }
};

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

// Use process.env.API_KEY as the primary source of truth
export const getEffectiveApiKey = (): string => {
  if (process.env.API_KEY && process.env.API_KEY.length > 10) {
    return process.env.API_KEY.trim();
  }
  
  const settings = getSettings();
  if (settings.apiKey && settings.apiKey.trim().length > 10) {
    return settings.apiKey.trim();
  }
  
  return (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
};
