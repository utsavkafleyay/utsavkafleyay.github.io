/**
 * Get a deep dive analysis of a word using Gemini (via Netlify function)
 * @param {string} word - The word to analyze
 * @returns {Promise<Object>} - Structured insights about the word
 */
export const getDeepDive = async (word) => {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get AI insight');
        }

        return await response.json();
    } catch (error) {
        console.error("Gemini Deep Dive error:", error);
        throw error;
    }
};

