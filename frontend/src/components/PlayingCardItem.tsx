import React from 'react';
import { Item, ItemCategory } from '../types';
import { Info, Check } from 'lucide-react';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  top: 'Áo',
  bottom: 'Quần',
  shoes: 'Giày',
  bag: 'Túi',
  accessory: 'Phụ kiện'
};

interface PlayingCardItemProps {
  item: Item;
  isWorn: boolean;
  onOpenDetail: (item: Item) => void;
  onQuickToggle: (item: Item) => void;
}

export const PlayingCardItem: React.FC<PlayingCardItemProps> = ({
  item,
  isWorn,
  onOpenDetail,
  onQuickToggle,
}) => {
  return (
    <div
      onClick={() => onQuickToggle(item)}
      className={`group relative flex flex-col justify-between flex-shrink-0 w-28 sm:w-32 md:w-36 h-full max-h-[178px] rounded-xl p-1.5 transition-all duration-300 cursor-pointer select-none bg-[#FFFDF5] border-2 ${
        isWorn
          ? 'border-[#8B5A2B] ring-2 ring-[#8B5A2B] shadow-[0_0_0_2px_#8B5A2B,0_8px_20px_rgba(139,90,43,0.35)] bg-[#f5ede2]'
          : 'border-[#8B5A2B]/40 hover:border-[#8B5A2B] hover:ring-2 hover:ring-white/90 shadow-[0_6px_16px_rgba(80,45,15,0.14),0_2px_5px_rgba(80,45,15,0.08)] hover:shadow-[0_14px_26px_rgba(80,45,15,0.24),0_4px_10px_rgba(80,45,15,0.12)] hover:-translate-y-1'
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Delicate hairline white framing border (minimal, does not obscure content) */}
      <div className="absolute inset-1 rounded-lg border border-white/60 pointer-events-none" />

      {/* Top minimal subcategory & status tag */}
      <div className="relative z-10 flex items-center justify-between text-[11px] leading-tight px-1 pt-0.5 flex-shrink-0">
        <span className="text-[#8B5A2B] font-bold text-[11px] truncate italic">
          {CATEGORY_LABELS[item.category]}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {isWorn && (
            <span className="flex items-center gap-0.5 rounded bg-[#8B5A2B] px-1.5 py-0.5 text-[9px] font-bold text-[#FFFDF5] shadow-xs">
              <Check className="h-2.5 w-2.5" />
              Đã chọn
            </span>
          )}
          {item.metadata.reviewStatus === 'HUMAN_REVIEW_REQUIRED' && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-900">
              Chờ duyệt
            </span>
          )}
        </span>
      </div>

      {/* Item Image area: takes entire card body for clean, prominent garment display */}
      <div className="relative z-10 flex-1 my-1 rounded-lg border border-white/70 overflow-hidden flex items-center justify-center p-1.5 bg-[#faf6ed]/50">
        {item.assets.thumbnail.status === 'READY' ? (
          <img
            src={item.assets.thumbnail.path}
            alt={item.name}
            className="max-h-[95px] sm:max-h-[110px] w-auto max-w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-[10px] text-stone-500">Ảnh đang chờ</span>
        )}
      </div>

      <p className="relative z-10 min-h-8 px-1 text-[11px] font-semibold leading-tight text-[#3d2714] line-clamp-2">
        {item.name}
      </p>

      {/* 'Xem thông tin' Button: ONLY appears on hover at the bottom of the card */}
      <div className="absolute inset-x-2 bottom-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(item);
          }}
          className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold tracking-wide bg-[#8B5A2B] hover:bg-[#6f4520] active:scale-95 text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#6f4520]"
        >
          <Info className="w-3 h-3" />
          <span>Xem thông tin</span>
        </button>
      </div>
    </div>
  );
};
