import { createClient } from '@supabase/supabase-js';
import { InstallationRecord, InstallType } from '../types';
import { APP_STORAGE_KEY, LABELS } from '../constants';
import { getPrice } from './settingsService';

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://mgyfqbdnpysbxvhznwrx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neWZxYmRucHlzYnh2aHpud3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTA0NTIsImV4cCI6MjA4MTIyNjQ1Mn0.PlcQtx6TL0OYtwBuzDq94wxBKOW6DUp8gJMPrZkT35o";

// Inicializar cliente
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Nombre de la tabla en Supabase
const TABLE_NAME = 'installations';

// Simulación de latencia para operaciones locales
const simulateNetwork = () => new Promise(resolve => setTimeout(resolve, 50));

export const checkBackendStatus = async (): Promise<'connected' | 'disconnected' | 'disabled'> => {
  if (!navigator.onLine) return 'disconnected';
  
  try {
    const { error } = await supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true });
    if (error) {
      console.warn("Error checking Supabase:", error.message);
      return 'disconnected';
    }
    return 'connected';
  } catch (error) {
    console.warn("Supabase connection failed:", error);
    return 'disconnected';
  }
};

export const getRecords = async (): Promise<InstallationRecord[]> => {
  // 1. CARGA LOCAL INMEDIATA
  const localStr = localStorage.getItem(APP_STORAGE_KEY);
  let localData: InstallationRecord[] = localStr ? JSON.parse(localStr) : [];

  // 2. SI ESTAMOS OFFLINE, RETORNAMOS LOCAL
  if (!navigator.onLine) {
    console.log("Modo Offline: Usando datos locales.");
    return localData;
  }

  // 3. SI ESTAMOS ONLINE, INICIAMOS SINCRONIZACIÓN INTELIGENTE
  try {
    const { data: remoteRaw, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) throw error;

    const remoteData: InstallationRecord[] = remoteRaw.map(d => ({
      id: d.id,
      type: d.type as InstallType,
      date: d.date,
      amount: Number(d.amount),
      timestamp: Number(d.timestamp)
    }));

    // B. Lógica de Fusión (Merge & Sync)
    const remoteIds = new Set(remoteData.map(r => r.id));
    const pendingUploads = localData.filter(local => !remoteIds.has(local.id));

    if (pendingUploads.length > 0) {
      console.log(`☁️ Sincronizando: Subiendo ${pendingUploads.length} registros offline a la nube...`);
      const { error: uploadError } = await supabase.from(TABLE_NAME).insert(pendingUploads);
      
      if (uploadError) {
        console.error("Error subiendo datos pendientes:", uploadError);
        return [...remoteData, ...pendingUploads].sort((a, b) => a.timestamp - b.timestamp);
      } else {
        console.log("✅ Subida completada.");
        remoteData.push(...pendingUploads);
      }
    }

    remoteData.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(remoteData));
    
    return remoteData;

  } catch (e) {
    console.warn("⚠️ Falló la sincronización con Supabase. Usando respaldo local.", e);
    return localData;
  }
};

export const saveRecord = async (type: InstallType, quantity: number, dateOverride?: string): Promise<InstallationRecord[]> => {
  let dateObj: Date;

  if (dateOverride) {
    if (dateOverride.includes('T')) {
      dateObj = new Date(dateOverride);
    } else {
      dateObj = new Date(`${dateOverride}T12:00:00`);
    }
  } else {
    dateObj = new Date();
  }

  const dateIsoString = dateObj.toISOString();
  const unitPrice = getPrice(type);
  const newRecords: InstallationRecord[] = [];

  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      id: crypto.randomUUID(),
      type,
      date: dateIsoString,
      amount: unitPrice,
      timestamp: dateObj.getTime() + i
    });
  }

  if (navigator.onLine) {
    try {
      const { error } = await supabase.from(TABLE_NAME).insert(newRecords);
      if (!error) {
        return await getRecords();
      }
      console.error("Error insertando en Supabase, guardando localmente:", error);
    } catch (err) {
      console.warn("Excepción al guardar en Supabase:", err);
    }
  }

  console.log("Guardando localmente (pendiente de sync).");
  const currentRecordsString = localStorage.getItem(APP_STORAGE_KEY);
  const currentRecords = currentRecordsString ? JSON.parse(currentRecordsString) : [];
  const updated = [...currentRecords, ...newRecords].sort((a: any, b: any) => a.timestamp - b.timestamp);
  
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  await simulateNetwork();
  
  return updated;
};

export const deleteRecord = async (id: string): Promise<InstallationRecord[]> => {
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (!error) {
        return await getRecords();
      }
      console.error("Error borrando en Supabase:", error);
    } catch (err) {
      console.warn("Excepción al borrar en Supabase:", err);
    }
  }

  console.log("Borrando localmente.");
  const currentRecordsString = localStorage.getItem(APP_STORAGE_KEY);
  const currentRecords: InstallationRecord[] = currentRecordsString ? JSON.parse(currentRecordsString) : [];
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  await simulateNetwork();

  return updated;
};

export const clearAllData = () => {
  localStorage.removeItem(APP_STORAGE_KEY);
};

export const exportBackupData = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  return data || "[]";
};

// NUEVA FUNCIÓN: Exportar a CSV para Excel
export const generateCSV = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  if (!data) return '';
  
  const records: InstallationRecord[] = JSON.parse(data);
  // Header
  let csvContent = "Fecha,Hora,Tipo,Monto,ID\n";
  
  records.forEach(r => {
    const dateObj = new Date(r.date);
    const date = dateObj.toLocaleDateString('es-ES');
    const time = dateObj.toLocaleTimeString('es-ES');
    const typeLabel = LABELS[r.type] || r.type;
    
    // Escapar comillas si fuera necesario y formatear línea
    csvContent += `${date},${time},"${typeLabel}",${r.amount},${r.id}\n`;
  });
  
  return csvContent;
};

export const importBackupData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(parsed));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Backup import failed", e);
    return false;
  }
};