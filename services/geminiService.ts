
// Use correct imports from @google/genai, excluding deprecated or unavailable types
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, InstallationRecord, ExtractedData } from "../types";
import { getEffectiveApiKey, getSettings } from "./settingsService";

let chat: Chat | null = null;

const cleanApiKey = (key: string) => {
  return key ? key.trim().replace(/[\r\n\s\u200B-\u200D\uFEFF]/g, '') : '';
};

const getAiInstance = (): GoogleGenAI => {
  const apiKey = cleanApiKey(getEffectiveApiKey());
  if (!apiKey) throw new Error("API Key faltante");
  // Always initialize with a named parameter
  return new GoogleGenAI({ apiKey });
};

// Define response schema for structured output using correct Type enum
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['LOGGING', 'QUERY', 'GENERAL_CHAT', 'DELETION'],
      description: "LOGGING para registrar, QUERY para preguntar, GENERAL_CHAT para charla y DELETION para borrar registros."
    },
    records: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: Object.values(InstallType)
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
        last: { type: Type.BOOLEAN },
        type: { type: Type.STRING },
        date: { type: Type.STRING }
      }
    },
    jarvisResponse: {
      type: Type.STRING,
      description: "Respuesta concisa y profesional del asistente Jarvis."
    }
  },
  required: ["intent", "records", "jarvisResponse"]
};

const getSystemInstruction = () => {
    const settings = getSettings();
    const role = settings.profile === 'TECHNICIAN' ? 'Técnico de Servicio' : 'Instalador de Fibra';

    return `
      Eres Jarvis, un asistente de IA para Netuno. Usuario: ${role}.
      
      INTENCIONES:
      1. LOGGING: Registrar producción. Tipos válidos: RESIDENTIAL, CORPORATE, POSTE, SERVICE_BASIC, SERVICE_CORP, SERVICE_REWIRING_CORP, SERVICE_REWIRING_PPAL, SERVICE_REWIRING_AYUDANTE, SERVICE_RELOCATION, SERVICE_REWIRING.
      
      REFERENCIAS TÉCNICAS Y MAPEO:
      - "Recableado Corporativo" o "Recableado Corp" -> SERVICE_REWIRING_CORP
      - "Recableado Principal" o "Recableado Ppal" o "Ppal" -> SERVICE_REWIRING_PPAL
      - "Recableado Ayudante" o "Ayudante" -> SERVICE_REWIRING_AYUDANTE
      - "Mudanza" o "Relocalización" -> SERVICE_RELOCATION
      - "Recableado" o "Recableado Genérico" -> SERVICE_REWIRING
      - "Residencial" -> RESIDENTIAL
      - "Corporativo" -> CORPORATE
      - "Poste" -> POSTE
      - "Servicio Básico" -> SERVICE_BASIC
      - "Servicio Corp" -> SERVICE_CORP
      
      Tu respuesta debe ser profesional, concisa y confirmatoria. Si el usuario te pide registrar algo nuevo, usa LOGGING. Si te pide borrar el último, usa DELETION con last: true.
    `;
};

const initializeChat = () => {
    try {
        const aiInstance = getAiInstance();
        // Use gemini-3-flash-preview for basic text tasks
        chat = aiInstance.chats.create({
            model: "gemini-3-flash-preview",
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
  if (!apiKey || apiKey.length < 30) return { valid: false, error: "Key inválida" };
  try {
    const testAI = new GoogleGenAI({ apiKey });
    // Use the latest flash model for testing
    await testAI.models.generateContent({ 
      model: "gemini-3-flash-preview", 
      contents: "Hi" 
    });
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: "Error de validación" };
  }
};

export const processUserMessage = async (message: string, records: InstallationRecord[]): Promise<ExtractedData> => {
  if (!navigator.onLine) return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "IA Offline." };
  try {
    if (!chat) initializeChat();
    if (!chat) throw new Error("Chat no inicializado");

    // Use property text, not method text()
    const response: GenerateContentResponse = await chat.sendMessage({ message: `MENSAJE: "${message}"` });
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr.trim());
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "Error de conexión." };
  }
};
