import { AppSettings, InstallType } from '../types';
import { DEFAULT_PRICES, SETTINGS_STORAGE_KEY } from '../constants';

const DEFAULT_SETTINGS: AppSettings = {
  ttsEnabled: true,
  theme: 'dark',
  customPrices: { ...DEFAULT_PRICES }
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    // Merge logic ensures new settings fields are handled gracefully in future updates
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customPrices: { ...DEFAULT_SETTINGS.customPrices, ...(parsed.customPrices || {}) }
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