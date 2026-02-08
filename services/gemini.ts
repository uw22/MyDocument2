import { GoogleGenAI, Type } from "@google/genai";

export interface AnalysisResult {
    title?: string;
    category?: string;
    ocrText?: string;
}

/**
 * Analyzes a document using Gemini AI.
 * Fixed signature to accept mimeType as the second argument and follow strict Gemini API guidelines.
 */
export async function analyzeDocument(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult | null> {
    try {
        // Initializing GoogleGenAI with apiKey as a named parameter as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Ensure we have the raw base64 string without the data URL prefix
        const base64Data = imageBase64.includes(',') 
            ? imageBase64.split(',')[1] 
            : imageBase64;

        // Use gemini-3-flash-preview for document analysis.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: "Analysiere dieses Dokument. 1. Erstelle einen kurzen, prägnanten Titel (max 25 Zeichen). 2. Wähle die beste Kategorie aus: 'Arbeit', 'Gesundheit', 'Reisen', 'Finanzen', 'Zuhause'. Falls nichts passt, nutze 'Sonstiges'. 3. Extrahiere den gesamten lesbaren Text (OCR). Antworte im JSON Format."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                        ocrText: { type: Type.STRING }
                    },
                    required: ["title", "category", "ocrText"]
                }
            }
        });

        // Use response.text property (not a method) as per guidelines.
        const text = response.text;
        if (text) {
            return JSON.parse(text);
        }
        return null;

    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return null;
    }
}
