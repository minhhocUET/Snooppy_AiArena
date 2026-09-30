import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FastForward, Sparkles, Feather } from 'lucide-react';

export const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullText, setFullText] = useState<string>('');
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);

  // Fallback text if file loading fails
  const defaultIntroduction = `Chào mừng bạn đến với SS - Snoopy Stylist!

Nơi gu thẩm mỹ tinh tế, nét chấm phá cổ điển hòa quyện cùng tinh thần tự do phóng khoáng để kiến tạo nên những bộ trang phục mang đậm dấu ấn cá nhân.

Hãy cùng trợ lý thời trang khám phá và lựa chọn những món đồ hoàn hảo nhất cho từng bối cảnh của bạn. Đã đến lúc thỏa sức thử nghiệm, phối ngẫu ngẫu hứng và tự tin tỏa sáng!`;

  // 1. Load introduction text from public/introduction.txt
  useEffect(() => {
    fetch('/introduction.txt')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then((data) => {
        setFullText(data.trim() || defaultIntroduction);
      })
      .catch(() => {
        setFullText(defaultIntroduction);
      });
  }, []);

  // 2. Typewriter / gradual text reveal effect
  useEffect(() => {
    if (!fullText) return;

    if (displayedLength < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedLength((prev) => Math.min(prev + 1, fullText.length));
      }, 18);
      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [displayedLength, fullText]);

  const handleSkipOrContinue = () => {
    navigate('/stylist');
  };

  const currentVisibleText = fullText.slice(0, displayedLength);

  return (
    <div
      className="relative h-screen w-screen flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Background using Main.png from the shared link, matching user request */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: "url('/Main.png')",
        }}
      >
        {/* Atmospheric darkening overlay to give extreme depth to the central letter */}
        <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-[3px]" />
      </div>

      {/* Center envelope / letter container: exactly ~2/3 screen, fits viewport without scrolling, earth brown border, yellowish white inside, light shadow with depth */}
      <div className="relative z-10 w-full max-w-2xl max-h-[82vh] my-auto flex flex-col justify-between rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] shadow-[0_25px_60px_rgba(0,0,0,0.55),0_10px_25px_rgba(0,0,0,0.3)] p-5 sm:p-7 transition-all duration-300">
        {/* Soft depth ambient shadow and inner decorative postal lines */}
        <div className="absolute inset-2 sm:inset-2.5 rounded-xl border border-[#8B5A2B]/30 pointer-events-none" />

        {/* Vintage postal stamp & seal header */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#8B5A2B]/20 pb-3 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-[#8B5A2B]">
            <Feather className="w-4 h-4" />
            <span className="italic text-xs sm:text-sm font-semibold tracking-wider">
              Thư gửi từ Snoopy Stylist Studio
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded border border-dashed border-[#8B5A2B]/60 text-[10px] uppercase tracking-widest text-[#8B5A2B]/80 bg-[#f8f3e6]">
              PARIS • VINTAGE
            </div>
            <div className="w-6 h-6 rounded-full border border-[#8B5A2B]/40 flex items-center justify-center text-xs bg-amber-100/50 shadow-xs">
              🐾
            </div>
          </div>
        </div>

        {/* Letter Text Content: Centered, Times New Roman serif, gradual typewriter appearance */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2 px-2 sm:px-4 overflow-hidden">
          <div className="text-center text-stone-800 leading-relaxed sm:leading-loose text-sm sm:text-base space-y-3 max-w-xl mx-auto">
            {currentVisibleText.split('\n\n').map((paragraph, idx) => (
              <p
                key={idx}
                className="first-letter:text-xl sm:first-letter:text-2xl first-letter:font-bold first-letter:text-[#8B5A2B]"
              >
                {paragraph}
              </p>
            ))}

            {!isTypingComplete && (
              <span className="inline-block w-1.5 h-4 bg-[#8B5A2B] ml-1 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Bottom letter footer & Skip Button in light earth brown at bottom-right */}
        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[#8B5A2B]/20 mt-2 flex-shrink-0">
          <div className="text-[11px] text-stone-500 italic hidden sm:flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Hành trình thời trang đang chờ bạn...</span>
          </div>

          <button
            onClick={handleSkipOrContinue}
            className="ml-auto px-4 py-2 rounded-lg font-bold text-xs sm:text-sm text-[#4a2e16] bg-[#d9be9b] hover:bg-[#cbb08c] active:scale-95 shadow-md hover:shadow-lg border border-[#b89a74] transition-all duration-200 flex items-center gap-1.5 group cursor-pointer"
          >
            <span>{isTypingComplete ? 'Khám phá ngay' : 'Bỏ qua (Skip)'}</span>
            <FastForward className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
