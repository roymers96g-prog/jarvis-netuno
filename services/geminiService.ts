
import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, InstallationRecord, ExtractedData } from "../types";
import { getAllPrices, getEffectiveApiKey, getSettings } from "./settingsService";

// No cacheamos 'ai' globalmente para evitar problemas si la key cambia en tiempo de ejecución
let chat: Chat | null = null;
let currentModelUsed = "gemini-2.5-flash"; // Track active model

const cleanApiKey = (key: string) => {
  // Elimina espacios, saltos de línea, zero-width spaces (\u200B), y otros caracteres invisibles
  return key ? key.trim().replace(/[\r\n\s\u200B-\u200D\uFEFF]/g, '') : '';
};

const getAiInstance = (): GoogleGenAI => {
  const apiKey = cleanApiKey(getEffectiveApiKey());
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API Key faltante o inválida");
  }
  return new GoogleGenAI({ apiKey });
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['LOGGING', 'QUERY', 'GENERAL_CHAT'],
      description: "La intención del usuario: LOGGING para registrar datos, QUERY para hacer una pregunta sobre los datos, o GENERAL_CHAT para una conversación casual."
    },
    records: {
      type: Type.ARRAY,
      description: "Lista de registros a guardar. Vacío si la intención no es LOGGING.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE,
              InstallType.SERVICE_BASIC, InstallType.SERVICE_REWIRING, InstallType.SERVICE_CORP
            ],
            description: "El tipo de instalación detectada. Usa SERVICE_BASIC, SERVICE_REWIRING, SERVICE_CORP si el contexto es de soporte técnico."
          },
          quantity: {
            type: Type.INTEGER,
            description: "Cantidad de instalaciones."
          },
          date: {
            type: Type.STRING,
            description: "Fecha de la instalación en formato ISO 8601 (YYYY-MM-DD). DEBE ser calculada con precisión."
          }
        },
        required: ["type", "quantity"]
      }
    },
    jarvisResponse: {
      type: Type.STRING,
      description: "Respuesta de Jarvis para mostrar al usuario. SIEMPRE debe contener una respuesta."
    }
  },
  required: ["intent", "records", "jarvisResponse"]
};

const getSystemInstruction = () => {
    const prices = getAllPrices();
    const settings = getSettings();
    const role = settings.profile === 'TECHNICIAN' ? 'Técnico de Servicio' : 'Instalador de Fibra';

    return `
      Fecha y Hora Actual del Sistema: ${new Date().toLocaleString('es-ES')}
      
      Eres Jarvis, un asistente de IA para Netuno. El usuario tiene el rol de: ${role}.
      
      TAREAS PRINCIPALES:
      1.  Determina la intención del usuario: LOGGING (registrar datos), QUERY (preguntar sobre datos), o GENERAL_CHAT.
      2.  LOGGING:
          - Si el usuario es INSTALADOR, prioriza: Residencial, Corporativo, Poste.
          - Si el usuario es TÉCNICO, prioriza: Servicio Básico, Recableado/Mudanza, Servicio Corporativo.
          - Mapea "servicio básico" o "revisión" -> SERVICE_BASIC.
          - Mapea "recableado", "mudanza", "traslado" -> SERVICE_REWIRING.
          - Mapea "servicio corporativo" -> SERVICE_CORP.
          - Extrae cantidad y fecha (si dice "ayer", resta 1 día).
      3.  QUERY: Usa los "DATOS DE CONTEXTO" para responder concisamente.
      4.  GENERAL_CHAT: Breve y profesional.
      
      Precios Configurados:
      [Instalación]
      - Residential: $${prices[InstallType.RESIDENTIAL]}
      - Corporate: $${prices[InstallType.CORPORATE]}
      - Poste: $${prices[InstallType.POSTE]}
      - Service (Legacy): $${prices[InstallType.SERVICE]}
      
      [Servicio Técnico]
      - Srv. Básico: $${prices[InstallType.SERVICE_BASIC]}
      - Recableado/Mudanza: $${prices[InstallType.SERVICE_REWIRING]}
      - Srv. Corp: $${prices[InstallType.SERVICE_CORP]}
    `;
};

const initializeChat = (modelName: string = "gemini-2.5-flash") => {
    try {
        const aiInstance = getAiInstance();
        currentModelUsed = modelName;
        console.log(`Initializing chat with model: ${modelName}`);
        
        chat = aiInstance.chats.create({
            model: modelName,
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.1,
            },
        });
    } catch (e) {
        console.error("Failed to initialize chat", e);
        chat = null;
    }
};

export const resetChat = () => {
    console.log("Chat session reset.");
    chat = null;
};

// Function to test the API Key specifically
export const validateApiKey = async (rawApiKey: string): Promise<{valid: boolean; error?: string}> => {
  // 1. Limpieza Agresiva: Elimina espacios, tabs, saltos de línea Y caracteres invisibles (Zero Width Space)
  const apiKey = cleanApiKey(rawApiKey);

  if (!apiKey || apiKey.length < 30) {
      return { valid: false, error: "⚠️ La Key parece incompleta o demasiado corta." };
  }

  const testModel = async (modelName: string) => {
    console.log(`Testing model: ${modelName}`);
    const testAI = new GoogleGenAI({ apiKey });
    await testAI.models.generateContent({
      model: modelName,
      contents: "Hi",
    });
  };

  try {
    // Intentar primero con el modelo 2.5
    await testModel("gemini-2.5-flash");
    return { valid: true };
  } catch (e: any) {
    console.warn("Fallo validación con gemini-2.5-flash, intentando fallback...", e.message);
    
    // Fallback 1: gemini-1.5-flash
    try {
        await testModel("gemini-1.5-flash");
        return { valid: true };
    } catch (e2: any) {
        console.error("Validation failed with 1.5-flash:", e2);
        
        // Fallback 2: gemini-1.5-pro (A veces flash falla pero pro funciona en ciertos proyectos antiguos)
        try {
             await testModel("gemini-1.5-pro");
             return { valid: true };
        } catch (e3: any) {
            let msg = "Error desconocido al conectar con Gemini.";
            const errString = e2.toString().toLowerCase(); // Usamos e2 como referencia principal
            const errMsg = e2.message?.toLowerCase() || "";

            if (errMsg.includes('key') || errMsg.includes('403') || errString.includes('permission_denied') || errMsg.includes('api key not valid')) {
                msg = "⛔ API Key rechazada. Verifica que la has copiado correctamente (sin espacios al final).";
            } else if (errMsg.includes('not found') || errMsg.includes('404')) {
                msg = "🔍 Modelo no encontrado. Tu API Key es válida pero no tiene acceso a los modelos Flash.";
            } else if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('failed to fetch')) {
                msg = "📡 Error de conexión. Revisa tu internet.";
            } else if (errMsg.includes('quota') || errMsg.includes('429')) {
                msg = "⏳ Cuota excedida por hoy.";
            }

            return { valid: false, error: msg };
        }
    }
  }
};

export const processUserMessage = async (message: string, records: InstallationRecord[]): Promise<ExtractedData> => {
  if (!navigator.onLine) {
    return {
      intent: 'GENERAL_CHAT',
      records: [],
      jarvisResponse: "⚠️ Modo Sin Conexión. La IA no está disponible. Usa el menú de acceso rápido para registrar manualmente."
    };
  }

  try {
    if (!chat) {
        initializeChat("gemini-2.5-flash");
    }
    if (!chat) { 
        throw new Error("API_KEY_MISSING");
    }

    // Context Data Construction
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthTotal = 0;
    let todayTotal = 0;
    let allTotal = 0;

    records.forEach(r => {
        const rDate = new Date(r.date);
        const rDateStr = rDate.toLocaleDateString('en-CA');
        const isThisMonth = rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
        const isToday = rDateStr === todayStr;

        allTotal += r.amount;
        if (isThisMonth) monthTotal += r.amount;
        if (isToday) todayTotal += r.amount;
    });
    
    const dataSummary = `
    - Ganancias de hoy: $${todayTotal.toFixed(2)}
    - Ganancias de este mes: $${monthTotal.toFixed(2)}
    - Ganancias totales del año: $${allTotal.toFixed(2)}
    - Total de actividades registradas: ${records.length}
    `;

    const promptForGemini = `
        DATOS DE CONTEXTO (SOLO PARA RESPONDER PREGUNTAS):
        ${dataSummary}

        MENSAJE DEL USUARIO:
        "${message}"
    `;

    try {
        const response = await chat.sendMessage({ message: promptForGemini });
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text);

    } catch (chatError: any) {
        // Manejo de error de modelo NO ENCONTRADO durante el chat (fallback dinámico)
        const errStr = chatError.toString().toLowerCase();
        if (errStr.includes('not found') || errStr.includes('404')) {
             console.warn(`Model ${currentModelUsed} failed (404). Trying fallback to gemini-1.5-flash...`);
             
             // Reinicializar con modelo seguro
             initializeChat("gemini-1.5-flash");
             if (chat) {
                 const responseFallback = await chat.sendMessage({ message: promptForGemini });
                 const textFallback = responseFallback.text;
                 if (textFallback) return JSON.parse(textFallback);
             }
        }
        throw chatError; // Re-throw si no es 404 o si fallback falla
    }

  } catch (error: any) {
    console.error("Gemini User Message Error:", error);
    
    if (error.message === "API_KEY_MISSING" || error.toString().includes("API Key") || error.toString().includes("403")) {
         return {
          intent: 'GENERAL_CHAT',
          records: [],
          jarvisResponse: "⚠️ Error Crítico: No se detecta una API Key válida. Por favor configúrala en el menú de Configuración."
        };
    }
    
    return {
      intent: 'GENERAL_CHAT',
      records: [],
      jarvisResponse: "Lo siento, hubo un error de conexión con mi cerebro digital. Intenta de nuevo."
    };
  }
};
