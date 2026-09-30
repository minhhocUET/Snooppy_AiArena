import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EventOption,
  FashionItem,
  ItemCategory,
  SnoopyOutfit,
  GeminiRecommendation,
  ModelGender
} from '../types';
import { EVENTS_DATA, INITIAL_ITEMS } from '../data/mockItems';
import { HumanModel2D } from '../components/HumanModel2D';
import { PlayingCardItem } from '../components/PlayingCardItem';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'ao', label: 'Áo' },
  { id: 'quan', label: 'Quần' },
  { id: 'giay', label: 'Giày/Dép' },
  { id: 'phukien', label: 'Phụ Kiện' }
];

const ITEMS_PER_PAGE = 5;

export const StylistPage: React.FC = () => {
  const navigate = useNavigate();

  // State: Events and Catalog
  const [events, setEvents] = useState<EventOption[]>(EVENTS_DATA);
  const [selectedEventId, setSelectedEventId] = useState<string>('cafe_street');
  const [items, setItems] = useState<FashionItem[]>(INITIAL_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('ao');
  const [modelGender, setModelGender] = useState<ModelGender>('nam');

  // State: Outfit on Human Model
  const [outfit, setOutfit] = useState<SnoopyOutfit>({
    ao: INITIAL_ITEMS.find((i) => i.id === 'ao_001') || null,
    quan: INITIAL_ITEMS.find((i) => i.id === 'quan_001') || null,
    giay: INITIAL_ITEMS.find((i) => i.id === 'giay_001') || null,
    phukien: null
  });

  // State: Detail Modal
  const [detailItem, setDetailItem] = useState<FashionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State: Gemini AI Prompt & Advice
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string>('');

  // State: Row Pagination Indices (0-indexed for 5 items per row view)
  const [suitablePageIndex, setSuitablePageIndex] = useState<number>(0);
  const [unsuitablePageIndex, setUnsuitablePageIndex] = useState<number>(0);

  // Fetch events on mount
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setEvents(data.data);
      })
      .catch(() => {
        setEvents(EVENTS_DATA);
      });
  }, []);

  // Fetch items whenever event changes
  useEffect(() => {
    fetch(`/api/items?event=${selectedEventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setItems(data.data);
        }
      })
      .catch(() => {
        const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
        const enriched = INITIAL_ITEMS.map((item) => {
          const isDirectMatch = item.suitableEvents.includes(selectedEventId);
          const hasTagMatch = item.tags.some((t) => currentEvent.suitableTags.includes(t));
          const isSuitable = isDirectMatch || hasTagMatch;
          return {
            ...item,
            isSuitableForCurrentEvent: isSuitable,
            suitabilityScore: isSuitable ? 95 : 45
          };
        });
        setItems(enriched);
      });

    setSuitablePageIndex(0);
    setUnsuitablePageIndex(0);
  }, [selectedEventId, events]);

  // Reset pagination when category changes
  useEffect(() => {
    setSuitablePageIndex(0);
    setUnsuitablePageIndex(0);
  }, [selectedCategory]);

  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Filter items by category
  const categoryItems = useMemo(() => {
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Split into Suitable and Unsuitable items
  const suitableItems = useMemo(() => {
    return categoryItems.filter((i) => i.isSuitableForCurrentEvent !== false);
  }, [categoryItems]);

  const unsuitableItems = useMemo(() => {
    return categoryItems.filter((i) => i.isSuitableForCurrentEvent === false);
  }, [categoryItems]);

  // 5 items per row view
  const visibleSuitableItems = useMemo(() => {
    const start = suitablePageIndex * ITEMS_PER_PAGE;
    return suitableItems.slice(start, start + ITEMS_PER_PAGE);
  }, [suitableItems, suitablePageIndex]);

  const visibleUnsuitableItems = useMemo(() => {
    const start = unsuitablePageIndex * ITEMS_PER_PAGE;
    return unsuitableItems.slice(start, start + ITEMS_PER_PAGE);
  }, [unsuitableItems, unsuitablePageIndex]);

  const totalSuitablePages = Math.ceil(suitableItems.length / ITEMS_PER_PAGE) || 1;
  const totalUnsuitablePages = Math.ceil(unsuitableItems.length / ITEMS_PER_PAGE) || 1;

  // Click directly on item to wear/remove
  const handleToggleItem = (item: FashionItem) => {
    const cat = item.category;
    if (outfit[cat]?.id === item.id) {
      setOutfit((prev) => ({ ...prev, [cat]: null }));
    } else {
      setOutfit((prev) => ({ ...prev, [cat]: item }));
    }
  };

  const handleRemoveCategory = (cat: keyof SnoopyOutfit) => {
    setOutfit((prev) => ({ ...prev, [cat]: null }));
  };

  const handleResetOutfit = () => {
    setOutfit({
      ao: null,
      quan: null,
      giay: null,
      phukien: null
    });
    setAiNote('');
  };

  const handleOpenDetail = (item: FashionItem) => {
    setDetailItem(item);
    setIsModalOpen(true);
  };

  // Call Gemini API to recommend outfit based on user prompt
  const handleAskGemini = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/gemini/recommend-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          eventId: selectedEventId
        })
      });

      const data = await response.json();
      if (data?.success && data?.data) {
        const result: GeminiRecommendation = data.data;
        setAiNote(result.stylistMessage || result.styleVibe || '');

        if (result.matchedCategories) {
          const newOutfit: SnoopyOutfit = { ...outfit };
          const allItems = INITIAL_ITEMS;

          if (result.matchedCategories.aoId) {
            const item = allItems.find((i) => i.id === result.matchedCategories.aoId);
            if (item) newOutfit.ao = item;
          }
          if (result.matchedCategories.quanId) {
            const item = allItems.find((i) => i.id === result.matchedCategories.quanId);
            if (item) newOutfit.quan = item;
          }
          if (result.matchedCategories.giayId) {
            const item = allItems.find((i) => i.id === result.matchedCategories.giayId);
            if (item) newOutfit.giay = item;
          }
          if (result.matchedCategories.phukienId) {
            const item = allItems.find((i) => i.id === result.matchedCategories.phukienId);
            if (item) newOutfit.phukien = item;
          }

          setOutfit(newOutfit);
        }
      }
    } catch {
      setAiNote('Đã gợi ý phối đồ mẫu phù hợp nhất với sự kiện này.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden text-[#3d2714] flex flex-col select-none relative"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        background: 'radial-gradient(circle at 50% 30%, #faf4e8 0%, #ebe0ce 100%)',
      }}
    >
      {/* Ambient vignette for depth */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(80,45,15,0.08)]" />

      {/* Minimal Top Header - Warm vintage letter style with shadow */}
      <header className="h-10 border-b-2 border-[#8B5A2B]/35 bg-[#FFFDF5] px-4 flex items-center justify-between flex-shrink-0 z-20 shadow-[0_2px_8px_rgba(80,45,15,0.06)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-[#5c3a1e] hover:text-[#3d2714] transition font-bold cursor-pointer py-1 px-2 rounded-md hover:bg-[#f4ede1]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <div className="h-3.5 w-px bg-[#8B5A2B]/30" />
          <span className="text-xs font-bold text-[#8B5A2B] uppercase tracking-widest drop-shadow-2xs">
            Phòng Thử Đồ Ảo • SS Stylist Studio
          </span>
        </div>

        {aiNote && (
          <div className="hidden sm:block text-xs text-[#5c3a1e] italic truncate max-w-md bg-[#f6eee2] px-2.5 py-0.5 rounded-full border border-[#8B5A2B]/25">
            Gợi ý: {aiNote}
          </div>
        )}
      </header>

      {/* Main Studio Body: Fixed Height, Fits Perfectly In Viewport Without Page Scrolling */}
      <div className="flex-1 flex flex-col md:flex-row p-2.5 sm:p-3.5 gap-3 overflow-hidden z-10">
        {/* ================= KHU VỰC TRÁI (1/3 MÀN HÌNH): GỘP CHỌN SỰ KIỆN + MODEL 2D ================= */}
        <section className="w-full md:w-[32%] lg:w-[30%] h-full flex flex-col rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] shadow-[0_16px_40px_rgba(70,40,15,0.16),0_4px_12px_rgba(70,40,15,0.08)] overflow-hidden flex-shrink-0 relative">
          {/* Subtle decorative inner framing border */}
          <div className="absolute inset-1 rounded-xl border border-[#8B5A2B]/20 pointer-events-none" />

          {/* 1. Lựa chọn Model (Nam / Nữ) & Bối cảnh sự kiện ngang hàng trên cùng 1 hàng */}
          <div className="p-2 border-b-2 border-[#8B5A2B]/25 bg-[#f8f3e8] flex-shrink-0 z-10 shadow-xs flex items-center gap-2">
            {/* Lựa chọn giới tính Model: Nam / Nữ */}
            <div className="flex p-0.5 rounded-lg bg-[#ebdcc8] border border-[#8B5A2B]/35 shadow-2xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setModelGender('nam')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modelGender === 'nam'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-[#5c3a1e] hover:text-[#3d2714]'
                }`}
                title="Model Nam"
              >
                <span>👨</span>
                <span>Nam</span>
              </button>
              <button
                type="button"
                onClick={() => setModelGender('nu')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modelGender === 'nu'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-[#5c3a1e] hover:text-[#3d2714]'
                }`}
                title="Model Nữ"
              >
                <span>👩</span>
                <span>Nữ</span>
              </button>
            </div>

            {/* Bối cảnh sự kiện (ngang hàng) */}
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none py-1 pl-2 pr-6 rounded-lg bg-[#FFFDF5] border border-[#8B5A2B]/40 text-xs font-semibold text-[#3d2714] focus:outline-none focus:border-[#8B5A2B] cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.05)] truncate"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B5A2B] text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Model nhân vật người 2D (Nam / Nữ) + Nút làm mới nổi bật ở phía dưới */}
          <div className="flex-1 relative overflow-hidden flex flex-col z-10">
            <HumanModel2D
              outfit={outfit}
              currentEvent={currentEvent}
              gender={modelGender}
              onResetOutfit={handleResetOutfit}
              onRemoveItem={handleRemoveCategory}
            />
          </div>
        </section>

        {/* ================= KHU VỰC PHẢI (2/3 MÀN HÌNH): TÔNG MÀU BE & LÁ THƯ TRUYỀN THỐNG ================= */}
        <section className="w-full md:w-[68%] lg:w-[70%] h-full flex flex-col rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] shadow-[0_16px_40px_rgba(70,40,15,0.16),0_4px_12px_rgba(70,40,15,0.08)] p-2.5 sm:p-3 overflow-hidden flex-shrink-0 justify-between relative">
          {/* Subtle decorative inner framing border */}
          <div className="absolute inset-1 rounded-xl border border-[#8B5A2B]/20 pointer-events-none" />

          {/* 1. KHU VỰC NHỎ NHẬP YÊU CẦU TRÊN CÙNG (GEMINI AI) */}
          <div className="flex-shrink-0 mb-2 z-10">
            <form onSubmit={handleAskGemini} className="flex gap-2">
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Nhập yêu cầu trang phục cho Gemini (VD: Phong cách thanh lịch cho buổi hẹn hò)..."
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#fbf8f0] border border-[#8B5A2B]/35 text-xs text-[#3d2714] placeholder:text-[#a0856c] focus:outline-none focus:border-[#8B5A2B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
              />
              <button
                type="submit"
                disabled={isAiLoading || !userPrompt.trim()}
                className="py-1.5 px-3.5 rounded-lg bg-[#8B5A2B] hover:bg-[#6f4520] active:scale-[0.98] disabled:bg-stone-300 text-white text-xs font-bold tracking-wide shadow-[0_3px_8px_rgba(139,90,43,0.3)] transition cursor-pointer whitespace-nowrap border border-[#6f4520]"
              >
                {isAiLoading ? 'Đang chọn...' : 'Gợi ý từ Gemini'}
              </button>
            </form>
          </div>

          {/* 2. 4 Ô CHIA ĐỀU: 'Áo', 'Quần', 'Giày/Dép', 'Phụ Kiện' */}
          <div className="flex-shrink-0 grid grid-cols-4 gap-2 mb-2 z-10">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#8B5A2B] text-white shadow-[0_4px_10px_rgba(139,90,43,0.35)] border border-[#6f4520]'
                      : 'bg-[#f6eee2] hover:bg-[#ebdcc8] text-[#5c3a1e] border border-[#8B5A2B]/30 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 3. KHU VỰC TRANG PHỤC (3/4 PHẦN DƯỚI): 2 HÀNG PHÙ HỢP & KHÔNG PHÙ HỢP */}
          <div className="flex-1 flex flex-col justify-between gap-2.5 overflow-hidden min-h-0 z-10">
            {/* HÀNG 1: TRANG PHỤC PHÙ HỢP */}
            <div className="flex-1 flex flex-col justify-between p-2 rounded-xl border-2 border-[#8B5A2B]/30 bg-[#fbf7ee] shadow-[inset_0_2px_6px_rgba(100,60,20,0.05),0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden min-h-0">
              <div className="flex items-center justify-between mb-1 flex-shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B5A2B] drop-shadow-2xs">
                  Trang phục phù hợp ({suitableItems.length})
                </span>
                <span className="text-[11px] text-[#8B5A2B]/75 italic">
                  Click vào trang phục để mặc ngay • Di chuột để xem thông tin
                </span>
              </div>

              {/* 5 Hộp trang phục: chiều cao linh hoạt, không bị che khuất chữ hay thông tin */}
              <div className="flex-1 flex items-center justify-start gap-2.5 overflow-hidden py-0.5">
                {visibleSuitableItems.length > 0 ? (
                  visibleSuitableItems.map((item) => (
                    <PlayingCardItem
                      key={item.id}
                      item={item}
                      isWorn={outfit[item.category]?.id === item.id}
                      onOpenDetail={handleOpenDetail}
                      onQuickToggle={handleToggleItem}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-xs text-stone-400 py-4 italic">
                    Không có trang phục
                  </div>
                )}
              </div>

              {/* Mũi tên chuyển trang phục ở phía dưới hàng 1 */}
              <div className="flex items-center justify-end gap-1.5 pt-1 flex-shrink-0">
                <button
                  onClick={() => setSuitablePageIndex((p) => Math.max(0, p - 1))}
                  disabled={suitablePageIndex === 0}
                  className="p-1 rounded-md bg-[#d9be9b] hover:bg-[#cbb08c] disabled:opacity-30 disabled:cursor-not-allowed text-[#4a2e16] border border-[#b89a74] shadow-2xs hover:shadow-xs transition cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[#5c3a1e] px-1.5">
                  {suitablePageIndex + 1} / {totalSuitablePages}
                </span>
                <button
                  onClick={() =>
                    setSuitablePageIndex((p) => Math.min(totalSuitablePages - 1, p + 1))
                  }
                  disabled={suitablePageIndex >= totalSuitablePages - 1}
                  className="p-1 rounded-md bg-[#d9be9b] hover:bg-[#cbb08c] disabled:opacity-30 disabled:cursor-not-allowed text-[#4a2e16] border border-[#b89a74] shadow-2xs hover:shadow-xs transition cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* HÀNG 2: TRANG PHỤC KHÔNG PHÙ HỢP */}
            <div className="flex-1 flex flex-col justify-between p-2 rounded-xl border-2 border-[#8B5A2B]/25 bg-[#f6eee2] shadow-[inset_0_2px_6px_rgba(100,60,20,0.04),0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden min-h-0">
              <div className="flex items-center justify-between mb-1 flex-shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Trang phục không phù hợp ({unsuitableItems.length})
                </span>
                <span className="text-[11px] text-stone-500 italic">
                  Lệch bối cảnh sự kiện
                </span>
              </div>

              {/* 5 Hộp trang phục */}
              <div className="flex-1 flex items-center justify-start gap-2.5 overflow-hidden py-0.5">
                {visibleUnsuitableItems.length > 0 ? (
                  visibleUnsuitableItems.map((item) => (
                    <PlayingCardItem
                      key={item.id}
                      item={item}
                      isWorn={outfit[item.category]?.id === item.id}
                      onOpenDetail={handleOpenDetail}
                      onQuickToggle={handleToggleItem}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-xs text-stone-400 py-4 italic">
                    Tất cả các món đều phù hợp
                  </div>
                )}
              </div>

              {/* Mũi tên chuyển trang phục ở phía dưới hàng 2 */}
              <div className="flex items-center justify-end gap-1.5 pt-1 flex-shrink-0">
                <button
                  onClick={() => setUnsuitablePageIndex((p) => Math.max(0, p - 1))}
                  disabled={unsuitablePageIndex === 0}
                  className="p-1 rounded-md bg-[#d9be9b] hover:bg-[#cbb08c] disabled:opacity-30 disabled:cursor-not-allowed text-[#4a2e16] border border-[#b89a74] shadow-2xs hover:shadow-xs transition cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[#5c3a1e] px-1.5">
                  {unsuitablePageIndex + 1} / {totalUnsuitablePages}
                </span>
                <button
                  onClick={() =>
                    setUnsuitablePageIndex((p) => Math.min(totalUnsuitablePages - 1, p + 1))
                  }
                  disabled={unsuitablePageIndex >= totalUnsuitablePages - 1}
                  className="p-1 rounded-md bg-[#d9be9b] hover:bg-[#cbb08c] disabled:opacity-30 disabled:cursor-not-allowed text-[#4a2e16] border border-[#b89a74] shadow-2xs hover:shadow-xs transition cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Pop-up Chi Tiết Sản Phẩm (Dạng phong thư lá bài phóng to ~1/3 màn hình, nút đóng góc trên bên phải, nút Chọn nổi bật) */}
      <ItemDetailModal
        item={detailItem}
        isOpen={isModalOpen}
        isWorn={Boolean(detailItem && outfit[detailItem.category]?.id === detailItem.id)}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleToggleItem}
      />
    </div>
  );
};
