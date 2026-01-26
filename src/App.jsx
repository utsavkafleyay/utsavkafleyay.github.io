import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UsageDictLayer from './components/UsageDictLayer';
import NewPage from './components/NewPage';
import './styles/App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<UsageDictLayer isVisible={true} />} />
                <Route path="/main.aspx" element={<NewPage />} />
            </Routes>
        </Router>
    );
}

export default App;
