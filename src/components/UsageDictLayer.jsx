import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { lookupWord, lookupThesaurus } from '../services/dictionaryApi';
import { getDeepDive } from '../services/geminiApi';
import { 
    getFavorites, 
    addFavorite, 
    removeFavorite, 
    isFavorite,
    getHistory,
    addToHistory 
} from '../utils/storage';
import { words as curatedWords } from '../data/usageWords';

// Get a deterministic "word of the day" based on date
const getWordOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const index = dayOfYear % curatedWords.length;
    return curatedWords[index].word;
};

const UsageDictLayer = ({ isVisible }) => {
    const [searchInput, setSearchInput] = useState('');
    const [currentWord, setCurrentWord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deepDiveLoading, setDeepDiveLoading] = useState(false);
    const [deepDiveData, setDeepDiveData] = useState(null);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [deepDiveCache, setDeepDiveCache] = useState({});
    const [searchBarVisible, setSearchBarVisible] = useState(false);
    const [insightPanelOpen, setInsightPanelOpen] = useState(false);
    
    // Refs for focus management
    const searchInputRef = useRef(null);
    const previousFocusRef = useRef(null);
    const spotlightRef = useRef(null);
    
    // Load favorites and history on mount
    useEffect(() => {
        setFavorites(getFavorites());
        setHistory(getHistory());
    }, []);
    
    // Load word of the day on initial mount
    useEffect(() => {
        const wordOfTheDay = getWordOfTheDay();
        handleLookup(wordOfTheDay);
    }, []);
    
    // Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux) to toggle, Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchBarVisible(prev => {
                    if (!prev) {
                        // Opening: save current focus
                        previousFocusRef.current = document.activeElement;
                    }
                    return !prev;
                });
            }
            if (e.key === 'Escape' && searchBarVisible) {
                e.preventDefault();
                setSearchBarVisible(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchBarVisible]);
    
    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (spotlightRef.current && !spotlightRef.current.contains(e.target)) {
                setSearchBarVisible(false);
            }
        };
        
        if (searchBarVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchBarVisible]);
    
    // Focus management: focus input on open, restore focus on close
    useEffect(() => {
        if (searchBarVisible) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 10);
        } else {
            // Restore previous focus
            previousFocusRef.current?.focus();
        }
    }, [searchBarVisible]);
    
    // Lookup a word
    const handleLookup = async (word) => {
        if (!word || !word.trim()) return;
        
        setLoading(true);
        setError(null);
        setSuggestions([]);
        setShowFavorites(false);
        setShowHistory(false);
        setDeepDiveData(null);
        
        try {
            const result = await lookupWord(word);
            
            if (result.notFound) {
                setSuggestions(result.suggestions);
                setError(`"${word}" not found. Did you mean one of these?`);
                setCurrentWord(null);
            } else {
                // Try to get thesaurus data
                const thesaurus = await lookupThesaurus(word);
                const wordData = {
                    ...result,
                    synonyms: thesaurus.synonyms.length > 0 ? thesaurus.synonyms : result.synonyms,
                    antonyms: thesaurus.antonyms.length > 0 ? thesaurus.antonyms : result.antonyms
                };
                
                setCurrentWord(wordData);
                addToHistory(word.trim().toLowerCase());
                setHistory(getHistory());
            }
        } catch (err) {
            setError(`Error loading word: ${err.message}`);
            setCurrentWord(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle Deep Dive
    const handleDeepDive = async () => {
        if (!currentWord) return;
        
        const word = currentWord.word.toLowerCase();
        
        // If panel is open and we have data, toggle it closed
        if (insightPanelOpen && deepDiveData) {
            setInsightPanelOpen(false);
            return;
        }
        
        // Check cache first
        if (deepDiveCache[word]) {
            setDeepDiveData(deepDiveCache[word]);
            setInsightPanelOpen(true);
            return;
        }
        
        setDeepDiveLoading(true);
        setInsightPanelOpen(true);
        try {
            const data = await getDeepDive(word);
            setDeepDiveData(data);
            setDeepDiveCache(prev => ({ ...prev, [word]: data }));
        } catch (err) {
            console.error("Deep dive error:", err);
            setInsightPanelOpen(false);
        } finally {
            setDeepDiveLoading(false);
        }
    };
    
    // Close insight panel
    const closeInsightPanel = () => {
        setInsightPanelOpen(false);
    };
    
    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            handleLookup(searchInput);
            setSearchBarVisible(false);
        }
    };
    
    // Toggle favorite
    const toggleFavorite = () => {
        if (!currentWord) return;
        
        if (isFavorite(currentWord.word)) {
            removeFavorite(currentWord.word);
        } else {
            addFavorite(currentWord);
        }
        setFavorites(getFavorites());
    };
    
    // Play audio
    const playAudio = () => {
        if (currentWord?.audio) {
            const audio = new Audio(currentWord.audio);
            audio.play().catch(err => console.error('Audio playback error:', err));
        }
    };
    
    // Get random word from history or favorites
    const getRandomWord = () => {
        const source = favorites.length > 0 ? favorites : history.slice(0, 10);
        if (source.length > 0) {
            const random = source[Math.floor(Math.random() * source.length)];
            const word = typeof random === 'string' ? random : random.word;
            setSearchInput(word);
            handleLookup(word);
        }
    };
    
    return (
        <div className={`layer usage-dict-layer ${isVisible ? 'visible' : ''}`}>
            {/* Spotlight-style floating search bar (Cmd+K to toggle) */}
            {searchBarVisible && (
                <div className="spotlight-overlay">
                    <div className="spotlight-search" ref={spotlightRef}>
                        <form onSubmit={handleSearch}>
                            <div className="spotlight-input-wrapper">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search for a word..."
                                    className="spotlight-input"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        className="spotlight-clear"
                                        onClick={() => setSearchInput('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Word content */}
            <div className="word-container">
                {loading && (
                    <div className="loading-state">
                        <p>Loading...</p>
                    </div>
                )}
                
                {error && !loading && (
                    <div className="error-state">
                        <p className="error-message">{error}</p>
                        {suggestions.length > 0 && (
                            <div className="suggestions">
                                <p className="suggestions-label">Suggestions:</p>
                                <div className="suggestions-list">
                                    {suggestions.slice(0, 10).map((suggestion, i) => (
                                        <button
                                            key={i}
                                            className="suggestion-btn"
                                            onClick={() => {
                                                setSearchInput(suggestion);
                                                handleLookup(suggestion);
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {currentWord && !loading && (
                    <article className="word-entry">
                        <header className="word-header">
                            <div className="word-title-row">
                                <h1 className="word-main">{currentWord.word}</h1>
                                <div className="word-actions">
                                    {currentWord.audio && (
                                        <button 
                                            className="action-btn audio-btn"
                                            onClick={playAudio}
                                            title="Play pronunciation"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                                            </svg>
                                        </button>
                                    )}
                                    <button 
                                        className={`action-btn deep-dive-btn ${deepDiveLoading ? 'loading' : ''} ${insightPanelOpen ? 'active' : ''}`}
                                        onClick={handleDeepDive}
                                        disabled={deepDiveLoading}
                                        title={insightPanelOpen ? "Hide AI Insight" : "AI Insight"}
                                    >
                                        AI Insight ✦
                                    </button>
                                    <button 
                                        className={`action-btn favorite-btn ${isFavorite(currentWord.word) ? 'favorited' : ''}`}
                                        onClick={toggleFavorite}
                                        title={isFavorite(currentWord.word) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(currentWord.word) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="word-meta">
                                <span className="word-pronunciation">{currentWord.pronunciation}</span>
                                <span className="word-pos">{currentWord.partOfSpeech}</span>
                            </div>
                        </header>
                        
                        <div className="word-body">
                            {currentWord.definitions && currentWord.definitions.length > 0 && (
                                <div className="definitions-section">
                                    <h3 className="section-title">Definitions</h3>
                                    {currentWord.definitions.map((def) => (
                                        <p key={def.id} className="word-definition">
                                            {def.id}. {def.text}
                                        </p>
                                    ))}
                                </div>
                            )}
                            
                            {currentWord.etymology && (
                                <div className="etymology-section">
                                    <p className="word-etymology">
                                        <span className="etymology-label">Etymology:</span> {currentWord.etymology}
                                    </p>
                                </div>
                            )}
                            
                            {currentWord.examples && currentWord.examples.length > 0 && (
                                <div className="examples-section">
                                    <h3 className="section-title">Examples</h3>
                                    {currentWord.examples.slice(0, 3).map((example, i) => (
                                        <blockquote key={i} className="word-example">
                                            "{example}"
                                        </blockquote>
                                    ))}
                                </div>
                            )}
                            
                            {(currentWord.synonyms.length > 0 || currentWord.antonyms.length > 0) && (
                                <div className="related-words-section">
                                    {currentWord.synonyms.length > 0 && (
                                        <div className="related-group">
                                            <h4 className="related-title">Synonyms</h4>
                                            <div className="related-tags">
                                                {currentWord.synonyms.slice(0, 5).map((syn, i) => (
                                                    <button
                                                        key={i}
                                                        className="related-tag"
                                                        onClick={() => {
                                                            setSearchInput(syn);
                                                            handleLookup(syn);
                                                        }}
                                                    >
                                                        {syn}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {currentWord.antonyms.length > 0 && (
                                        <div className="related-group">
                                            <h4 className="related-title">Antonyms</h4>
                                            <div className="related-tags">
                                                {currentWord.antonyms.slice(0, 5).map((ant, i) => (
                                                    <button
                                                        key={i}
                                                        className="related-tag"
                                                        onClick={() => {
                                                            setSearchInput(ant);
                                                            handleLookup(ant);
                                                        }}
                                                    >
                                                        {ant}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                )}
                
            </div>
            
            {/* AI Insight Panel - slides in from right */}
            <aside className={`insight-panel ${insightPanelOpen ? 'open' : ''}`}>
                <button className="insight-panel-close" onClick={closeInsightPanel} title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                
                {deepDiveLoading && (
                    <div className="insight-content">
                        <h3 className="discovery-title">AI Insight</h3>
                        <div className="discovery-loading">
                            <div className="shimmer-line"></div>
                            <div className="shimmer-line short"></div>
                            <div className="shimmer-line"></div>
                            <div className="shimmer-line"></div>
                            <div className="shimmer-line short"></div>
                        </div>
                    </div>
                )}
                
                {deepDiveData && !deepDiveLoading && (
                    <div className="insight-content">
                        <h3 className="discovery-title">AI Insight</h3>
                        
                        {deepDiveData.reach_for_when && (
                            <div className="discovery-section">
                                <p className="discovery-label">Reach for this word when</p>
                                <p className="discovery-text reach-for-text">{deepDiveData.reach_for_when}</p>
                            </div>
                        )}
                        
                        {deepDiveData.transformation && (
                            <div className="discovery-section transformation-section">
                                <p className="discovery-label">Transformation</p>
                                <div className="transformation-compare">
                                    <div className="transformation-before">
                                        <span className="transform-tag">Before</span>
                                        <p className="transform-text">{deepDiveData.transformation.before}</p>
                                    </div>
                                    <div className="transformation-after">
                                        <span className="transform-tag">After</span>
                                        <p className="transform-text">{deepDiveData.transformation.after}</p>
                                    </div>
                                </div>
                                {deepDiveData.transformation.why && (
                                    <p className="transformation-why">{deepDiveData.transformation.why}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
};

export default UsageDictLayer;
