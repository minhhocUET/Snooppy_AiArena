import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { IntroPage } from './pages/IntroPage';
import { StylistPage } from './pages/StylistPage';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/stylist" element={<StylistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
