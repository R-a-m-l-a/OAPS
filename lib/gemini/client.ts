import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Get or initialize the Gemini model instance.
 * Note: This should only be used on the server side to protect the API key.
 */
export function getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use gemini-2.5-flash for fast, efficient analysis
    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });
}
