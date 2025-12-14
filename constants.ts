import { InstallType } from './types';

export const DEFAULT_PRICES = {
  [InstallType.RESIDENTIAL]: 7,
  [InstallType.CORPORATE]: 10,
  [InstallType.POSTE]: 8,
  [InstallType.SERVICE]: 15,
};

export const LABELS = {
  [InstallType.RESIDENTIAL]: 'Residencial',
  [InstallType.CORPORATE]: 'Corporativo',
  [InstallType.POSTE]: 'Poste',
  [InstallType.SERVICE]: 'Servicio Técnico',
};

export const COLORS = {
  [InstallType.RESIDENTIAL]: '#22d3ee', // Cyan 400
  [InstallType.CORPORATE]: '#a78bfa', // Violet 400
  [InstallType.POSTE]: '#34d399', // Emerald 400
  [InstallType.SERVICE]: '#f59e0b', // Amber 500
};

export const APP_STORAGE_KEY = 'netuno-jarvis-data-v1';
export const SETTINGS_STORAGE_KEY = 'netuno-jarvis-settings-v1';