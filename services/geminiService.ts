import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { InstallType, ProductionRecord, ExtractedData } from "../types";
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
    intent: {
      type: Type.STRING,
      enum: ['LOGGING', 'QUERY', 'CORRECTION', 'GENERAL_CHAT'],
      description: "La intención del usuario: LOGGING (registrar uno o más datos), QUERY (hacer una pregunta), CORRECTION (corregir el último registro), o GENERAL_CHAT (conversación casual)."
    },
    records: {
      type: Type.ARRAY,
      description: "Lista de registros a guardar. Vacío si la intención no es LOGGING.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: Object.values(InstallType),
            description: "El tipo de trabajo."
          },
          quantity: {
            type: Type.INTEGER,
            description: "Cantidad de instalaciones. Nulo para 'servicio_tecnico'."
          },
          date: {
            type: Type.STRING,
            description: "Fecha del registro en formato ISO 8601 (YYYY-MM-DD)."
          },
          description: {
            type: Type.STRING,
            description: "Descripción breve para 'servicio_tecnico'."
          },
          manual_amount: {
            type: Type.NUMBER,
            description: "Monto para 'servicio_tecnico'."
          }
        },
        required: ["type"]
      }
    },
    correction: {
        type: Type.OBJECT,
        properties: {
            new_quantity: {
                type: Type.INTEGER,
                description: "La nueva cantidad para el registro que se está corrigiendo."
            }
        }
    },
    jarvisResponse: {
      type: Type.STRING,
      description: "Respuesta de Jarvis para el usuario. SIEMPRE debe ser clara y confirmar la acción realizada."
    }
  },
  required: ["intent", "jarvisResponse"]
};

const getSystemInstruction = (lastRecord: ProductionRecord | null) => {
    const prices = getAllPrices();
    const lastRecordContext = lastRecord 
      ? `\nULTIMO REGISTRO (para contexto de correcciones o adiciones): { tipo: '${lastRecord.installation_type}', cantidad: ${lastRecord.quantity}, fecha: '${lastRecord.record_date}' }`
      : "\nNo hay registros previos en esta sesión.";

    return `
      Fecha Actual: ${new Date().toISOString().split('T')[0]}
      Eres Jarvis, un asistente de IA para Netuno. Eres extremadamente eficiente, preciso y directo. Tu función es procesar comandos de voz/texto para gestionar un registro de producción.
      
      REGLAS CRÍTICAS:
      1.  **Intención:** Tu primera tarea es determinar la intención:
          - **LOGGING:** El usuario quiere registrar una o MÚLTIPLES actividades. Ej: "5 residenciales y 2 servicios ayer".
          - **CORRECTION:** El usuario quiere corregir el último registro. Palabras clave: "me equivoqué", "eran X", "no, fueron Y". Usa el 'ULTIMO REGISTRO' de contexto para saber qué corregir. SOLO corrige cantidad.
          - **QUERY:** El usuario pregunta por sus datos. Ej: "¿cuánto llevo hoy?".
          - **GENERAL_CHAT:** Saludos o charla no relacionada.
      2.  **Procesamiento de LOGGING:**
          - Extrae TODAS las actividades de la frase.
          - **Tipos Válidos:** 'residencial', 'corporativo', 'poste', 'servicio_tecnico'.
          - **Fechas:** Si no se especifica, usa la fecha actual. Interpreta "ayer", "hace dos días", etc.
          - **'servicio_tecnico':** NO tiene 'quantity'. DEBE tener 'manual_amount' (usa el precio de referencia si no se especifica) y puede tener 'description'.
          - **Contexto:** Si el usuario dice "agrega 2 más", asume el tipo y fecha del 'ULTIMO REGISTRO'.
      3.  **Procesamiento de CORRECTION:**
          - Rellena el objeto 'correction' con la 'new_quantity'. El array 'records' debe estar vacío.
      4.  **Respuesta ('jarvisResponse'):**
          - SIEMPRE responde. Sé conciso.
          - Para LOGGING, confirma lo que registraste: "Ok, 5 residenciales y 2 servicios técnicos registrados para ayer."
          - Para CORRECTION, confirma el cambio: "Corregido. El último registro ahora es de 4."
          - Para QUERY, responde usando los datos de contexto.
      5.  **JSON:** Responde SIEMPRE con el JSON schema. 'records' puede ser un array vacío.

      Precios de Referencia (para 'servicio_tecnico' si no se especifica monto):
      - residencial: $${prices.residencial}
      - corporativo: $${prices.corporativo}
      - poste: $${prices.poste}
      - servicio_tecnico: $${prices.servicio_tecnico}
      ${lastRecordContext}
    `;
};

const initializeChat = (lastRecord: ProductionRecord | null) => {
    try {
        const aiInstance = getAiInstance();
        chat = aiInstance.chats.create({ 
            model: "gemini-2.5-flash",
            config: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.1,
            },
            systemInstruction: getSystemInstruction(lastRecord),
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

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const testAI = new GoogleGenAI({ apiKey });
    await testAI.models.generateContent({ model: "gemini-2.5-flash", contents: 'Test' });
    return true;
  } catch (e) {
    console.error("Validation failed", e);
    return false;
  }
};

export const processUserMessage = async (message: string, records: ProductionRecord[]): Promise<ExtractedData> => {
  if (!navigator.onLine) {
    return {
      intent: 'GENERAL_CHAT',
      records: [],
      jarvisResponse: "⚠️ Modo Sin Conexión. La IA no está disponible. Usa el menú de acceso rápido para registrar manualmente."
    };
  }

  try {
    const lastRecord = records.length > 0 ? records[0] : null;
    
    // Always re-initialize with the latest context
    initializeChat(lastRecord);
    
    if (!chat) {
        throw new Error("Chat not initialized. Check API Key.");
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRecords = records.filter(r => new Date(r.record_date).toLocaleDateString('en-CA') === todayStr);
    const todayTotal = todayRecords.reduce((sum, r) => sum + r.total_amount, 0);
    
    const dataSummary = `- Ganancias de hoy: $${todayTotal.toFixed(2)}`;

    const promptForGemini = `
        DATOS DE CONTEXTO (SOLO PARA RESPONDER PREGUNTAS): ${dataSummary}
        MENSAJE DEL USUARIO: "${message}"
    `;

    const result = await chat.sendMessage({ message: promptForGemini });
    const response = result as GenerateContentResponse;
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini User Message Error:", error);
    resetChat();
    if (error instanceof Error && (error.message.includes("API Key") || error.message.includes("403"))) {
         return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "⚠️ Error: Falta la API Key o es inválida. Verifica en Configuración." };
    }
    return { intent: 'GENERAL_CHAT', records: [], jarvisResponse: "Error de conexión con IA. Intenta de nuevo." };
  }
};
