import React, { useState, useEffect } from 'react';
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
    
    // Load favorites and history on mount
    useEffect(() => {
        setFavorites(getFavorites());
        setHistory(getHistory());
    }, []);
    
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
        
        // Check cache first
        if (deepDiveCache[word]) {
            setDeepDiveData(deepDiveCache[word]);
            return;
        }
        
        setDeepDiveLoading(true);
        try {
            const data = await getDeepDive(word);
            setDeepDiveData(data);
            setDeepDiveCache(prev => ({ ...prev, [word]: data }));
        } catch (err) {
            console.error("Deep dive error:", err);
        } finally {
            setDeepDiveLoading(false);
        }
    };
    
    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            handleLookup(searchInput);
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
            {/* Back navigation */}
            <Link to="/" className="back-link">
                ← Home
            </Link>
            
            {/* Search bar */}
            <div className="search-bar-top">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Look up any word..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="search-btn"
                        disabled={loading || !searchInput.trim()}
                    >
                        {loading ? '...' : 'Search'}
                    </button>
                </form>
                {searchInput && (
                    <button 
                        className="clear-search-btn"
                        onClick={() => {
                            setSearchInput('');
                            setError(null);
                            setSuggestions([]);
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
            
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
                                            🔊
                                        </button>
                                    )}
                                    <button 
                                        className={`action-btn deep-dive-btn ${deepDiveLoading ? 'loading' : ''}`}
                                        onClick={handleDeepDive}
                                        disabled={deepDiveLoading}
                                        title="Deep Dive with AI"
                                    >
                                        ✦
                                    </button>
                                    <button 
                                        className={`action-btn favorite-btn ${isFavorite(currentWord.word) ? 'favorited' : ''}`}
                                        onClick={toggleFavorite}
                                        title={isFavorite(currentWord.word) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        {isFavorite(currentWord.word) ? '★' : '☆'}
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
                                                {currentWord.synonyms.slice(0, 8).map((syn, i) => (
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
                                                {currentWord.antonyms.slice(0, 8).map((ant, i) => (
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
                            
                            {/* Deep Dive / Discovery Card */}
                            {(deepDiveLoading || deepDiveData) && (
                                <div className={`discovery-card ${deepDiveLoading ? 'shimmer' : ''}`}>
                                    <h3 className="discovery-title">✦ AI Insights</h3>
                                    {deepDiveLoading ? (
                                        <div className="discovery-loading">
                                            <div className="shimmer-line"></div>
                                            <div className="shimmer-line"></div>
                                            <div className="shimmer-line short"></div>
                                        </div>
                                    ) : (
                                        <div className="discovery-content">
                                            <div className="discovery-section">
                                                <h4 className="discovery-label">The Nuance</h4>
                                                <p className="discovery-text">{deepDiveData.nuance}</p>
                                            </div>
                                            <div className="discovery-section">
                                                <h4 className="discovery-label">Literary Context</h4>
                                                <p className="discovery-text">{deepDiveData.literary_history}</p>
                                            </div>
                                            <div className="discovery-section">
                                                <h4 className="discovery-label">Contemporary Scenario</h4>
                                                <p className="discovery-text">{deepDiveData.modern_scenario}</p>
                                            </div>
                                            <div className="discovery-section">
                                                <h4 className="discovery-label">Mnemonic</h4>
                                                <p className="discovery-text mnemonic-text">{deepDiveData.mnemonic}</p>
                                            </div>
                                            <div className="discovery-vibe">
                                                {deepDiveData.vibe_check.map((vibe, i) => (
                                                    <span key={i} className="vibe-tag">#{vibe}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                )}
                
                {!currentWord && !loading && !error && (
                    <div className="welcome-state">
                        <h2 className="welcome-title">Vocabulary Explorer</h2>
                        <p className="welcome-text">
                            Search for any word to explore its definition, etymology, and usage.
                        </p>
                        {history.length > 0 && (
                            <button 
                                className="welcome-action"
                                onClick={() => setShowHistory(true)}
                            >
                                View Recent Searches
                            </button>
                        )}
                        {favorites.length > 0 && (
                            <button 
                                className="welcome-action"
                                onClick={() => setShowFavorites(true)}
                            >
                                View Favorites
                            </button>
                        )}
                    </div>
                )}
                
                {showHistory && !loading && (
                    <div className="word-list">
                        <div className="list-header">
                            <h2 className="list-title">Recent Searches</h2>
                            <button 
                                className="list-close"
                                onClick={() => setShowHistory(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="word-chips">
                            {history.map((word, i) => (
                                <button
                                    key={i}
                                    className="word-chip"
                                    onClick={() => {
                                        setSearchInput(word);
                                        handleLookup(word);
                                    }}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {showFavorites && !loading && (
                    <div className="word-list">
                        <div className="list-header">
                            <h2 className="list-title">Favorites</h2>
                            <button 
                                className="list-close"
                                onClick={() => setShowFavorites(false)}
                            >
                                ×
                            </button>
                        </div>
                        {favorites.length > 0 ? (
                            <div className="word-chips">
                                {favorites.map((fav, i) => (
                                    <button
                                        key={i}
                                        className="word-chip"
                                        onClick={() => {
                                            setSearchInput(fav.word);
                                            handleLookup(fav.word);
                                        }}
                                    >
                                        {fav.word}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-message">No favorites yet. Click the star to save words.</p>
                        )}
                    </div>
                )}
            </div>
            
            {/* Navigation controls */}
            <div className="word-nav-controls">
                <button 
                    className="nav-btn nav-btn--history"
                    onClick={() => setShowHistory(!showHistory)}
                    title={`${history.length} recent searches`}
                >
                    History ({history.length})
                </button>
                <button 
                    className="nav-btn nav-btn--random"
                    onClick={getRandomWord}
                    disabled={favorites.length === 0 && history.length === 0}
                    title="Random from history/favorites"
                >
                    Random
                </button>
                <button 
                    className="nav-btn nav-btn--favorites"
                    onClick={() => setShowFavorites(!showFavorites)}
                    title={`${favorites.length} favorites`}
                >
                    Favorites ({favorites.length})
                </button>
            </div>
        </div>
    );
};

export default UsageDictLayer;
