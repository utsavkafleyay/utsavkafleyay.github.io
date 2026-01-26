import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEYS } from "../config/api";

const genAI = new GoogleGenerativeAI(API_KEYS.gemini);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

/**
 * Get a deep dive analysis of a word using Gemini
 * @param {string} word - The word to analyze
 * @returns {Promise<Object>} - Structured insights about the word
 */
export const getDeepDive = async (word) => {
    const prompt = `Analyze the word "${word}". Provide structured insights including literary context, emotional nuance, usage tips, and a mnemonic. 
    Return the response strictly as a JSON object matching this schema:
    {
      "nuance": "string explaining the subtle emotional weight or flavor of the word",
      "literary_history": "string noting how famous authors favored this word or its historical usage in literature",
      "mnemonic": "string providing a clever rhyme or mental image to remember it",
      "modern_scenario": "string describing a relatable contemporary scenario where this word is the perfect choice",
      "vibe_check": ["array of 3-4 descriptive adjectives like 'whimsical', 'academic', 'rare'"]
    }`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON if there are markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Invalid response format from AI");
        }
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Gemini Deep Dive error:", error);
        throw error;
    }
};

