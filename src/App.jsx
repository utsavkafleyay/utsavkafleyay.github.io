import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
                <Route path="/" element={<UsageDictLayer isVisible={true} />} />
            </Routes>
        </Router>
    );
}

export default App;
