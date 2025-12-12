import { InstallationRecord, InstallType } from '../types';
import { APP_STORAGE_KEY } from '../constants';
import { getPrice } from './settingsService';

export const getRecords = (): InstallationRecord[] => {
  try {
    const data = localStorage.getItem(APP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
};

export const saveRecord = (type: InstallType, quantity: number, dateOverride?: string): InstallationRecord[] => {
  const currentRecords = getRecords();
  const newRecords: InstallationRecord[] = [];
  
  // DATE HANDLING FIX:
  // If dateOverride is provided (YYYY-MM-DD from Gemini), append T12:00:00.
  // This sets the time to Noon Local Time (effectively), avoiding the "UTC Midnight" bug
  // where converting 00:00 UTC to local time shifts the date to the previous day (e.g., Dec 9 00:00 UTC = Dec 8 19:00 EST).
  let dateObj: Date;

  if (dateOverride) {
    if (dateOverride.includes('T')) {
      dateObj = new Date(dateOverride);
    } else {
      // Create date at noon to be safe against timezone shifts
      dateObj = new Date(`${dateOverride}T12:00:00`);
    }
  } else {
    dateObj = new Date();
  }

  const dateIsoString = dateObj.toISOString();
  
  // Fetch current price for this type from settings
  const unitPrice = getPrice(type);

  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      id: crypto.randomUUID(),
      type,
      date: dateIsoString,
      amount: unitPrice,
      timestamp: dateObj.getTime() + i // Ensure slight difference for sorting
    });
  }

  const updated = [...currentRecords, ...newRecords];
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteRecord = (id: string): InstallationRecord[] => {
  const currentRecords = getRecords();
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearAllData = () => {
  localStorage.removeItem(APP_STORAGE_KEY);
};

// Backup Functions
export const exportBackupData = (): string => {
  const records = getRecords();
  return JSON.stringify(records, null, 2);
};

export const importBackupData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Basic validation: check if it looks like an array of records
      // We overwrite current data or merge? Let's overwrite for simplicity of restoration
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(parsed));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Backup import failed", e);
    return false;
  }
};