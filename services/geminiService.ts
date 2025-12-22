
import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, InstallationRecord, ExtractedData } from "../types";
import { getAllPrices, getEffectiveApiKey, getSettings } from "./settingsService";

let chat: Chat | null = null;
let currentModelUsed = "gemini-2.5-flash"; 

const cleanApiKey = (key: string) => {
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
      enum: ['LOGGING', 'QUERY', 'GENERAL_CHAT', 'DELETION'],
      description: "LOGGING para registrar, QUERY para preguntar, GENERAL_CHAT para charla y DELETION para borrar registros."
    },
    records: {
      type: Type.ARRAY,
      description: "Registros a guardar o identificar.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE,
              InstallType.SERVICE_BASIC, InstallType.SERVICE_REWIRING, InstallType.SERVICE_CORP
            ]
          },
          quantity: { type: Type.INTEGER },
          date: { type: Type.STRING }
        },
        required: ["type", "quantity"]
      }
    },
    deletionTarget: {
      type: Type.OBJECT,
      properties: {
        last: { type: Type.BOOLEAN, description: "Si el usuario quiere borrar el último registro realizado." },
        type: { type: Type.STRING, description: "El tipo específico de registro a borrar." },
        date: { type: Type.STRING, description: "Fecha del registro a borrar." }
      }
    },
    jarvisResponse: {
      type: Type.STRING,
      description: "Respuesta concisa y profesional."
    }
  },
  required: ["intent", "records", "jarvisResponse"]
};

const getSystemInstruction = () => {
    const prices = getAllPrices();
    const settings = getSettings();
    const role = settings.profile === 'TECHNICIAN' ? 'Técnico de Servicio' : 'Instalador de Fibra';

    return `
      Eres Jarvis, un asistente de IA para Netuno. Usuario: ${role}.
      
      INTENCIONES:
      1. LOGGING: Registrar nueva producción.
      2. QUERY: Consultar estadísticas.
      3. GENERAL_CHAT: Saludos o ayuda.
      4. DELETION: Si el usuario pide "borra", "elimina" o "quita" algo que ya registró.
         - Si el usuario dice "borra el último", marca deletionTarget.last = true.
         - Si dice "borra la residencial de hoy", identifica el tipo y la fecha.
      
      IMPORTANTE: Nunca borres tú directamente. Tu respuesta (jarvisResponse) para DELETION debe ser una confirmación tipo: "Entendido, he localizado el registro. Por seguridad, confírmalo en pantalla."
    `;
};

const initializeChat = (modelName: string = "gemini-2.5-flash") => {
    try {
        const aiInstance = getAiInstance();
        currentModelUsed = modelName;
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
        chat = null;
    }
};

export const resetChat = () => {
    chat = null;
};

export const validateApiKey = async (rawApiKey: string): Promise<{valid: boolean; error?: string}> => {
  const apiKey = cleanApiKey(rawApiKey);
  if (!apiKey || apiKey.length < 30) {
      return { valid: false, error: "⚠️ La Key parece incompleta." };
  }
  const testModel = async (modelName: string) => {
    const testAI = new GoogleGenAI({ apiKey });
    await testAI.models.generateContent({ model: modelName, contents: "Hi" });
  };
  try {
    await testModel("gemini-2.5-flash");
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: "Error de validación." };
  }
};

export const processUserMessage = async (message: string, records: InstallationRecord[]): Promise<ExtractedData> => {
  if (!navigator.onLine) {
    return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "⚠️ IA Offline." };
  }
  try {
    if (!chat) initializeChat("gemini-2.5-flash");
    if (!chat) throw new Error("API_KEY_MISSING");

    const response = await chat.sendMessage({ message: `MENSAJE: "${message}"` });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error: any) {
    return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "Error de conexión." };
  }
};
