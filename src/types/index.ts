export type ItemCategory = 'top' | 'bottom' | 'shoes' | 'bag' | 'accessory';

export type LegacyItemCategory = 'ao' | 'quan' | 'giay' | 'phukien';

export type RenderLayer =
  | 'shoes'
  | 'bottom'
  | 'underlayer'
  | 'top'
  | 'bag-back'
  | 'accessory'
  | 'bag-front'
  | 'hair-back'
  | 'hair-front'
  | 'face-overlay';

export type AssetReference =
  | { status: 'PENDING_ASSET'; assetId: string }
  | { status: 'READY'; assetId: string; path: string; mimeType: string };

export type ItemId = string;
export type ItemReviewStatus = 'HUMAN_REVIEW_REQUIRED' | 'VERIFIED';
export type OutfitSlot = 'top' | 'underlayer' | 'bottom' | 'shoes' | 'bag' | 'accessory';

export interface Outfit {
  top: ItemId | null;
  underlayer: ItemId | null;
  bottom: ItemId | null;
  shoes: ItemId | null;
  bag: ItemId | null;
  accessory: ItemId | null;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface AvatarLandmarks {
  headCenter: NormalizedPoint;
  neckCenter: NormalizedPoint;
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
  chestCenter: NormalizedPoint;
  waistCenter: NormalizedPoint;
  hipCenter: NormalizedPoint;
  leftFoot: NormalizedPoint;
  rightFoot: NormalizedPoint;
  leftHand: NormalizedPoint;
  rightHand: NormalizedPoint;
  leftEye: NormalizedPoint;
  rightEye: NormalizedPoint;
}

export interface AvatarPreset {
  avatarPresetId: string;
  name: string;
  description: string;
  assets: {
    base: AssetReference;
    hairBack?: AssetReference;
    hairFront?: AssetReference;
  };
  canvas: { width: 1000; height: 1400 };
  rendererProfileId: string;
  landmarks: AvatarLandmarks;
}

export interface BackgroundPreset {
  backgroundPresetId: string;
  name: string;
  description: string;
  asset: AssetReference;
  recommendedOccasionIds: string[];
}

export interface AvatarSceneSelection {
  avatarPresetId: string;
  backgroundPresetId: string;
  outfit: Outfit;
}

export interface AvatarScene extends AvatarSceneSelection {
  background: BackgroundPreset;
}

export type RenderDiagnosticCode =
  | 'ITEM_NOT_FOUND'
  | 'SLOT_CATEGORY_MISMATCH'
  | 'ASSET_PENDING'
  | 'ASSET_LOAD_FAILED'
  | 'RENDER_METADATA_INVALID'
  | 'AVATAR_ASSET_PENDING'
  | 'BACKGROUND_ASSET_PENDING'
  | 'AVATAR_INCOMPATIBLE'
  | 'SCENE_REFERENCE_MISMATCH'
  | 'SLOT_RENDER_LAYER_MISMATCH'
  | 'INVALID_ITEM'
  | 'ASSET_DIMENSION_MISMATCH'
  | 'RENDER_TARGET_UNAVAILABLE';

export interface RenderDiagnostic {
  code: RenderDiagnosticCode;
  itemId?: ItemId;
  slot?: OutfitSlot;
  assetId?: string;
  message: string;
}

export interface KnowledgeSourceRef {
  sourceId: string;
  locator?: string;
}

export interface Item {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  assets: {
    thumbnail: AssetReference;
    renderLayer: AssetReference;
  };
  metadata: {
    colors: string[];
    materials: string[];
    styleIds: string[];
    occasionIds: string[];
    tags?: string[];
    reviewStatus?: ItemReviewStatus;
  };
  culture: {
    origin?: string;
    characteristics: string[];
    meaning?: string;
    sourceRefs?: KnowledgeSourceRef[];
  };
  render: {
    layer: RenderLayer;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    zIndex: number;
    compatibleAvatarIds?: string[];
  };
}

export interface KnowledgeOption {
  id: string;
  label: string;
  description: string;
}

export interface CulturalRule {
  ruleId: string;
  category: string;
  statement: string;
  sourceRefs?: KnowledgeSourceRef[];
}

export interface Context {
  occasionId: string;
  roleId: string;
  styleId: string;
}

export interface CatalogIssue {
  code: 'INVALID_JSON' | 'DUPLICATE_ID' | 'INVALID_FIELD' | 'BROKEN_REFERENCE' | 'TODO_DATA';
  file: string;
  itemId?: string;
  field?: string;
  message: string;
}

export interface CatalogDiagnostics {
  status: 'READY' | 'BLOCKED';
  itemCount: number;
  invalidItemCount: number;
  issues: CatalogIssue[];
}

export type ModelGender = 'nam' | 'nu';

// ================= CANONICAL PHASE 4.1 RECOMMENDATION CONTRACT =================
export interface RecommendationRequest {
  context: Context;
  userPrompt?: string;
  currentOutfit?: Outfit;
}

export interface RecommendationResponse {
  top: string | null;
  underlayer: string | null;
  bottom: string | null;
  shoes: string | null;
  bag: string | null;
  accessory: string | null;
  styleVibe: string;
  stylistMessage: string;
  appliedRuleIds: string[];
}

// ================= CANONICAL PHASE 5.1/5.2 VALIDATION CONTRACT =================
export type ValidationStatus = 'PASS' | 'WARN' | 'NEEDS_ADJUSTMENT';

export type FindingSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationSuggestion {
  slot: OutfitSlot;
  suggestedItemId: string | null;
  reason: string;
}

export interface ValidationFinding {
  slot?: OutfitSlot | null;
  severity: FindingSeverity;
  ruleId: string | null;
  message: string;
  detail?: string;
  suggestion?: ValidationSuggestion | null;
}

export interface ValidationResponse {
  status: ValidationStatus;
  summary: string;
  findings: ValidationFinding[];
  appliedRuleIds: string[];
}

export interface ValidationRequest {
  context: Context;
  outfit: Outfit;
}

// ================= LEGACY TYPES (PRESERVED FOR PROTOTYPE BACKWARD COMPATIBILITY) =================
export interface FashionItem {
  id: string;
  name: string;
  category: LegacyItemCategory;
  categoryLabel: string;
  subCategory: string;
  image: string;
  material: string;
  color: string;
  style: string;
  suitableEvents: string[]; // event IDs
  description: string;
  suitabilityScore: number; // 0 - 100
  isSuitableForCurrentEvent?: boolean;
  cardSuit: string;
  cardNumber: string;
  accentColor: string;
  tags: string[];
}

export interface EventOption {
  id: string;
  title: string;
  icon: string;
  sceneName: string;
  ambientNote: string;
  bgGradient: string;
  bgPattern: string;
  suitableTags: string[];
}

export interface SnoopyOutfit {
  ao: FashionItem | null;
  quan: FashionItem | null;
  giay: FashionItem | null;
  phukien: FashionItem | null;
}

export interface GeminiRecommendation {
  stylistMessage: string;
  recommendedItemIds: string[];
  matchedCategories: {
    aoId?: string;
    quanId?: string;
    giayId?: string;
    phukienId?: string;
  };
  styleVibe: string;
  tips: string[];
}
