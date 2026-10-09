import React from 'react';
import { Item } from '../types';
import { Check, Info, ShieldCheck, Sparkles, X } from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  isWorn: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  isWorn,
  onClose,
  onSelect,
}) => {
  if (!isOpen || !item) return null;

  const hasImage = item.assets?.thumbnail?.status === 'READY' && item.assets.thumbnail.path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
      <div
        className="relative w-full max-w-lg rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          backgroundImage: 'radial-gradient(circle at 50% 10%, #faf4e8 0%, #FFFDF5 100%)',
        }}
      >
        {/* Subtle decorative inner border */}
        <div className="absolute inset-1 rounded-xl border border-[#8B5A2B]/20 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-[#8B5A2B]/20 pb-3 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#8B5A2B] px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                {item.category === 'top' ? (item.render.layer === 'underlayer' ? 'Lớp Lót' : 'Áo') : item.category}
              </span>
              {item.culture?.origin && (
                <span className="text-xs font-semibold text-[#8B5A2B]">
                  {item.culture.origin}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-xl font-bold text-[#3d2714]">{item.name}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#8B5A2B] hover:bg-[#f2e7d5] transition cursor-pointer"
            aria-label="Đóng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 z-10 text-xs text-[#3d2714]">
          {/* Item Image Showcase */}
          <div className="flex items-center justify-center rounded-xl border border-[#8B5A2B]/20 bg-[#faf3e3] p-4 min-h-[140px]">
            {hasImage ? (
              <img
                src={item.assets.thumbnail.status === 'READY' ? item.assets.thumbnail.path : ''}
                alt={item.name}
                className="max-h-36 object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3">
                <Sparkles className="w-8 h-8 text-[#8B5A2B]/60 mb-2" />
                <p className="font-semibold text-stone-700">Bản phác thảo trang phục 2D</p>
                <span className="text-[10px] text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded mt-1 font-semibold border border-amber-300">
                  Đang cập nhật hình ảnh tư liệu (PENDING_ASSET)
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold text-[#5c3a1e] uppercase text-[11px] mb-1">Mô tả sản phẩm</h3>
            <p className="text-stone-700 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-lg border border-[#8B5A2B]/15">
              {item.description}
            </p>
          </div>

          {/* Cultural Context & Heritage */}
          {(item.culture?.meaning || (Array.isArray(item.culture?.characteristics) && item.culture.characteristics.length > 0)) && (
            <div>
              <div className="flex items-center gap-1.5 font-bold text-[#8B5A2B] uppercase text-[11px] mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ý nghĩa văn hóa & Đặc trưng</span>
              </div>
              <div className="rounded-lg border border-[#8B5A2B]/20 bg-[#fdf9f0] p-2.5 space-y-2">
                {item.culture.meaning && (
                  <p className="italic text-stone-700">
                    "{item.culture.meaning}"
                  </p>
                )}
                {Array.isArray(item.culture.characteristics) && item.culture.characteristics.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                    {item.culture.characteristics.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Material & Attributes */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {item.metadata?.materials && item.metadata.materials.length > 0 && (
              <div className="rounded bg-[#fbf7ee] p-2 border border-[#8B5A2B]/15">
                <span className="font-bold text-[#5c3a1e] block mb-0.5">Chất liệu:</span>
                <span className="text-stone-600">{item.metadata.materials.join(', ')}</span>
              </div>
            )}
            {item.metadata?.colors && item.metadata.colors.length > 0 && (
              <div className="rounded bg-[#fbf7ee] p-2 border border-[#8B5A2B]/15">
                <span className="font-bold text-[#5c3a1e] block mb-0.5">Tông màu:</span>
                <span className="text-stone-600">{item.metadata.colors.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="border-t-2 border-[#8B5A2B]/20 pt-3 flex items-center justify-between gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#8B5A2B]/30 px-3 py-1.5 text-xs font-bold text-[#5c3a1e] hover:bg-[#f6eee2] cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(item);
              onClose();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer ${
              isWorn
                ? 'bg-[#8a4b38] text-white hover:bg-[#703b2b]'
                : 'bg-[#8B5A2B] text-white hover:bg-[#6f4520]'
            }`}
          >
            {isWorn ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Tháo món này</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Chọn mặc trang phục này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
