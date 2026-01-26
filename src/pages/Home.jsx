import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="home-page">
            <div className="home-content">
                <h1 className="home-title">Welcome</h1>
                <nav className="home-nav">
                    <Link to="/usage" className="home-link">
                        Usage Dictionary →
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default Home;

