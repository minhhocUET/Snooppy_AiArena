export type ItemCategory = 'ao' | 'quan' | 'giay' | 'phukien';

export type ModelGender = 'nam' | 'nu';

export interface FashionItem {
  id: string;
  name: string;
  category: ItemCategory;
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
