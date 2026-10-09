import React from 'react';
import { Item } from '../types';
import { Check, Eye, Plus, Sparkles } from 'lucide-react';

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
  const [imgError, setImgError] = React.useState(false);
  const hasImage = !imgError && item.assets?.thumbnail?.status === 'READY' && Boolean(item.assets.thumbnail.path);
  const isTraditional = item.metadata.styleIds.includes('style_strict_traditional') || item.metadata.styleIds.includes('style_elegant');

  return (
    <div
      className={`group relative h-full w-full rounded-xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden bg-[#FFFDF5] shadow-xs select-none ${
        isWorn
          ? 'border-[#8B5A2B] ring-2 ring-[#8B5A2B]/40 bg-[#faf4ea]'
          : 'border-[#8B5A2B]/35 hover:border-[#8B5A2B] hover:shadow-md'
      }`}
    >
      {/* Vintage corner accents */}
      <div className="absolute top-1 left-1.5 flex items-center gap-1 z-10">
        <span className="text-[10px] font-bold text-[#8B5A2B] uppercase">
          {item.category === 'top' ? (item.render.layer === 'underlayer' ? 'LÓT' : 'ÁO') : item.category.toUpperCase()}
        </span>
        {isTraditional && <span className="text-[9px] text-amber-700 font-serif">♦</span>}
      </div>

      {isWorn && (
        <div className="absolute top-1 right-1.5 z-10 flex items-center gap-0.5 rounded-full bg-[#8B5A2B] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs">
          <Check className="h-2.5 w-2.5" />
          <span>Đang mặc</span>
        </div>
      )}

      {/* Card Visual Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-2.5 pt-5 cursor-pointer" onClick={() => onOpenDetail(item)}>
        {hasImage ? (
          <img
            src={item.assets.thumbnail.status === 'READY' ? item.assets.thumbnail.path : ''}
            alt={item.name}
            className="h-20 w-auto max-w-[85%] object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex h-20 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-[#8B5A2B]/35 bg-[#f8f2e4] p-1 text-center">
            <Sparkles className="h-4 w-4 text-[#8B5A2B]/70 mb-0.5" />
            <span className="text-[9px] font-semibold text-[#5c3a1e] line-clamp-2">
              {item.name}
            </span>
            <span className="text-[8px] text-amber-800 bg-amber-100/80 px-1 rounded mt-1 font-semibold">
              Bản phác thảo
            </span>
          </div>
        )}

        <div className="mt-2 text-center w-full px-1">
          <h3 className="text-xs font-bold text-[#3d2714] line-clamp-1 group-hover:text-[#8B5A2B]">
            {item.name}
          </h3>
          <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
            {item.culture?.origin ? `${item.culture.origin} · ` : ''}
            {item.description}
          </p>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between border-t border-[#8B5A2B]/20 bg-[#fbf7ee] px-2 py-1.5 gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(item);
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-[#5c3a1e] hover:bg-[#ede1ce] transition cursor-pointer"
          title="Xem thông tin chi tiết và nguồn gốc văn hóa"
        >
          <Eye className="h-3 w-3" />
          <span>Chi tiết</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickToggle(item);
          }}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
            isWorn
              ? 'bg-[#8a4b38] text-white hover:bg-[#723c2c]'
              : 'bg-[#8B5A2B] text-white hover:bg-[#6f4520]'
          }`}
        >
          {isWorn ? (
            <>
              <span>Tháo</span>
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              <span>Mặc thử</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
