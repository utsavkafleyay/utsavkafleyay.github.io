// LocalStorage utilities for vocabulary app

const FAVORITES_KEY = 'vocab_favorites';
const HISTORY_KEY = 'vocab_history';
const MAX_HISTORY = 50;

/**
 * Get favorites from localStorage
 */
export const getFavorites = () => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading favorites:', error);
        return [];
    }
};

/**
 * Add word to favorites
 */
export const addFavorite = (word) => {
    try {
        const favorites = getFavorites();
        if (!favorites.some(f => f.word === word.word)) {
            const updated = [...favorites, { ...word, savedAt: Date.now() }];
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
    }
};

/**
 * Remove word from favorites
 */
export const removeFavorite = (wordText) => {
    try {
        const favorites = getFavorites();
        const updated = favorites.filter(f => f.word !== wordText);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
    }
};

/**
 * Check if word is favorited
 */
export const isFavorite = (wordText) => {
    const favorites = getFavorites();
    return favorites.some(f => f.word === wordText);
};

/**
 * Get search history
 */
export const getHistory = () => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading history:', error);
        return [];
    }
};

/**
 * Add word to history
 */
export const addToHistory = (word) => {
    try {
        const history = getHistory();
        // Remove if exists (move to front)
        const filtered = history.filter(h => h !== word);
        const updated = [word, ...filtered].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error adding to history:', error);
    }
};

/**
 * Clear history
 */
export const clearHistory = () => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing history:', error);
    }
};

