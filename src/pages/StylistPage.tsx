import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarScene,
  AvatarPreset,
  BackgroundPreset,
  CatalogDiagnostics,
  Context,
  CulturalRule,
  Item,
  ItemCategory,
  KnowledgeOption,
  Outfit,
  OutfitSlot,
  RecommendationResponse,
  RenderLayer,
} from '../types';
import { PlayingCardItem } from '../components/PlayingCardItem';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { AvatarRenderer, isRenderLayerAllowedForSlot } from '../components/avatar/AvatarRenderer';
import { AVATAR_PRESETS, BACKGROUND_PRESETS } from '../data/renderPresets';
import { ArrowLeft, Check, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import {
  CatalogApiError,
  getCatalogItems,
  getCatalogOptions,
  getCatalogRecommendation,
  getCulturalRules,
} from '../services/catalogApi';

const CATEGORIES: { id: OutfitSlot; label: string; catalogCategory: ItemCategory }[] = [
  { id: 'top', label: 'Áo', catalogCategory: 'top' },
  { id: 'underlayer', label: 'Lớp lót', catalogCategory: 'top' },
  { id: 'bottom', label: 'Quần', catalogCategory: 'bottom' },
  { id: 'shoes', label: 'Giày', catalogCategory: 'shoes' },
  { id: 'bag', label: 'Túi', catalogCategory: 'bag' },
  { id: 'accessory', label: 'Phụ kiện', catalogCategory: 'accessory' }
];

const EMPTY_OUTFIT: Outfit = {
  top: null,
  underlayer: null,
  bottom: null,
  shoes: null,
  bag: null,
  accessory: null,
};

const MVP_DEMO_DEFAULT_CONTEXT: Context = {
  occasionId: 'occ_graduation',
  roleId: 'role_student',
  styleId: 'style_elegant',
};

export const StylistPage: React.FC = () => {
  const navigate = useNavigate();

  // Canonical scene and outfit state; selections are IDs only.
  const [items, setItems] = useState<Item[]>([]);
  const [catalogDiagnostics, setCatalogDiagnostics] = useState<CatalogDiagnostics | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [context, setContext] = useState<Context>(MVP_DEMO_DEFAULT_CONTEXT);
  const [occasions, setOccasions] = useState<KnowledgeOption[]>([]);
  const [roles, setRoles] = useState<KnowledgeOption[]>([]);
  const [styles, setStyles] = useState<KnowledgeOption[]>([]);
  const [contextError, setContextError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<OutfitSlot>('top');
  const [outfit, setOutfit] = useState<Outfit>(EMPTY_OUTFIT);
  const [avatarPresetId, setAvatarPresetId] = useState<string>(AVATAR_PRESETS[0].avatarPresetId);
  const [backgroundPresetId, setBackgroundPresetId] = useState<string>(BACKGROUND_PRESETS[0].backgroundPresetId);

  // State: Detail Modal
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State: AI Recommendation (Phase 4.3)
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [culturalRules, setCulturalRules] = useState<CulturalRule[]>([]);
  const [isRecommendationApplied, setIsRecommendationApplied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setIsCatalogLoading(true);
    getCatalogItems()
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setCatalogDiagnostics(response.diagnostics);
        setCatalogError(null);
      })
      .catch((error: CatalogApiError) => {
        if (!active) return;
        setItems([]);
        setCatalogDiagnostics(error.diagnostics ?? null);
        setCatalogError(error.code === 'CATALOG_BLOCKED'
          ? 'Catalog đang bị chặn do knowledge data chưa đủ trường canonical.'
          : 'Không thể tải catalog từ máy chủ.');
      })
      .finally(() => {
        if (active) setIsCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCatalogOptions('occasions'),
      getCatalogOptions('roles'),
      getCatalogOptions('styles'),
      getCulturalRules(),
    ])
      .then(([occasionResponse, roleResponse, styleResponse, rulesResponse]) => {
        if (!active) return;
        setOccasions(occasionResponse.data);
        setRoles(roleResponse.data);
        setStyles(styleResponse.data);
        setCulturalRules(rulesResponse.data);
        setContextError(null);
      })
      .catch(() => {
        if (!active) return;
        setOccasions([]);
        setRoles([]);
        setStyles([]);
        setCulturalRules([]);
        setContextError('Không thể tải các lựa chọn hoàn cảnh, vai trò và phong cách.');
      });

    return () => {
      active = false;
    };
  }, []);

  // Requirement 13: Clear recommendation when Context changes. Do NOT auto-call Gemini or auto-apply.
  useEffect(() => {
    setRecommendation(null);
    setRecommendationError(null);
    setIsRecommendationApplied(false);
  }, [context.occasionId, context.roleId, context.styleId]);

  const avatarPreset = AVATAR_PRESETS.find((preset) => preset.avatarPresetId === avatarPresetId) ?? AVATAR_PRESETS[0];
  const background = BACKGROUND_PRESETS.find((preset) => preset.backgroundPresetId === backgroundPresetId) ?? BACKGROUND_PRESETS[0];
  const scene: AvatarScene = {
    avatarPresetId,
    backgroundPresetId,
    background,
    outfit,
  };
  const selectedCategory = CATEGORIES.find((category) => category.id === selectedSlot);
  const categoryItems = items.filter((item) =>
    item.category === selectedCategory?.catalogCategory &&
    isRenderLayerAllowedForSlot(selectedSlot, item.render.layer),
  );
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const rulesById = new Map(culturalRules.map((rule) => [rule.ruleId, rule]));

  const handleToggleItem = (item: Item) => {
    if (item.category !== selectedCategory?.catalogCategory ||
      !isRenderLayerAllowedForSlot(selectedSlot, item.render.layer)) return;
    setOutfit((previous) => ({
      ...previous,
      [selectedSlot]: previous[selectedSlot] === item.id ? null : item.id,
    }));
  };

  const handleRemoveSlot = (slot: OutfitSlot) => {
    setOutfit((previous) => ({ ...previous, [slot]: null }));
  };

  const handleResetOutfit = () => setOutfit(EMPTY_OUTFIT);

  const handleOpenDetail = (item: Item) => {
    setDetailItem(item);
    setIsModalOpen(true);
  };

  const handleRequestRecommendation = async () => {
    if (isRecommending) return;
    setIsRecommending(true);
    setRecommendationError(null);
    setIsRecommendationApplied(false);

    try {
      const response = await getCatalogRecommendation({
        context,
        userPrompt: userPrompt.trim() ? userPrompt.trim() : undefined,
        currentOutfit: outfit,
      });
      setRecommendation(response.data);
    } catch (err: any) {
      if (err.code === 'NO_SUITABLE_CANDIDATES') {
        setRecommendationError('Chưa tìm thấy trang phục phù hợp với bối cảnh hiện tại trong danh mục.');
      } else if (err.code === 'GEMINI_UNAVAILABLE') {
        setRecommendationError('AI hiện chưa khả dụng. Bạn có thể tiếp tục tự phối trang phục.');
      } else {
        setRecommendationError(err.message || 'Không thể tạo gợi ý từ AI lúc này. Vui lòng thử lại sau.');
      }
      setRecommendation(null);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleApplyRecommendation = () => {
    if (!recommendation) return;

    const slotValidationRules: Record<OutfitSlot, { category: ItemCategory; allowedLayers: RenderLayer[] }> = {
      top: { category: 'top', allowedLayers: ['top'] },
      underlayer: { category: 'top', allowedLayers: ['underlayer'] },
      bottom: { category: 'bottom', allowedLayers: ['bottom'] },
      shoes: { category: 'shoes', allowedLayers: ['shoes'] },
      bag: { category: 'bag', allowedLayers: ['bag-front', 'bag-back'] },
      accessory: { category: 'accessory', allowedLayers: ['accessory', 'face-overlay'] },
    };

    const slots: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];
    const nextOutfit: Outfit = { ...outfit };

    for (const slot of slots) {
      const recId = recommendation[slot];
      if (recId === null || recId === undefined) {
        // Requirement 11: Null slot preserves current slot
        continue;
      }
      const item = itemsById.get(recId);
      if (!item) {
        setRecommendationError(`Món đồ gợi ý '${recId}' không tìm thấy trong danh mục.`);
        return;
      }
      const rule = slotValidationRules[slot];
      if (item.category !== rule.category || !rule.allowedLayers.includes(item.render.layer)) {
        setRecommendationError(`Món đồ '${item.name}' không tương thích với slot '${slot}'.`);
        return;
      }
      nextOutfit[slot] = item.id;
    }

    // Apply verified recommendation to outfit state
    setOutfit(nextOutfit);
    setIsRecommendationApplied(true);
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col select-none overflow-x-hidden text-[#3d2714] md:h-screen md:w-screen md:min-h-0 md:overflow-hidden"
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
          <span className="min-w-0 truncate text-xs font-bold text-[#8B5A2B] uppercase tracking-normal drop-shadow-2xs">
            Việt Phục Remix
          </span>
        </div>
      </header>

      {/* Main Studio Body: Fixed Height, Fits Perfectly In Viewport Without Page Scrolling */}
      <div className="z-10 flex flex-1 flex-col gap-3 overflow-y-auto p-2.5 sm:p-3.5 md:min-h-0 md:flex-row md:overflow-hidden">
        <section className="relative flex h-[70vh] min-h-[520px] w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] shadow-[0_16px_40px_rgba(70,40,15,0.16),0_4px_12px_rgba(70,40,15,0.08)] md:h-full md:min-h-0 md:w-[48%] lg:w-[52%]">
          {/* Subtle decorative inner framing border */}
          <div className="absolute inset-1 rounded-xl border border-[#8B5A2B]/20 pointer-events-none" />

          <div className="grid grid-cols-2 gap-2 p-3 border-b-2 border-[#8B5A2B]/25 bg-[#f8f3e8] flex-shrink-0 z-10">
            <label className="min-w-0 text-xs font-bold text-[#5c3a1e]">
              Avatar
              <select
                value={avatarPresetId}
                onChange={(event) => setAvatarPresetId(event.target.value)}
                className="mt-1 w-full rounded-lg bg-[#FFFDF5] border border-[#8B5A2B]/40 px-2 py-1.5 text-xs font-semibold"
              >
                {AVATAR_PRESETS.map((preset) => (
                  <option key={preset.avatarPresetId} value={preset.avatarPresetId}>{preset.name}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-xs font-bold text-[#5c3a1e]">
              Phông nền
              <select
                value={backgroundPresetId}
                onChange={(event) => setBackgroundPresetId(event.target.value)}
                className="mt-1 w-full rounded-lg bg-[#FFFDF5] border border-[#8B5A2B]/40 px-2 py-1.5 text-xs font-semibold"
              >
                {BACKGROUND_PRESETS.map((preset) => (
                  <option key={preset.backgroundPresetId} value={preset.backgroundPresetId}>{preset.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 z-10">
            <AvatarRenderer avatarPreset={avatarPreset} scene={scene} items={items} />
            <div className="mt-3 flex items-center justify-between border-t border-[#8B5A2B]/20 pt-2">
              <h2 className="text-xs font-bold uppercase text-[#8B5A2B]">Trang phục hiện tại</h2>
              <button
                type="button"
                onClick={handleResetOutfit}
                className="inline-flex items-center gap-1 rounded-md border border-[#8B5A2B]/30 px-2 py-1 text-xs text-[#5c3a1e] hover:bg-[#f6eee2]"
                title="Tháo tất cả item"
              >
                <RotateCcw className="h-3 w-3" />
                Tháo tất cả
              </button>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {CATEGORIES.map(({ id, label }) => {
                const itemId = outfit[id];
                const item = itemId ? itemsById.get(itemId) : undefined;
                return (
                  <li key={id} className="flex min-w-0 items-center justify-between gap-1 rounded bg-[#f8f3e8] px-2 py-1">
                    <span className="font-semibold text-[#5c3a1e]">{label}</span>
                    <span className="truncate text-stone-600" title={item?.name ?? itemId ?? 'Chưa chọn'}>
                      {item?.name ?? itemId ?? 'Chưa chọn'}
                    </span>
                    {itemId && (
                      <button type="button" onClick={() => handleRemoveSlot(id)} className="shrink-0 text-[#8a4b38]" aria-label={`Bỏ ${label}`}>
                        ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="relative flex h-[70vh] min-h-[420px] w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border-4 border-[#8B5A2B] bg-[#FFFDF5] p-3 shadow-[0_16px_40px_rgba(70,40,15,0.16),0_4px_12px_rgba(70,40,15,0.08)] md:h-full md:min-h-0 md:w-[52%] lg:w-[48%]">
          {/* Subtle decorative inner framing border */}
          <div className="absolute inset-1 rounded-xl border border-[#8B5A2B]/20 pointer-events-none" />

          <div className="relative z-10 flex-shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#5c3a1e]">Danh mục</h2>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${catalogDiagnostics?.status === 'BLOCKED' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                {isCatalogLoading ? 'Đang tải' : catalogDiagnostics?.status ?? 'Chưa có trạng thái'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedSlot === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedSlot(cat.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#8B5A2B] text-white border border-[#6f4520]'
                      : 'bg-[#f6eee2] hover:bg-[#ebdcc8] text-[#5c3a1e] border border-[#8B5A2B]/30'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            </div>
          </div>

          <div className="relative z-10 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[#8B5A2B]/20 pt-3">
            <div className="mb-3 rounded-lg border border-[#8B5A2B]/25 bg-[#fbf7ee] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase text-[#8B5A2B]">Bối cảnh phối đồ</h2>
                <span className="text-[10px] text-stone-500">MVP DEMO DEFAULT</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="min-w-0 text-[11px] font-semibold text-[#5c3a1e]">
                  Hoàn cảnh
                  <select
                    value={context.occasionId}
                    onChange={(event) => setContext((previous) => ({ ...previous, occasionId: event.target.value }))}
                    disabled={occasions.length === 0}
                    className="mt-1 w-full rounded-md border border-[#8B5A2B]/35 bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                  >
                    {occasions.length === 0 && <option value={context.occasionId}>Chưa tải lựa chọn</option>}
                    {occasions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-[11px] font-semibold text-[#5c3a1e]">
                  Vai trò
                  <select
                    value={context.roleId}
                    onChange={(event) => setContext((previous) => ({ ...previous, roleId: event.target.value }))}
                    disabled={roles.length === 0}
                    className="mt-1 w-full rounded-md border border-[#8B5A2B]/35 bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                  >
                    {roles.length === 0 && <option value={context.roleId}>Chưa tải lựa chọn</option>}
                    {roles.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-[11px] font-semibold text-[#5c3a1e]">
                  Phong cách
                  <select
                    value={context.styleId}
                    onChange={(event) => setContext((previous) => ({ ...previous, styleId: event.target.value }))}
                    disabled={styles.length === 0}
                    className="mt-1 w-full rounded-md border border-[#8B5A2B]/35 bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                  >
                    {styles.length === 0 && <option value={context.styleId}>Chưa tải lựa chọn</option>}
                    {styles.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              {contextError && <p className="mt-2 text-xs text-amber-900" role="status">{contextError}</p>}
            </div>

            {/* AI Recommendation Section (Phase 4.3) */}
            <div className="mb-3 rounded-lg border border-[#8B5A2B]/25 bg-[#fbf7ee] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#8B5A2B]">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>AI Stylist Gợi Ý</span>
                </div>
                {recommendation && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                    {recommendation.styleVibe}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Mong muốn thêm (ví dụ: thanh lịch, tối giản, nổi bật...)"
                  disabled={isRecommending}
                  className="min-w-0 flex-1 rounded-md border border-[#8B5A2B]/35 bg-white px-2.5 py-1.5 text-xs text-[#3d2714] placeholder:text-stone-400 focus:border-[#8B5A2B] focus:outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleRequestRecommendation}
                  disabled={isRecommending}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#8B5A2B] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6f4520] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isRecommending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang phân tích…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Gợi ý với AI</span>
                    </>
                  )}
                </button>
              </div>

              {recommendationError && (
                <div className="mt-2.5 flex items-start justify-between gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                  <p>{recommendationError}</p>
                  <button
                    type="button"
                    onClick={() => setRecommendationError(null)}
                    className="shrink-0 text-amber-700 hover:text-amber-950 cursor-pointer"
                    aria-label="Đóng thông báo lỗi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {recommendation && (
                <div className="mt-2.5 rounded-md border border-[#8B5A2B]/30 bg-[#FFFDF5] p-2.5 text-xs text-[#3d2714]">
                  <p className="italic text-stone-700">"{recommendation.stylistMessage}"</p>

                  <div className="mt-2 border-t border-[#8B5A2B]/15 pt-2">
                    <p className="font-bold text-[#8B5A2B]">Bộ phối đề xuất:</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 sm:grid-cols-3">
                      {CATEGORIES.map(({ id, label }) => {
                        const recId = recommendation[id];
                        const recItem = recId ? itemsById.get(recId) : null;
                        return (
                          <div key={id} className="rounded bg-[#f8f3e8] px-2 py-1">
                            <span className="font-semibold text-[#5c3a1e]">{label}: </span>
                            <span className="text-stone-700">
                              {recItem?.name ?? (recId ? recId : 'Không đề xuất')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {recommendation.appliedRuleIds.length > 0 && (
                    <div className="mt-2 border-t border-[#8B5A2B]/15 pt-1.5">
                      <p className="text-[11px] font-bold text-[#8B5A2B]">Quy tắc văn hóa được áp dụng:</p>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-stone-600">
                        {recommendation.appliedRuleIds.map((ruleId) => {
                          const rule = rulesById.get(ruleId);
                          return (
                            <li key={ruleId} className="list-inside list-disc">
                              <span className="font-semibold">{rule?.category ? `[${rule.category}] ` : ''}</span>
                              {rule?.statement ?? ruleId}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-[#8B5A2B]/20 pt-2">
                    <button
                      type="button"
                      onClick={() => setRecommendation(null)}
                      className="rounded px-2 py-1 text-[11px] text-stone-500 hover:bg-[#f6eee2] hover:text-stone-700 cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRecommendation}
                      className="inline-flex items-center gap-1 rounded-md bg-[#8B5A2B] px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#6f4520] cursor-pointer"
                    >
                      {isRecommendationApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Đã áp dụng</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Áp dụng vào người mẫu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#5c3a1e]">{selectedCategory?.label ?? 'Trang phục'}</h2>
                <p className="text-[11px] text-stone-500">{categoryItems.length} món trong danh mục</p>
              </div>
              {selectedCategory?.id === 'underlayer' && (
                <span className="rounded bg-[#f6eee2] px-2 py-1 text-[10px] text-[#5c3a1e]">Slot riêng · category top</span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isCatalogLoading ? (
                <p className="py-6 text-center text-sm text-stone-500">Đang tải danh mục trang phục…</p>
              ) : catalogError ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
                  <p className="font-semibold">{catalogError}</p>
                  <p className="mt-1 text-xs">Catalog canonical đang BLOCKED; không dùng dữ liệu mock thay thế.</p>
                  {catalogDiagnostics?.issues.slice(0, 4).map((issue) => (
                    <p key={`${issue.itemId}-${issue.field}`} className="mt-1 text-xs">
                      {issue.itemId}: {issue.field}
                    </p>
                  ))}
                </div>
              ) : categoryItems.length === 0 ? (
                <p className="rounded-lg border border-[#8B5A2B]/20 bg-[#fbf7ee] p-4 text-center text-sm text-stone-500">
                  Chưa có item trong danh mục này.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="h-48 min-w-0">
                      <PlayingCardItem
                        item={item}
                        isWorn={outfit[selectedSlot] === item.id}
                        onOpenDetail={handleOpenDetail}
                        onQuickToggle={handleToggleItem}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Pop-up Chi Tiết Sản Phẩm (Dạng phong thư lá bài phóng to ~1/3 màn hình, nút đóng góc trên bên phải, nút Chọn nổi bật) */}
      <ItemDetailModal
        item={detailItem}
        isOpen={isModalOpen}
        isWorn={Boolean(detailItem && outfit[selectedSlot] === detailItem.id)}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleToggleItem}
      />
    </div>
  );
};
