import { InstallationRecord, InstallType } from '../types';
import { APP_STORAGE_KEY } from '../constants';
import { getPrice } from './settingsService';

// CONFIGURACIÓN PARA FUSIÓN CON BACKEND
// Cuando encuentres tu URL del backend de Cursor, pégala aquí.
// Ejemplo: "https://mi-backend-cursor.railway.app"
const API_URL = ""; 

// Simulación de latencia de red (esto ayuda a que la UI se sienta realista antes de conectar el backend)
const simulateNetwork = () => new Promise(resolve => setTimeout(resolve, 50));

export const getRecords = async (): Promise<InstallationRecord[]> => {
  try {
    // 1. INTENTO DE CARGA DESDE BACKEND (Si existe la URL)
    if (API_URL) {
      try {
        const response = await fetch(`${API_URL}/api/records`);
        if (response.ok) {
          const data = await response.json();
          // Actualizamos el caché local por si acaso
          localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn("Backend no disponible, usando modo offline local.", err);
      }
    }

    // 2. MODO LOCAL / OFFLINE (Fallback)
    await simulateNetwork();
    const data = localStorage.getItem(APP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
};

export const saveRecord = async (type: InstallType, quantity: number, dateOverride?: string): Promise<InstallationRecord[]> => {
  // Cálculo de fecha y precio (Lógica compartida)
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

  // 1. INTENTO DE GUARDADO EN BACKEND
  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords })
      });
      // Si el backend responde OK, volvemos a pedir la lista actualizada
      return await getRecords();
    } catch (err) {
      console.warn("No se pudo guardar en Backend, guardando localmente.", err);
    }
  }

  // 2. GUARDADO LOCAL (Actual)
  const currentRecords = await getRecords(); // Ahora es async
  const updated = [...currentRecords, ...newRecords];
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  await simulateNetwork();
  
  return updated;
};

export const deleteRecord = async (id: string): Promise<InstallationRecord[]> => {
  // 1. INTENTO DE BORRADO EN BACKEND
  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/records/${id}`, { method: 'DELETE' });
      return await getRecords();
    } catch (err) {
      console.warn("No se pudo borrar en Backend, borrando localmente.", err);
    }
  }

  // 2. BORRADO LOCAL
  const currentRecords = await getRecords();
  const updated = currentRecords.filter(r => r.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  await simulateNetwork();

  return updated;
};

export const clearAllData = () => {
  localStorage.removeItem(APP_STORAGE_KEY);
};

// Backup Functions (Estos se mantienen síncronos ya que son utilidades de archivo)
export const exportBackupData = (): string => {
  const data = localStorage.getItem(APP_STORAGE_KEY);
  return data || "[]";
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