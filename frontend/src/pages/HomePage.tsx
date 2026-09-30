import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/intro');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Background using Main.png (from shared link) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: "url('/Main.png')",
        }}
      >
        {/* Cinematic gradient overlay matching atmospheric palette */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-900/20 to-stone-950/60" />
      </div>

      {/* Central Interactive Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-3xl animate-fade-in">
        {/* Title: SS - Snoopy stylist in refined harmonious styling with Times New Roman / Serif font */}
        <div className="mb-10 flex flex-col items-center">
          <span
            className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-amber-200/90 mb-2 drop-shadow-md"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            VINTAGE FASHION STUDIO
          </span>
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#ff7597] drop-shadow-2xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              textShadow:
                '0 4px 20px rgba(255, 117, 151, 0.45), 0 2px 6px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7)',
            }}
          >
            SS - Snoopy stylist
          </h1>
          <p
            className="mt-4 text-[#fbf5e6] text-sm sm:text-base font-serif italic max-w-lg mx-auto drop-shadow-lg leading-relaxed"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)',
            }}
          >
            Hành trình thời trang cổ điển & phá cách cùng trợ lý tạo mẫu
          </p>
        </div>

        {/* Circular Play Button: Dominant green tone with darker green play triangle */}
        <div className="relative group cursor-pointer" onClick={handleStart}>
          {/* Ambient glow effect with depth */}
          <div className="absolute -inset-4 rounded-full bg-emerald-500/25 group-hover:bg-emerald-400/40 blur-xl transition-all duration-300 animate-pulse" />

          <button
            onClick={handleStart}
            aria-label="Bắt đầu trải nghiệm"
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:scale-95 shadow-[0_12px_28px_rgba(5,150,105,0.45),0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(16,185,129,0.6),0_6px_14px_rgba(0,0,0,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center border-4 border-emerald-300/80 group-hover:border-emerald-100 cursor-pointer"
          >
            {/* Play triangle inside, dark green with sharp shadow */}
            <div className="w-0 h-0 border-y-[14px] sm:border-y-[16px] border-y-transparent border-l-[24px] sm:border-l-[28px] border-l-[#064e3b] ml-1.5 sm:ml-2 drop-shadow-md transition-transform group-hover:scale-110" />
          </button>
        </div>

        <div
          className="mt-5 text-xs font-bold text-amber-100/90 uppercase tracking-[0.25em] drop-shadow-md"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
          }}
        >
          Nhấn để bắt đầu
        </div>
      </div>

      {/* Decorative corner footer */}
      <div
        className="absolute bottom-4 inset-x-0 flex justify-center text-center text-xs text-amber-100/70 font-serif drop-shadow-sm pointer-events-none"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        © SS - Snoopy Stylist • Virtual Fitting Room
      </div>
    </div>
  );
};

