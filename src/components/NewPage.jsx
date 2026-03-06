import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { words as curatedWords } from '../data/usageWords';

const PARTS_OF_SPEECH = ['all', ...new Set(curatedWords.map(w => w.partOfSpeech))];

const NewPage = () => {
    const [filter, setFilter] = useState('all');
    const [expandedWord, setExpandedWord] = useState(null);
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        if (filter === 'all') return curatedWords;
        return curatedWords.filter(w => w.partOfSpeech === filter);
    }, [filter]);

    const handleLookup = (word) => {
        navigate(`/?lookup=${encodeURIComponent(word)}`);
    };

    return (
        <div className="layer usage-dict-layer visible">
            <div className="word-container" style={{ maxWidth: '70vw' }}>
                <Link to="/" className="back-link">← Dictionary</Link>

                <article className="word-entry" style={{ marginTop: 'var(--space-md)' }}>
                    <header className="word-header">
                        <h1 className="word-main" style={{ fontSize: 'clamp(2rem, 1.5rem + 1.5vw, 3rem)' }}>
                            Writer's Word Collection
                        </h1>
                        <div className="word-meta">
                            <span className="word-pronunciation">
                                {filtered.length} {filtered.length === 1 ? 'word' : 'words'}
                            </span>
                            <span className="word-pos">curated for fiction</span>
                        </div>
                    </header>

                    <div className="word-body">
                        <div className="collection-filters">
                            {PARTS_OF_SPEECH.map(pos => (
                                <button
                                    key={pos}
                                    className={`related-tag ${filter === pos ? 'filter-active' : ''}`}
                                    onClick={() => setFilter(pos)}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>

                        <div className="collection-grid">
                            {filtered.map((entry, i) => (
                                <div
                                    key={entry.word}
                                    className={`collection-card ${expandedWord === i ? 'expanded' : ''}`}
                                    onClick={() => setExpandedWord(expandedWord === i ? null : i)}
                                >
                                    <div className="collection-card-header">
                                        <h3 className="collection-word">{entry.word}</h3>
                                        <span className="collection-pos">{entry.partOfSpeech}</span>
                                    </div>
                                    <p className="collection-def">{entry.definition}</p>

                                    {expandedWord === i && (
                                        <div className="collection-expanded">
                                            <p className="collection-pronunciation">{entry.pronunciation}</p>
                                            <blockquote className="collection-example">
                                                "{entry.example}"
                                            </blockquote>
                                            <p className="collection-etymology">
                                                <span className="etymology-label">Origin:</span> {entry.etymology}
                                            </p>
                                            <button
                                                className="collection-lookup-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLookup(entry.word);
                                                }}
                                            >
                                                Full lookup →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default NewPage;
