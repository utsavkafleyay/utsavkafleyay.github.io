/**
 * Get AI insight for a word using Gemini (via Netlify function)
 * Passes dictionary data as context so Gemini can give richer, grounded analysis
 */
export const getDeepDive = async (word, wordData = null) => {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word, wordData })
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
