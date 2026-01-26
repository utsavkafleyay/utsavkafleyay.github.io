import React from 'react';
import { Link } from 'react-router-dom';

const NewPage = () => {
    return (
        <div className="layer usage-dict-layer visible">
            <div className="word-container">
                <article className="word-entry">
                    <header className="word-header">
                        <h1 className="word-main">New Page</h1>
                    </header>
                    <div className="word-body">
                        <p>This is the new page at <code>/main.aspx</code>.</p>
                        <Link to="/" className="related-tag" style={{ display: 'inline-block', marginTop: '1rem' }}>
                            ← Back to Dictionary
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default NewPage;
