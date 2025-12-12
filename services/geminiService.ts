import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InstallType } from "../types";
import { getAllPrices } from "./settingsService";

// Declare process for TS to avoid build errors
declare var process: any;

// Initialize Gemini lazily
let ai: GoogleGenAI | null = null;

const getAiInstance = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }
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
            enum: [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE],
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

export const processUserMessage = async (message: string, currentDate: string) => {
  // OFFLINE CHECK
  if (!navigator.onLine) {
    return {
      records: [],
      jarvisResponse: "⚠️ Modo Sin Conexión. La IA no está disponible. Usa el menú de acceso rápido (botón cuadrícula) para registrar manualmente."
    };
  }

  try {
    const prices = getAllPrices();
    
    const prompt = `
      Fecha y Hora Actual del Sistema: ${new Date().toLocaleString('es-ES')}
      
      Eres Jarvis, el asistente de registros de Netuno.
      
      Tus Objetivos:
      1. Extraer instalaciones (Residencial, Corporativa, Poste) del texto.
      2. Determinar la fecha exacta del registro.
      
      Manejo de Fechas (CRÍTICO):
      - Si el usuario dice "hoy", usa la fecha actual.
      - Si el usuario dice "ayer", resta 1 día a la fecha actual.
      - Si el usuario dice "9 de diciembre" o "el 9", asume el año actual o el más lógico (no futuro).
      - Retorna la fecha SIEMPRE en formato YYYY-MM-DD.
      
      Respuesta (jarvisResponse):
      - Debe ser en Español.
      - Estilo eficiente y tecnológico.
      - **IMPORTANTE**: Confirma explícitamente la fecha. Ejemplo: "3 residenciales registradas para el 9 de diciembre." o "Guardado correctamente con fecha de hoy."
      
      Valores Configurados:
      - Residential: $${prices[InstallType.RESIDENTIAL]}
      - Corporate: $${prices[InstallType.CORPORATE]}
      - Poste: $${prices[InstallType.POSTE]}
      
      Input del Usuario: "${message}"
    `;

    const aiInstance = getAiInstance();
    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("403")) {
         return {
          records: [],
          jarvisResponse: "⚠️ Error: Falta la API Key."
        };
      }
    }
    return {
      records: [],
      jarvisResponse: "Error de conexión. Intente nuevamente."
    };
  }
};