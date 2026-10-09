import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Layers, ShieldCheck, Sparkles, Shirt } from 'lucide-react';

export const IntroPage: React.FC = () => {
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
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-[#5c3a1e] hover:text-[#3d2714] font-bold py-1.5 px-2.5 rounded-lg border border-[#8B5A2B]/30 bg-[#FFFDF5] hover:bg-[#f6eee2] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <div className="h-4 w-px bg-[#8B5A2B]/30" />
          <span className="text-xs font-bold text-[#8B5A2B] uppercase tracking-wider">
            Sứ Mệnh & Quy Tắc Di Sản
          </span>
        </div>

        <button
          onClick={() => navigate('/stylist')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B5A2B] text-white text-xs font-bold hover:bg-[#6f4520] transition shadow-xs cursor-pointer"
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Vào phòng thử đồ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Project Mission Statement */}
        <section className="rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] p-6 shadow-md">
          <div className="flex items-center gap-2 mb-3 text-[#8B5A2B]">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Sứ Mệnh Dự Án "Việt Phục Remix"</h2>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed font-sans mb-3">
            Trang phục cổ truyền Việt Nam — tiêu biểu như <strong>Áo Tấc</strong> (áo thụng lễ nghi) và <strong>Áo Ngũ Thân</strong> (áo chẽn thanh nhã) thời Nguyễn — chứa đựng bề dày mỹ cảm và đạo lý truyền thống của dân tộc.
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            <strong>Việt Phục Remix</strong> ra đời nhằm bắc nhịp cầu nối giữa tinh hoa di sản và phong cách sống đương đại của giới trẻ. Thông qua công nghệ Trí tuệ Nhân tạo Gemini và thuật toán kiểm định văn hóa nghiêm ngặt, dự án giúp người dùng tự tin thể hiện cá tính thời trang mà vẫn tuyệt đối gìn giữ và tôn trọng sự chuẩn mực của tiền nhân.
          </p>
        </section>

        {/* The 4 Authoritative Cultural Rules */}
        <section className="rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#8B5A2B]/20 pb-3">
            <div className="flex items-center gap-2 text-[#8B5A2B]">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold uppercase tracking-wide">Bốn Quy Chuẩn Văn Hóa Cốt Lõi</h2>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 font-sans">Dữ liệu tri thức chuẩn mực</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1 */}
            <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/25 bg-[#faf4ea] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#8B5A2B] text-white text-[10px] font-bold uppercase">
                    Quy chuẩn 1 · Kỹ thuật
                  </span>
                  <span className="text-xs font-bold text-[#8B5A2B]">rule_layering_aotac</span>
                </div>
                <h3 className="text-sm font-bold text-[#3d2714] mb-1.5">Lớp Lót Áo Tấc & Áo Ngũ Thân</h3>
                <p className="text-xs text-stone-700 font-sans leading-relaxed">
                  Khi mặc Áo Tấc hoặc Áo Ngũ Thân, bắt buộc phải có áo lót mỏng màu trắng mặc bên trong để lộ viền cổ áo trang nhã. Tuyệt đối không mặc trần cổ.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#8B5A2B]/20 text-[11px] text-[#5c3a1e] font-semibold">
                ✓ Được kiểm tra tự động khi thiếu slot Lớp Lót.
              </div>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/25 bg-[#faf4ea] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#8B5A2B] text-white text-[10px] font-bold uppercase">
                    Quy chuẩn 2 · Cách tân
                  </span>
                  <span className="text-xs font-bold text-[#8B5A2B]">rule_remix_boundary</span>
                </div>
                <h3 className="text-sm font-bold text-[#3d2714] mb-1.5">Ranh Giới Cách Tân & Cung Đình</h3>
                <p className="text-xs text-stone-700 font-sans leading-relaxed">
                  Cho phép tự do phối phụ kiện hiện đại (túi xách, giày bệt, kính mắt) khi dạo phố du xuân. Tuy nhiên, nghiêm cấm phối phụ kiện hiện đại trong không gian Lễ hội cung đình.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#8B5A2B]/20 text-[11px] text-[#5c3a1e] font-semibold">
                ✓ Bảo vệ tính tôn nghiêm lịch sử tuyệt đối.
              </div>
            </div>

            {/* Rule 3 */}
            <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/25 bg-[#faf4ea] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#8B5A2B] text-white text-[10px] font-bold uppercase">
                    Quy chuẩn 3 · Phân cấp
                  </span>
                  <span className="text-xs font-bold text-[#8B5A2B]">rule_color_royal</span>
                </div>
                <h3 className="text-sm font-bold text-[#3d2714] mb-1.5">Đặc Quyền Vàng Chính Sắc</h3>
                <p className="text-xs text-stone-700 font-sans leading-relaxed">
                  Màu Vàng chính sắc (Hoàng thổ) và họa tiết rồng 5 móng là biểu tượng tối thượng của bậc Đế vương triều Nguyễn, không sử dụng cho vai trò dân thường hoặc khách mời.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#8B5A2B]/20 text-[11px] text-[#5c3a1e] font-semibold">
                ✓ Tôn trọng điển chế trang phục triều Nguyễn.
              </div>
            </div>

            {/* Rule 4 */}
            <div className="p-4 rounded-xl border-2 border-[#8B5A2B]/25 bg-[#faf4ea] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#8B5A2B] text-white text-[10px] font-bold uppercase">
                    Quy chuẩn 4 · Phong tục
                  </span>
                  <span className="text-xs font-bold text-[#8B5A2B]">rule_mourning_colors</span>
                </div>
                <h3 className="text-sm font-bold text-[#3d2714] mb-1.5">Kiêng Kỵ Màu Tang Lễ Trong Hỉ Sự</h3>
                <p className="text-xs text-stone-700 font-sans leading-relaxed">
                  Kiêng kỵ sử dụng trang phục mang tính chất tang lễ trong ngày cưới truyền thống hoặc dạo phố du xuân. Quần lụa trắng và áo lót trắng truyền thống là lễ phục chuẩn mực, không tính là đồ tang.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#8B5A2B]/20 text-[11px] text-[#5c3a1e] font-semibold">
                ✓ Phân biệt rõ sắc màu hỉ sự và tang phục.
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="rounded-xl border-2 border-[#8B5A2B]/40 bg-[#fbf7ee] p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="text-base font-bold text-[#5c3a1e]">Sẵn Sàng Trải Nghiệm Thử Đồ Ảo?</h3>
            <p className="text-xs text-stone-600 font-sans">
              Chọn bối cảnh, thử nghiệm trang phục và nhận đánh giá từ AI Stylist ngay bây giờ.
            </p>
          </div>
          <button
            onClick={() => navigate('/stylist')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5A2B] text-white text-xs font-bold shadow-md hover:bg-[#6f4520] transition cursor-pointer"
          >
            <Shirt className="w-4 h-4" />
            <span>Vào phòng thử đồ ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#8B5A2B]/20 bg-[#FFFDF5]/70 px-6 flex items-center justify-between text-[11px] text-stone-500 z-20 font-sans">
        <span>© 2026 Việt Phục Remix · Di Sản & Trí Tuệ Nhân Tạo</span>
        <span>Phát triển cho AI Studio Build</span>
      </footer>
    </div>
  );
};
