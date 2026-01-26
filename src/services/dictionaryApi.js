/**
 * Look up a word in Merriam-Webster Collegiate Dictionary (via Netlify function)
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} - Parsed word data
 */
export const lookupWord = async (word) => {
    if (!word || !word.trim()) {
        throw new Error('Word is required');
    }
    
    const cleanWord = word.trim().toLowerCase();
    
    try {
        const response = await fetch('/.netlify/functions/dictionary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: cleanWord, type: 'collegiate' })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if suggestions were returned (word not found)
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            return {
                notFound: true,
                suggestions: data
            };
        }
        
        // Parse the first entry
        if (data.length === 0) {
            return {
                notFound: true,
                suggestions: []
            };
        }
        
        const entry = data[0];
        
        return {
            word: entry.meta?.id?.split(':')[0] || cleanWord,
            pronunciation: (entry.hwi?.prs?.[0]?.mw || entry.hwi?.hw || cleanWord).replace(/\*/g, ''),
            audio: getAudioUrl(entry.hwi?.prs?.[0]?.sound),
            partOfSpeech: entry.fl || 'unknown',
            definitions: parseDefinitions(entry.shortdef || []),
            etymology: parseEtymology(entry.et),
            synonyms: entry.meta?.syns?.[0] || [],
            antonyms: entry.meta?.ants?.[0] || [],
            examples: parseExamples(entry.def?.[0]?.sseq),
            fullData: entry
        };
    } catch (error) {
        console.error('Dictionary API error:', error);
        throw error;
    }
};

/**
 * Get audio URL for pronunciation
 */
const getAudioUrl = (sound) => {
    if (!sound?.audio) return null;
    
    const audio = sound.audio;
    let subdirectory;
    
    if (audio.startsWith('bix')) {
        subdirectory = 'bix';
    } else if (audio.startsWith('gg')) {
        subdirectory = 'gg';
    } else if (audio.match(/^[0-9_]/)) {
        subdirectory = 'number';
    } else {
        subdirectory = audio.charAt(0);
    }
    
    return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audio}.mp3`;
};

/**
 * Parse definitions into clean format
 */
const parseDefinitions = (shortdef) => {
    return shortdef.map((def, i) => ({
        id: i + 1,
        text: def
    }));
};

/**
 * Parse etymology
 */
const parseEtymology = (etymologyData) => {
    if (!etymologyData || etymologyData.length === 0) return null;
    
    // Etymology is in first element, second item
    const etText = etymologyData[0]?.[1];
    if (!etText) return null;
    
    // Clean up formatting codes
    if (typeof etText === 'string') {
        // Remove all {code} formatting
        return etText.replace(/\{[^}]+\}/g, '').trim();
    }
    
    // Handle complex etymology structure - recursively extract text
    const extractText = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/\{[^}]+\}/g, '');
        }
        if (Array.isArray(obj)) {
            return obj.map(extractText).join(' ');
        }
        if (obj && typeof obj === 'object' && obj.text) {
            return extractText(obj.text);
        }
        return '';
    };
    
    return extractText(etText).trim();
};

/**
 * Parse examples from sense sequence
 */
const parseExamples = (sseq) => {
    if (!sseq) return [];
    
    const examples = [];
    
    const extractExamples = (arr) => {
        if (!Array.isArray(arr)) return;
        
        arr.forEach(item => {
            if (Array.isArray(item)) {
                extractExamples(item);
            } else if (item && typeof item === 'object') {
                if (item.dt) {
                    item.dt.forEach(dtItem => {
                        if (Array.isArray(dtItem) && dtItem[0] === 'vis') {
                            dtItem[1]?.forEach(vis => {
                                if (vis.t) {
                                    // Remove formatting codes
                                    const cleanText = vis.t.replace(/\{[^}]+\}/g, '');
                                    examples.push(cleanText);
                                }
                            });
                        }
                    });
                }
            }
        });
    };
    
    extractExamples(sseq);
    return examples;
};

/**
 * Get thesaurus data (synonyms/antonyms) via Netlify function
 */
export const lookupThesaurus = async (word) => {
    if (!word || !word.trim()) {
        throw new Error('Word is required');
    }
    
    const cleanWord = word.trim().toLowerCase();
    
    try {
        const response = await fetch('/.netlify/functions/dictionary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: cleanWord, type: 'thesaurus' })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] !== 'string') {
            const entry = data[0];
            return {
                synonyms: entry.meta?.syns?.flat() || [],
                antonyms: entry.meta?.ants?.flat() || []
            };
        }
        
        return { synonyms: [], antonyms: [] };
    } catch (error) {
        console.error('Thesaurus API error:', error);
        return { synonyms: [], antonyms: [] };
    }
};

