/**
 * Look up a word via Wordnik (through Netlify function)
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
            body: JSON.stringify({ word: cleanWord })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.notFound) {
            return { notFound: true, suggestions: [] };
        }

        return {
            word: cleanWord,
            pronunciation: parsePronunciation(data.pronunciations),
            audio: parseAudio(data.audio),
            partOfSpeech: parsePartOfSpeech(data.definitions),
            definitions: parseDefinitions(data.definitions),
            etymology: parseEtymology(data.etymologies),
            synonyms: parseRelated(data.relatedWords, 'synonym'),
            antonyms: parseRelated(data.relatedWords, 'antonym'),
            examples: parseExamples(data.examples),
            relatedWords: parseAllRelated(data.relatedWords),
            rawData: data
        };
    } catch (error) {
        console.error('Dictionary API error:', error);
        throw error;
    }
};

const parsePronunciation = (pronunciations) => {
    if (!pronunciations || !Array.isArray(pronunciations) || pronunciations.length === 0) return '';
    const ipa = pronunciations.find(p => p.rawType === 'IPA') || pronunciations[0];
    return ipa?.raw || '';
};

const parseAudio = (audio) => {
    if (!audio || !Array.isArray(audio) || audio.length === 0) return null;
    return audio[0]?.fileUrl || null;
};

const parsePartOfSpeech = (definitions) => {
    if (!definitions || !Array.isArray(definitions) || definitions.length === 0) return 'unknown';
    return definitions[0]?.partOfSpeech || 'unknown';
};

const parseDefinitions = (definitions) => {
    if (!definitions || !Array.isArray(definitions)) return [];
    return definitions
        .filter(d => d.text)
        .map((d, i) => ({
            id: i + 1,
            text: stripHtml(d.text),
            partOfSpeech: d.partOfSpeech || null,
            source: d.sourceDictionary || null
        }));
};

const parseEtymology = (etymologies) => {
    if (!etymologies || !Array.isArray(etymologies) || etymologies.length === 0) return null;
    return stripHtml(etymologies[0]);
};

const parseRelated = (relatedWords, type) => {
    if (!relatedWords || !Array.isArray(relatedWords)) return [];
    const group = relatedWords.find(r => r.relationshipType === type);
    return group?.words || [];
};

const parseAllRelated = (relatedWords) => {
    if (!relatedWords || !Array.isArray(relatedWords)) return {};
    const result = {};
    for (const group of relatedWords) {
        if (group.relationshipType && group.words?.length) {
            result[group.relationshipType] = group.words;
        }
    }
    return result;
};

const parseExamples = (examplesData) => {
    if (!examplesData?.examples || !Array.isArray(examplesData.examples)) return [];
    return examplesData.examples
        .filter(e => e.text)
        .map(e => stripHtml(e.text));
};

const stripHtml = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim();
};
