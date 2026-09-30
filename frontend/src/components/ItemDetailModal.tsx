import React from 'react';
import { FashionItem } from '../types';
import { X, Check } from 'lucide-react';

interface ItemDetailModalProps {
  item: FashionItem | null;
  isOpen: boolean;
  isWorn: boolean;
  onClose: () => void;
  onSelect: (item: FashionItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  isWorn,
  onClose,
  onSelect,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Modal Container: chiếm ~1/3 màn hình, thiết kế như phong thư vintage */}
      <div
        className="relative w-full max-w-md bg-[#FFFDF5] rounded-2xl border-4 border-[#8B5A2B] shadow-[0_25px_70px_rgba(0,0,0,0.55),0_10px_25px_rgba(0,0,0,0.35)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden animate-scale-up text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative inner border */}
        <div className="absolute inset-1.5 rounded-xl border border-[#8B5A2B]/25 pointer-events-none" />

        {/* Top-Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-full bg-[#f4ede1] hover:bg-[#ebdcc8] text-[#5c3a1e] border border-[#8B5A2B]/30 shadow-xs transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pr-8 mb-2 z-10">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#8B5A2B]">
            {item.categoryLabel} • {item.subCategory}
          </span>
          <h3 className="text-xl font-bold text-stone-900 leading-snug">
            {item.name}
          </h3>
        </div>

        {/* Image Box */}
        <div className="relative w-full h-44 bg-[#fcf9f2] rounded-xl border border-[#8B5A2B]/20 overflow-hidden flex items-center justify-center p-2 mb-3 z-10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]">
          <img
            src={item.image}
            alt={item.name}
            className="max-h-full max-w-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                item.category === 'ao' ? '/ao_mock_001.png' : '/quan_mock_001.png';
            }}
          />
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3 z-10">
          <div className="p-2 rounded-lg bg-[#f6eee2] border border-[#8B5A2B]/20">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Màu sắc</span>
            <span className="font-semibold text-stone-800">{item.color}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#f6eee2] border border-[#8B5A2B]/20">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Chất liệu</span>
            <span className="font-semibold text-stone-800">{item.material}</span>
          </div>
        </div>

        {/* Description / Style */}
        <div className="p-2.5 rounded-lg bg-[#fbf6ed] border border-[#8B5A2B]/25 text-xs mb-4 z-10">
          <span className="text-[11px] text-[#8B5A2B] block font-bold">Phong cách: {item.style}</span>
          <p className="text-stone-700 italic mt-0.5 leading-relaxed">
            "{item.description}"
          </p>
        </div>

        {/* Prominent Action Button: 'Chọn' */}
        <button
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer z-10 ${
            isWorn
              ? 'bg-[#8a4b38] hover:bg-[#723b2c] text-white border border-[#723b2c]'
              : 'bg-[#8B5A2B] hover:bg-[#6f4520] text-white border border-[#6f4520]'
          }`}
        >
          {isWorn ? (
            <>
              <X className="w-4 h-4" />
              <span>Tháo trang phục này</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Chọn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
