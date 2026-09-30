import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { IntroPage } from './pages/IntroPage';
import { StylistPage } from './pages/StylistPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang 1: Trang chính (Main.png nền, tiêu đề hồng, nút play tròn màu xanh lá) */}
        <Route path="/" element={<HomePage />} />

        {/* Trang 2: Lá thư giới thiệu (Màu be, viền nâu đất, chữ chạy từ file introduction.txt, nút skip góc dưới phải) */}
        <Route path="/intro" element={<IntroPage />} />

        {/* Trang 3: Thử đồ ảo 2D cùng Snoopy Stylist & Gemini AI */}
        <Route path="/stylist" element={<StylistPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
