import React from 'react';
import {
  AvatarPreset,
  AvatarScene,
  Item,
  OutfitSlot,
  RenderLayer,
} from '../../types';
import {
  SLOT_VALIDATION_RULES,
  evaluateSceneDiagnostics,
} from '../../services/culturalValidation';
import { Sparkles, Shirt, Layers } from 'lucide-react';

export { evaluateSceneDiagnostics };

export function isRenderLayerAllowedForSlot(slot: OutfitSlot, layer: RenderLayer): boolean {
  const rule = SLOT_VALIDATION_RULES[slot];
  return rule ? rule.allowedLayers.includes(layer) : false;
}

interface AvatarRendererProps {
  avatarPreset: AvatarPreset;
  scene: AvatarScene;
  items: Item[];
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatarPreset,
  scene,
  items,
}) => {
  const [failedImageIds, setFailedImageIds] = React.useState<Set<string>>(new Set());
  const itemsById = new Map<string, Item>(items.map((i) => [i.id, i]));

  // Resolve worn items
  const wornEntries: { slot: OutfitSlot; item: Item }[] = [];
  const slots: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];

  for (const slot of slots) {
    const itemId = scene.outfit[slot];
    if (itemId) {
      const item = itemsById.get(itemId);
      if (item) {
        wornEntries.push({ slot, item });
      }
    }
  }

  // Sort by z-index
  wornEntries.sort((a, b) => (a.item.render.zIndex || 0) - (b.item.render.zIndex || 0));

  const hasPendingItems = wornEntries.some(
    (e) => e.item.assets.renderLayer.status === 'PENDING_ASSET' || failedImageIds.has(e.item.id)
  );

  return (
    <div className="relative w-full aspect-[5/7] max-h-[460px] mx-auto rounded-xl overflow-hidden border-2 border-[#8B5A2B]/40 bg-gradient-to-b from-[#fcf6ea] to-[#ebdcc8] shadow-inner select-none flex items-center justify-center">
      {/* Background Ambience / Scene Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-85 transition-all duration-300 pointer-events-none"
        style={{
          background: scene.background.asset?.status === 'READY' && scene.background.asset.path
            ? `radial-gradient(circle at 50% 40%, rgba(255,253,245,0.4) 0%, rgba(220,200,175,0.85) 100%)`
            : 'radial-gradient(circle at 50% 40%, #fffdf5 0%, #ecdcc8 100%)'
        }}
      >
        {/* Soft Traditional Lattice Pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8B5A2B_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Floating Scene Badge */}
      <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-[#8B5A2B]/30 text-[10px] font-bold text-[#5c3a1e] shadow-2xs">
        <Sparkles className="w-3 h-3 text-amber-600" />
        <span>{scene.background.name}</span>
      </div>

      {/* Asset Status Badge (Indicates 2D sketch mode when real transparent PNGs are pending) */}
      {hasPendingItems && (
        <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50/90 backdrop-blur-xs border border-amber-300/70 text-[9px] font-semibold text-amber-900 shadow-2xs">
          <Layers className="w-2.5 h-2.5 text-amber-700" />
          <span>Bản phác thảo 2D</span>
        </div>
      )}

      {/* Mannequin / Character Silhouette Stage */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {/* Model Silhouette Body SVG */}
        <svg
          className="w-[78%] h-[88%] text-[#cbb292]/40 drop-shadow-md"
          viewBox="0 0 200 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head & Neck */}
          <ellipse cx="100" cy="55" rx="22" ry="26" fill="currentColor" opacity="0.8" />
          <path d="M92 78 H108 V96 H92 Z" fill="currentColor" opacity="0.75" />
          {/* Shoulders & Torso */}
          <path
            d="M58 100 C72 95 128 95 142 100 C150 104 154 135 148 160 C144 175 136 195 138 215 C132 218 68 218 62 215 C64 195 56 175 52 160 C46 135 50 104 58 100 Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* Arms */}
          <path d="M54 105 C46 130 38 175 42 205 C44 212 49 212 51 205 C50 175 56 135 62 110 Z" fill="currentColor" opacity="0.65" />
          <path d="M146 105 C154 130 162 175 158 205 C156 212 151 212 149 205 C150 175 144 135 138 110 Z" fill="currentColor" opacity="0.65" />
          {/* Legs & Base */}
          <path d="M72 215 C72 245 74 285 76 308 C78 312 85 312 87 308 C89 285 93 245 93 215 Z" fill="currentColor" opacity="0.75" />
          <path d="M107 215 C107 245 111 285 113 308 C115 312 122 312 124 308 C126 285 128 245 128 215 Z" fill="currentColor" opacity="0.75" />
          {/* Model Pedestal / Shadow */}
          <ellipse cx="100" cy="312" rx="42" ry="6" fill="#8B5A2B" opacity="0.25" />
        </svg>

        {/* Worn Items Rendering Layers */}
        {wornEntries.map(({ slot, item }) => {
          const pos = item.render.position;
          const isFailed = failedImageIds.has(item.id);
          const hasImage = !isFailed && item.assets.renderLayer.status === 'READY' && Boolean(item.assets.renderLayer.path);
          const isUnderlayer = item.render.layer === 'underlayer';

          return (
            <div
              key={`${slot}-${item.id}`}
              className="absolute pointer-events-auto transition-all duration-200"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: `${pos.width * 100}%`,
                height: `${pos.height * 100}%`,
                zIndex: item.render.zIndex || 10,
              }}
            >
              {hasImage ? (
                <img
                  src={item.assets.renderLayer.status === 'READY' ? item.assets.renderLayer.path : ''}
                  alt={item.name}
                  onError={() => {
                    setFailedImageIds((prev) => new Set(prev).add(item.id));
                  }}
                  className="w-full h-full object-contain filter drop-shadow-md select-none"
                />
              ) : (
                /* Fallback stylized garment presentation badge */
                <div
                  className={`w-full h-full flex flex-col items-center justify-center rounded-lg p-1.5 text-center shadow-xs ${
                    isUnderlayer
                      ? 'border border-dashed border-[#8B5A2B]/60 bg-white/70 backdrop-blur-2xs'
                      : 'border border-[#8B5A2B]/40 bg-[#FFFDF5]/90 backdrop-blur-2xs'
                  }`}
                >
                  <Shirt className={`w-3.5 h-3.5 shrink-0 ${isUnderlayer ? 'text-stone-400' : 'text-[#8B5A2B]'}`} />
                  <span className="text-[10px] font-bold text-[#5c3a1e] line-clamp-2 leading-tight mt-0.5">
                    {item.name}
                  </span>
                  <span className={`text-[8px] font-semibold uppercase px-1 rounded mt-0.5 ${
                    isUnderlayer
                      ? 'text-stone-600 bg-stone-100'
                      : 'text-amber-800 bg-amber-50'
                  }`}>
                    {isUnderlayer ? 'Lớp lót trong' : item.render.layer}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* If outfit is empty, show helpful hint */}
        {wornEntries.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="w-10 h-10 rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/20 flex items-center justify-center text-[#8B5A2B] mb-2">
              <Shirt className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-bold text-[#5c3a1e]">Mannequin chưa mặc đồ</p>
            <p className="text-[10px] text-stone-500 max-w-[180px] mt-0.5">
              Chọn trang phục từ danh mục bên phải hoặc nhấn "Gợi ý với AI".
            </p>
          </div>
        )}
      </div>

      {/* Preset Name Footnote */}
      <div className="absolute bottom-2 right-2.5 z-30 text-[9px] font-medium text-stone-500 bg-white/70 px-2 py-0.5 rounded border border-[#8B5A2B]/20">
        {avatarPreset.name}
      </div>
    </div>
  );
};
