
import { InstallType } from './types';

export const DEFAULT_PRICES = {
  [InstallType.RESIDENTIAL]: 7,
  [InstallType.CORPORATE]: 10,
  [InstallType.POSTE]: 8,
  [InstallType.SERVICE]: 15,
  [InstallType.SERVICE_BASIC]: 10,
  [InstallType.SERVICE_CORP]: 25,
  
  // New categories with $0 default price
  [InstallType.SERVICE_REWIRING_CORP]: 0,
  [InstallType.SERVICE_REWIRING_PPAL]: 0,
  [InstallType.SERVICE_REWIRING_AYUDANTE]: 0,
  [InstallType.SERVICE_RELOCATION]: 0,
  [InstallType.SERVICE_REWIRING]: 0,
};

export const LABELS = {
  [InstallType.RESIDENTIAL]: 'Residencial',
  [InstallType.CORPORATE]: 'Corporativo',
  [InstallType.POSTE]: 'Poste',
  [InstallType.SERVICE]: 'Servicio Gral.',
  [InstallType.SERVICE_BASIC]: 'Srv. Básico',
  [InstallType.SERVICE_CORP]: 'Srv. Corp',
  
  [InstallType.SERVICE_REWIRING_CORP]: 'Recableado Corporativo',
  [InstallType.SERVICE_REWIRING_PPAL]: 'Recableado Principal',
  [InstallType.SERVICE_REWIRING_AYUDANTE]: 'Recableado Ayudante',
  [InstallType.SERVICE_RELOCATION]: 'Mudanza',
  [InstallType.SERVICE_REWIRING]: 'Recableado',
};

export const COLORS = {
  [InstallType.RESIDENTIAL]: '#22d3ee', 
  [InstallType.CORPORATE]: '#a78bfa', 
  [InstallType.POSTE]: '#34d399', 
  [InstallType.SERVICE]: '#94a3b8', 
  [InstallType.SERVICE_BASIC]: '#fb923c', 
  [InstallType.SERVICE_CORP]: '#6366f1', 
  
  [InstallType.SERVICE_REWIRING_CORP]: '#4338ca', 
  [InstallType.SERVICE_REWIRING_PPAL]: '#be185d', 
  [InstallType.SERVICE_REWIRING_AYUDANTE]: '#0ea5e9', 
  [InstallType.SERVICE_RELOCATION]: '#8b5cf6', 
  [InstallType.SERVICE_REWIRING]: '#f472b6', 
};

export const APP_STORAGE_KEY = 'netuno-jarvis-data-v1';
export const SETTINGS_STORAGE_KEY = 'netuno-jarvis-settings-v1';
