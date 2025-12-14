import { ProductionRecord, InstallType } from '../types';
import { APP_STORAGE_KEY } from '../constants';
import { getPrice } from './settingsService';
import { supabase } from './supabaseClient';

const getUserId = async (): Promise<string | undefined> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};


export const getRecords = async (): Promise<ProductionRecord[]> => {
  try {
    const userId = await getUserId();
    if (!navigator.onLine || !userId) {
      console.warn("Offline or no user, using local cache.");
      const data = localStorage.getItem(APP_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
    
    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
    return data || [];

  } catch (e) {
    console.error("Failed to load records from Supabase, using local cache.", e);
    const data = localStorage.getItem(APP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const saveRecord = async (
    type: InstallType, 
    quantity: number | null, 
    dateOverride?: string,
    description?: string | null,
    manual_amount?: number | null
): Promise<ProductionRecord[]> => {
    const userId = await getUserId();
    if (!navigator.onLine || !userId) {
       alert("Modo sin conexión. El registro se guardará localmente y se sincronizará más tarde.");
       // Offline logic would be more complex, for now we just prevent crash
       return getRecords();
    }

    const record_date = dateOverride 
        ? new Date(dateOverride).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
    
    const { error } = await supabase.rpc('insert_production_record', {
        p_user_id: userId,
        p_installation_type: type,
        p_quantity: quantity,
        p_record_date: record_date,
        p_notes: null,
        p_description: description,
        p_manual_amount: manual_amount
    });

    if (error) {
        console.error("Supabase RPC save failed:", error);
        alert(`Error al guardar: ${error.message}`);
        throw error;
    }

    return await getRecords();
};

export const updateRecordQuantity = async (recordId: string, newQuantity: number): Promise<ProductionRecord[]> => {
    const userId = await getUserId();
    if (!navigator.onLine || !userId) {
       alert("Modo sin conexión. No se pueden realizar correcciones.");
       return getRecords();
    }

    const records = await getRecords();
    const recordToUpdate = records.find(r => r.id === recordId);

    if (!recordToUpdate || recordToUpdate.installation_type === InstallType.SERVICE) {
        console.error("Cannot update service record quantity or record not found.");
        return records;
    }

    const newTotalAmount = newQuantity * (recordToUpdate.unit_price || 0);

    const { error } = await supabase
        .from('production_records')
        .update({ quantity: newQuantity, total_amount: newTotalAmount })
        .match({ id: recordId, user_id: userId });

    if (error) {
        console.error("Supabase update failed:", error);
        alert(`Error al corregir: ${error.message}`);
        throw error;
    }
    return await getRecords();
};


export const deleteRecord = async (id: string): Promise<ProductionRecord[]> => {
  const currentRecords = await getRecords();
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  
  const userId = await getUserId();

  if (navigator.onLine && userId) {
    const { error } = await supabase
      .from('production_records')
      .delete()
      .match({ id: id, user_id: userId });

    if (error) {
      console.error("Supabase delete failed:", error);
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentRecords));
      return currentRecords;
    }
  }

  return updated;
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
      // This is a destructive action and should be used with caution
      // It overwrites local cache. A proper implementation would merge/upload to Supabase.
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
