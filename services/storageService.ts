
import { createClient } from '@supabase/supabase-js';
import { InstallationRecord, InstallType } from '../types';
import { APP_STORAGE_KEY, LABELS } from '../constants';
import { getPrice, getUserId } from './settingsService';

// CONFIGURACIÓN SUPABASE
const getEnv = (key: string) => {
  try {
    return (import.meta as any).env?.[key] || "";
  } catch (e) {
    return "";
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Inicializar cliente
const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_KEY || 'placeholder');

const TABLE_NAME = 'installations';
const DELETED_QUEUE_KEY = 'netuno_deleted_queue_v1';

// Simulación de latencia para operaciones locales
const simulateNetwork = () => new Promise(resolve => setTimeout(resolve, 50));

// --- HELPERS PARA COLA DE BORRADO OFFLINE ---
const getDeletedQueue = (): string[] => {
  const q = localStorage.getItem(DELETED_QUEUE_KEY);
  return q ? JSON.parse(q) : [];
};

const addToDeletedQueue = (id: string) => {
  const q = getDeletedQueue();
  if (!q.includes(id)) {
    q.push(id);
    localStorage.setItem(DELETED_QUEUE_KEY, JSON.stringify(q));
  }
};

const clearFromDeletedQueue = (ids: string[]) => {
  let q = getDeletedQueue();
  q = q.filter(id => !ids.includes(id));
  localStorage.setItem(DELETED_QUEUE_KEY, JSON.stringify(q));
};
// ---------------------------------------------

export const checkBackendStatus = async (): Promise<'connected' | 'disconnected' | 'disabled'> => {
  if (!navigator.onLine) return 'disconnected';
  if (!SUPABASE_URL || !SUPABASE_KEY) return 'disabled';
  
  try {
    // Check connection simple
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
  // 1. CARGA LOCAL (Fuente de verdad inmediata)
  const localStr = localStorage.getItem(APP_STORAGE_KEY);
  let localData: InstallationRecord[] = localStr ? JSON.parse(localStr) : [];
  const currentUserId = getUserId();

  // Si no hay internet, devolvemos local filtrado por usuario (por seguridad, aunque local storage es privado del dispositivo)
  if (!navigator.onLine) {
    console.log("Modo Offline: Usando datos locales.");
    return localData;
  }

  // 2. SINCRONIZACIÓN ONLINE
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase credentials missing");

    // A. Procesar Cola de Borrado (Delete Queue) antes de sincronizar
    const deletedQueue = getDeletedQueue();
    if (deletedQueue.length > 0) {
      console.log(`🗑️ Procesando ${deletedQueue.length} borrados pendientes...`);
      const { error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .in('id', deletedQueue)
        .eq('user_id', currentUserId); // Seguridad extra

      if (!deleteError) {
        clearFromDeletedQueue(deletedQueue);
      } else {
        console.error("Error procesando borrados offline:", deleteError);
      }
    }

    // B. Obtener datos remotos SOLO de este usuario
    const { data: remoteRaw, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', currentUserId) // IMPORTANTE: Aislamiento de datos
      .order('timestamp', { ascending: true });

    if (error) throw error;

    const remoteData: InstallationRecord[] = remoteRaw.map(d => ({
      id: d.id,
      userId: d.user_id,
      type: d.type as InstallType,
      date: d.date,
      amount: Number(d.amount),
      timestamp: Number(d.timestamp)
    }));

    // C. Lógica de Fusión (Merge Strategy: Last Write Wins / Union)
    const remoteMap = new Map(remoteData.map(r => [r.id, r]));
    const localMap = new Map(localData.map(r => [r.id, r]));
    const pendingUploads: InstallationRecord[] = [];
    
    // Crear lista unificada
    const mergedMap = new Map<string, InstallationRecord>();

    // 1. Prioridad Remota (Server Authority) para existencia, pero Local para updates recientes si hay conflicto
    // En este caso simple, asumiremos que si está en remoto, es válido.
    // Si está en local y NO en remoto: ¿Es nuevo o fue borrado en remoto?
    // Asumiremos que es NUEVO si no está en la cola de borrados.

    // Agregar todo lo remoto al mapa fusionado
    remoteData.forEach(r => mergedMap.set(r.id, r));

    // Revisar lo local
    localData.forEach(localRecord => {
      if (mergedMap.has(localRecord.id)) {
        // Conflicto: existe en ambos. 
        // Normalmente gana el que tenga timestamp mayor, o server.
        // Aquí dejamos server por consistencia, a menos que local sea más nuevo (lógica futura).
      } else {
        // Existe en local, NO en remoto.
        // Verificamos que no haya sido borrado recientemente
        if (!deletedQueue.includes(localRecord.id)) {
           // Es un registro nuevo creado offline -> Subir
           pendingUploads.push(localRecord);
           mergedMap.set(localRecord.id, localRecord);
        }
      }
    });

    // D. Subir nuevos registros locales a la nube
    if (pendingUploads.length > 0) {
      console.log(`☁️ Subiendo ${pendingUploads.length} registros nuevos...`);
      // Adaptar snake_case para Supabase
      const dbPayload = pendingUploads.map(r => ({
        id: r.id,
        user_id: currentUserId,
        type: r.type,
        date: r.date,
        amount: r.amount,
        timestamp: r.timestamp
      }));

      const { error: uploadError } = await supabase.from(TABLE_NAME).insert(dbPayload);
      if (uploadError) console.error("Error subiendo datos:", uploadError);
    }

    // Convertir mapa a array y guardar
    const finalRecords = Array.from(mergedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(finalRecords));
    
    return finalRecords;

  } catch (e) {
    console.warn("⚠️ Falló la sincronización. Usando respaldo local.", e);
    return localData;
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
  const currentUserId = getUserId();
  const newRecords: InstallationRecord[] = [];

  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      id: crypto.randomUUID(),
      userId: currentUserId,
      type,
      date: dateIsoString,
      amount: unitPrice,
      timestamp: dateObj.getTime() + i
    });
  }

  // 1. Guardado Optimista Local
  const currentRecordsString = localStorage.getItem(APP_STORAGE_KEY);
  const currentRecords = currentRecordsString ? JSON.parse(currentRecordsString) : [];
  const updated = [...currentRecords, ...newRecords].sort((a: any, b: any) => a.timestamp - b.timestamp);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));

  // 2. Intento de subida a Supabase
  if (navigator.onLine && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const dbPayload = newRecords.map(r => ({
        id: r.id,
        user_id: currentUserId,
        type: r.type,
        date: r.date,
        amount: r.amount,
        timestamp: r.timestamp
      }));

      const { error } = await supabase.from(TABLE_NAME).insert(dbPayload);
      if (error) console.error("Error Supabase:", error);
    } catch (err) {
      console.warn("Error de red al guardar:", err);
    }
  }

  await simulateNetwork();
  return updated;
};

export const deleteRecord = async (id: string): Promise<InstallationRecord[]> => {
  const currentUserId = getUserId();
  
  // 1. Borrado Optimista Local
  const currentRecordsString = localStorage.getItem(APP_STORAGE_KEY);
  const currentRecords: InstallationRecord[] = currentRecordsString ? JSON.parse(currentRecordsString) : [];
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));

  // 2. Manejo de Backend
  if (navigator.onLine && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId); // Solo borrar si pertenece al usuario

      if (error) {
        // Si falla (ej: timeout), agregamos a la cola offline
        addToDeletedQueue(id);
        console.error("Error borrando en Supabase, encolado:", error);
      }
    } catch (err) {
      addToDeletedQueue(id);
    }
  } else {
    // Si estamos offline, a la cola
    addToDeletedQueue(id);
  }

  await simulateNetwork();
  return updated;
};

// Función para resetear TODOS los datos del usuario actual (Nube + Local)
export const wipeUserData = async (): Promise<boolean> => {
  const currentUserId = getUserId();
  
  // 1. Intentar borrar en la nube si hay conexión
  if (navigator.onLine && SUPABASE_URL && SUPABASE_KEY) {
     try {
       const { error } = await supabase.from(TABLE_NAME).delete().eq('user_id', currentUserId);
       if (error) {
         console.error("Error borrando datos en nube:", error);
         // Continuamos con borrado local de todos modos
       }
     } catch (e) {
       console.error("Error de conexión al borrar nube", e);
     }
  }
  
  // 2. Borrar local
  localStorage.removeItem(APP_STORAGE_KEY);
  localStorage.removeItem(DELETED_QUEUE_KEY);
  // NOTA: No borramos SETTINGS_STORAGE_KEY para mantener la API Key y configuración
  
  return true;
};

export const exportBackupData = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  return data || "[]";
};

export const generateCSV = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  if (!data) return '';
  
  const records: InstallationRecord[] = JSON.parse(data);
  let csvContent = "Fecha,Hora,Tipo,Monto,ID\n";
  
  records.forEach(r => {
    const dateObj = new Date(r.date);
    const date = dateObj.toLocaleDateString('es-ES');
    const time = dateObj.toLocaleTimeString('es-ES');
    const typeLabel = LABELS[r.type] || r.type;
    csvContent += `${date},${time},"${typeLabel}",${r.amount},${r.id}\n`;
  });
  
  return csvContent;
};

export const importBackupData = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Al importar backup, preservamos el ID del usuario actual para los nuevos registros
      // o asumimos que el backup es del mismo usuario. 
      // Para seguridad, podríamos reasignar el userId actual a los importados.
      const currentUserId = getUserId();
      const sanitized = parsed.map((r: any) => ({
         ...r,
         userId: currentUserId // Reclamar propiedad de los datos importados
      }));
      
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(sanitized));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Backup import failed", e);
    return false;
  }
};
