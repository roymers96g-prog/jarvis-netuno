import { AppSettings, InstallType } from '../types';
import { DEFAULT_PRICES, SETTINGS_STORAGE_KEY } from '../constants';

const DEFAULT_SETTINGS: AppSettings = {
  nickname: '', // Empty by default forces the user to set it
  ttsEnabled: true,
  theme: 'dark',
  customPrices: { ...DEFAULT_PRICES },
  voiceSettings: {
    voiceURI: '', // Auto-select logic will handle empty string
    pitch: 0.8, // Deep tone (Crucial for Jarvis)
    rate: 1.1   // Efficient speed (Crucial for AI feel)
  }
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    
    // Robust merge to ensure nested objects like voiceSettings exist
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