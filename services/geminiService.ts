
import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, InstallationRecord, ExtractedData } from "../types";
import { getAllPrices, getEffectiveApiKey, getSettings } from "./settingsService";

// No cacheamos 'ai' globalmente para evitar problemas si la key cambia en tiempo de ejecución
let chat: Chat | null = null;

const getAiInstance = (): GoogleGenAI => {
  const apiKey = getEffectiveApiKey();
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

const initializeChat = () => {
    try {
        const aiInstance = getAiInstance();
        chat = aiInstance.chats.create({
            model: "gemini-2.5-flash",
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
export const validateApiKey = async (apiKey: string): Promise<{valid: boolean; error?: string}> => {
  try {
    const testAI = new GoogleGenAI({ apiKey });
    await testAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Test connection",
    });
    return { valid: true };
  } catch (e: any) {
    console.error("Validation failed", e);
    let msg = "Error desconocido";
    if (e.message?.includes('403') || e.message?.includes('API key')) msg = "API Key inválida o sin permisos.";
    else if (e.message?.includes('not found')) msg = "Modelo no disponible para esta Key.";
    else if (e.message?.includes('fetch')) msg = "Error de conexión/internet.";
    return { valid: false, error: msg };
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
        initializeChat();
    }
    if (!chat) { // If initialization failed after retry
        throw new Error("API_KEY_MISSING");
    }

    // Create data summary for context
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

    const response = await chat.sendMessage({ message: promptForGemini });
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

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
