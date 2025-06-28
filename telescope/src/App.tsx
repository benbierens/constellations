import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ConstellationPage from './pages/ConstellationPage';

function App() {
  return (
    <Router>
      <nav style={{ padding: 8, borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: 16 }}>Home</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/constellation/:id" element={<ConstellationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
