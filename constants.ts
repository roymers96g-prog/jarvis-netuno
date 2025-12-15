
import { InstallType } from './types';

export const DEFAULT_PRICES = {
  [InstallType.RESIDENTIAL]: 7,
  [InstallType.CORPORATE]: 10,
  [InstallType.POSTE]: 8,
  [InstallType.SERVICE]: 15, // Legacy/Generic
  
  // New Services
  [InstallType.SERVICE_BASIC]: 10,
  [InstallType.SERVICE_REWIRING]: 20,
  [InstallType.SERVICE_CORP]: 25,
};

export const LABELS = {
  [InstallType.RESIDENTIAL]: 'Residencial',
  [InstallType.CORPORATE]: 'Corporativo',
  [InstallType.POSTE]: 'Poste',
  [InstallType.SERVICE]: 'Servicio Gral.',
  
  [InstallType.SERVICE_BASIC]: 'Srv. Básico',
  [InstallType.SERVICE_REWIRING]: 'Recableado/Mudanza',
  [InstallType.SERVICE_CORP]: 'Srv. Corp',
};

export const COLORS = {
  [InstallType.RESIDENTIAL]: '#22d3ee', // Cyan 400
  [InstallType.CORPORATE]: '#a78bfa', // Violet 400
  [InstallType.POSTE]: '#34d399', // Emerald 400
  [InstallType.SERVICE]: '#94a3b8', // Slate 400 (Generic)
  
  [InstallType.SERVICE_BASIC]: '#fb923c', // Orange 400
  [InstallType.SERVICE_REWIRING]: '#f472b6', // Pink 400
  [InstallType.SERVICE_CORP]: '#6366f1', // Indigo 500
};

export const APP_STORAGE_KEY = 'netuno-jarvis-data-v1';
export const SETTINGS_STORAGE_KEY = 'netuno-jarvis-settings-v1';
