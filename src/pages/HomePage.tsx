import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shirt, ShieldCheck, Compass, ArrowRight, BookOpen } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-[#3d2714] select-none"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        background: 'radial-gradient(circle at 50% 25%, #faf4e8 0%, #ebe0ce 100%)',
      }}
    >
      {/* Ambient vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(80,45,15,0.08)]" />

      {/* Top Header */}
      <header className="h-14 border-b-2 border-[#8B5A2B]/30 bg-[#FFFDF5]/90 backdrop-blur-xs px-6 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            VP
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#8B5A2B] uppercase tracking-wider">
              Việt Phục Remix
            </h1>
            <p className="text-[10px] text-stone-500 font-sans">
              Thời trang di sản & Trợ lý AI
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate('/intro')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#8B5A2B]/30 bg-[#fbf7ee] text-xs font-bold text-[#5c3a1e] hover:bg-[#ede0cd] transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#8B5A2B]" />
            <span>Giới thiệu & Sứ mệnh</span>
          </button>
          <button
            onClick={() => navigate('/stylist')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B5A2B] text-white text-xs font-bold hover:bg-[#6f4520] transition shadow-xs cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Vào phòng thử đồ</span>
          </button>
        </nav>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto text-center">
        {/* Emblem Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8B5A2B]/35 bg-[#FFFDF5] text-xs font-semibold text-[#8B5A2B] mb-5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Sân chơi Thời trang Di sản & Trí tuệ Nhân tạo Gemini</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3d2714] leading-tight mb-4 tracking-normal">
          Tôn Vinh Di Sản Việt Phục <br className="hidden sm:inline" />
          <span className="text-[#8B5A2B]">Hòa Cùng Hơi Thở Cách Tân</span>
        </h2>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
          Trải nghiệm thử đồ ảo 2D cùng Áo Tấc, Áo Ngũ Thân truyền thống. Khám phá phong cách phối đồ độc đáo, nhận tư vấn thông minh từ Gemini AI và kiểm tra độ chuẩn mực văn hóa tức thì.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-14">
          <button
            onClick={() => navigate('/stylist')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#8B5A2B] text-white text-sm font-bold shadow-md hover:bg-[#6f4520] hover:shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Shirt className="w-4 h-4" />
            <span>Bắt đầu phối đồ ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/intro')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#8B5A2B]/40 bg-[#FFFDF5] text-sm font-bold text-[#5c3a1e] hover:bg-[#f6eee2] transition cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#8B5A2B]" />
            <span>Tìm hiểu sứ mệnh dự án</span>
          </button>
        </div>

        {/* Three Value Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/30 bg-[#FFFDF5] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#8B5A2B]/10 flex items-center justify-center text-[#8B5A2B] mb-2.5">
              <Shirt className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#5c3a1e] mb-1">Thử Đồ Ảo 2D Trực Quan</h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Mô phỏng chân thực các lớp áo (áo lót, áo chính, quần lụa, phụ kiện) trên mannequin tỷ lệ chuẩn.
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/30 bg-[#FFFDF5] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#8B5A2B]/10 flex items-center justify-center text-[#8B5A2B] mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-[#5c3a1e] mb-1">Tư Vấn Gu Với Gemini AI</h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Đề xuất bộ trang phục chuẩn ngữ cảnh (lễ tốt nghiệp, dạo xuân, cung đình) kèm lời bình phong cách.
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/30 bg-[#FFFDF5] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#8B5A2B]/10 flex items-center justify-center text-[#8B5A2B] mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-sm font-bold text-[#5c3a1e] mb-1">Kiểm Tra Chuẩn Mực Văn Hóa</h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Thuật toán kiểm định đối chiếu các quy chuẩn lễ phục, phát hiện thiếu lớp áo và gợi ý điều chỉnh tức thời.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#8B5A2B]/20 bg-[#FFFDF5]/70 px-6 flex items-center justify-between text-[11px] text-stone-500 z-20 font-sans">
        <span>© 2026 Việt Phục Remix · Di Sản & Trí Tuệ Nhân Tạo</span>
        <span>Phát triển cho AI Studio Build</span>
      </footer>
    </div>
  );
};
