import { InstallationRecord, InstallType } from '../types';
import { APP_STORAGE_KEY } from '../constants';
import { getPrice } from './settingsService';
import { supabase } from './supabaseClient';

const getUserId = async (): Promise<string | undefined> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};


export const getRecords = async (): Promise<InstallationRecord[]> => {
  try {
    const userId = await getUserId();
    // If offline or no user, fall back to local cache
    if (!navigator.onLine || !userId) {
      console.warn("Offline or no user, using local cache.");
      const data = localStorage.getItem(APP_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
    
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Update local cache with fresh data
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
    return data || [];

  } catch (e) {
    console.error("Failed to load records from Supabase, using local cache.", e);
    const data = localStorage.getItem(APP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const saveRecord = async (type: InstallType, quantity: number, dateOverride?: string): Promise<InstallationRecord[]> => {
  let dateObj: Date;
  if (dateOverride) {
    dateObj = dateOverride.includes('T') ? new Date(dateOverride) : new Date(`${dateOverride}T12:00:00`);
  } else {
    dateObj = new Date();
  }

  const dateIsoString = dateObj.toISOString();
  const unitPrice = getPrice(type);
  const userId = await getUserId();

  const newRecords: Omit<InstallationRecord, 'id' | 'timestamp'>[] = [];
  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      user_id: userId,
      type,
      date: dateIsoString,
      amount: unitPrice,
    });
  }

  // Optimistic UI update: add to local storage first
  const currentRecords = await getRecords();
  const tempRecords: InstallationRecord[] = newRecords.map((r, i) => ({
    ...r,
    id: `temp-${crypto.randomUUID()}`,
    timestamp: dateObj.getTime() + i
  }));
  const updated = [...currentRecords, ...tempRecords];
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));

  // Then try to save to Supabase
  if (navigator.onLine && userId) {
     const { error } = await supabase.from('records').insert(newRecords);
     if (error) {
       console.error("Supabase save failed:", error);
       // Here you could implement a more robust offline queue
       return updated; // Return optimistic update
     }
     // Re-fetch from server to get real IDs and confirm
     return await getRecords();
  }
  
  return updated; // Return optimistic update if offline
};

export const deleteRecord = async (id: string): Promise<InstallationRecord[]> => {
  // Optimistic UI update
  const currentRecords = await getRecords();
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  
  const userId = await getUserId();
  // If record was temporary, no need to call DB
  if (id.startsWith('temp-')) {
    return updated;
  }

  // Then try to delete from Supabase
  if (navigator.onLine && userId) {
    const { error } = await supabase
      .from('records')
      .delete()
      .match({ id: id, user_id: userId });

    if (error) {
      console.error("Supabase delete failed:", error);
      // Revert local state if DB call fails
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentRecords));
      return currentRecords;
    }
  }

  return updated;
};

export const clearAllData = () => {
  localStorage.removeItem(APP_STORAGE_KEY);
};

// Backup Functions (These remain local for user-controlled backups)
export const exportBackupData = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  return data || "[]";
};

export const importBackupData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Here you would ideally upload this to supabase
      // For now, it just overwrites local
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(parsed));
      console.warn("Backup imported locally. Sync with Supabase on next connection.");
      return true;
    }
    return false;
  } catch (e) {
    console.error("Backup import failed", e);
    return false;
  }
};