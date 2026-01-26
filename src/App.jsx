import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import UsageDictLayer from './components/UsageDictLayer';
import './styles/App.css';

function App() {
    pendo.initialize({
  visitor: { id: 'utsav' },
  account: { id: 'utsav' }
});
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/usage" element={<UsageDictLayer isVisible={true} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
