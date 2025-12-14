import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, InstallationRecord, ExtractedData } from "../types";
import { getAllPrices, getEffectiveApiKey } from "./settingsService";

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (ai) return ai;
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error("API Key missing");
  }
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    records: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE],
            description: "El tipo de instalación detectada."
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
      description: "Respuesta de Jarvis. SIEMPRE menciona qué se guardó y PARA QUÉ FECHA se guardó."
    }
  },
  required: ["records", "jarvisResponse"]
};

const getSystemInstruction = () => {
    const prices = getAllPrices();
    return `
      Fecha y Hora Actual del Sistema: ${new Date().toLocaleString('es-ES')}
      
      Eres Jarvis, un asistente de IA para Netuno. Eres eficiente, directo y nunca haces preguntas. Tu única función es extraer datos de registro.
      
      MODO DE REGISTRO:
      1. Extraer instalaciones (Residencial, Corporativa, Poste, Servicio Técnico) y su cantidad.
      2. Determinar la fecha exacta del registro. Si no se especifica, usa la fecha actual. Si se dice "ayer", resta 1 día.
      3. Mantén el contexto de la conversación. Si el usuario dice "agrega 2 más", debe ser del último tipo mencionado.
      4. Responde SIEMPRE con el JSON schema.
      5. En 'jarvisResponse', sé conciso. Confirma la acción y la fecha. Ejemplo: "Entendido. 2 Residenciales registradas para ayer."
      
      Valores Configurados:
      - Residential: $${prices[InstallType.RESIDENTIAL]}
      - Corporate: $${prices[InstallType.CORPORATE]}
      - Poste: $${prices[InstallType.POSTE]}
      - Service: $${prices[InstallType.SERVICE]}
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
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const testAI = new GoogleGenAI({ apiKey });
    await testAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Test connection",
    });
    return true;
  } catch (e) {
    console.error("Validation failed", e);
    return false;
  }
};

export const processLoggingMessage = async (message: string): Promise<ExtractedData> => {
  if (!navigator.onLine) {
    return {
      records: [],
      jarvisResponse: "⚠️ Modo Sin Conexión. La IA no está disponible. Usa el menú de acceso rápido para registrar manualmente."
    };
  }

  try {
    if (!chat) {
        initializeChat();
    }
    if (!chat) { // If initialization failed
        throw new Error("Chat not initialized. Check API Key.");
    }

    const response = await chat.sendMessage({ message });
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Logging Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("API Key missing") || error.message.includes("403") || error.message.includes("API key")) {
         return {
          records: [],
          jarvisResponse: "⚠️ Error: Falta la API Key o es inválida. Verifica en Configuración."
        };
      }
    }
    return {
      records: [],
      jarvisResponse: "Error de conexión con IA. Verifica tu internet y tu API Key."
    };
  }
};

export const processQueryMessage = async (message: string, records: InstallationRecord[]): Promise<ExtractedData> => {
    if (!navigator.onLine) {
        return {
            records: [],
            jarvisResponse: "⚠️ Modo Sin Conexión. No se pueden realizar consultas."
        };
    }

    try {
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

        const prompt = `
            Eres Jarvis. Responde la pregunta del usuario de forma concisa, directa y en español, usando los datos proporcionados. No saludes ni uses texto de relleno. Sé un asistente eficiente.

            Datos de Producción:
            ${dataSummary}

            Pregunta del Usuario: "${message}"
        `;
        
        const aiInstance = getAiInstance();
        const response = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI for query");
        
        return { records: [], jarvisResponse: text };

    } catch (error) {
        console.error("Gemini Query Error:", error);
        return {
            records: [],
            jarvisResponse: "Error al procesar la consulta. Intenta de nuevo."
        };
    }
};