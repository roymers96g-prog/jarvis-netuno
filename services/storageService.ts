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
  const date = dateOverride ? new Date(dateOverride).toISOString() : new Date().toISOString();
  
  // Fetch current price for this type from settings
  const unitPrice = getPrice(type);

  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      id: crypto.randomUUID(),
      type,
      date: date,
      amount: unitPrice,
      timestamp: Date.now() + i 
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