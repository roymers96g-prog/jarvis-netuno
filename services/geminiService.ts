import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InstallType } from "../types";
import { getAllPrices } from "./settingsService";

// Initialize Gemini
// NOTE: API Key is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            description: "The type of installation detected."
          },
          quantity: {
            type: Type.INTEGER,
            description: "Number of installations of this type."
          },
          date: {
            type: Type.STRING,
            description: "Date of installation in ISO 8601 format (YYYY-MM-DD). If not specified by user, use today's date."
          }
        },
        required: ["type", "quantity"]
      }
    },
    jarvisResponse: {
      type: Type.STRING,
      description: "A very brief, efficient, robotic response confirming the action. Style: Jarvis/Iron Man interface."
    }
  },
  required: ["records", "jarvisResponse"]
};

export const processUserMessage = async (message: string, currentDate: string) => {
  try {
    const prices = getAllPrices();
    
    const prompt = `
      Current Date: ${currentDate}
      
      You are Jarvis, an advanced AI production tracking assistant for a fiber optic technician working for Netuno.
      
      Your specific task is to extract installation records from the user's natural language input.
      
      Installation Types and Current Configured Values:
      1. RESIDENTIAL (Residential) - valued at $${prices[InstallType.RESIDENTIAL]}
      2. CORPORATE (Corporativa/Empresarial) - valued at $${prices[InstallType.CORPORATE]}
      3. POSTE (Post/Poste/Pole) - valued at $${prices[InstallType.POSTE]}
      
      Rules:
      - Analyze the user's text to find counts of these specific installation types.
      - If the user says "hice 3 instalaciones hoy", and doesn't specify type, assume RESIDENTIAL (most common) or ask for clarification in the 'jarvisResponse' if ambiguous, but prefer making a logical guess based on context if possible to be "efficient". 
      - If the user provides a past date (e.g., "yesterday", "last friday"), calculate the correct ISO date based on "Current Date".
      - Be extremely efficient. Do not chat casually. confirm execution.
      - If the user input is NOT about adding records (e.g., "hello", "who are you"), return an empty 'records' array and a polite Jarvis-like response.
      
      User Input: "${message}"
    `;

    const response = await ai.models.generateContent({
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
    return {
      records: [],
      jarvisResponse: "Error en el procesamiento de datos. Sistema comprometido. Intente nuevamente."
    };
  }
};