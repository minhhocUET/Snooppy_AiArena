import {
  CatalogDiagnostics,
  CulturalRule,
  Item,
  ItemCategory,
  KnowledgeOption,
  RecommendationRequest,
  RecommendationResponse,
  ValidationRequest,
  ValidationResponse,
} from '../types';

export type CatalogOptionKind = 'occasions' | 'roles' | 'styles';

export interface CatalogItemsResponse {
  success: true;
  data: Item[];
  diagnostics: CatalogDiagnostics;
}

export interface CatalogApiError extends Error {
  status: number;
  code: string;
  diagnostics?: CatalogDiagnostics;
}

export interface CatalogOptionsResponse {
  success: true;
  data: KnowledgeOption[];
}

export async function getCatalogOptions(kind: CatalogOptionKind): Promise<CatalogOptionsResponse> {
  const response = await fetch(`/api/catalog/${kind}`);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error ?? `Could not load catalog ${kind}`) as CatalogApiError;
    error.status = response.status;
    error.code = payload?.error ?? 'CATALOG_OPTIONS_REQUEST_FAILED';
    error.diagnostics = payload?.diagnostics;
    throw error;
  }

  return payload as CatalogOptionsResponse;
}

export interface CulturalRulesResponse {
  success: true;
  data: CulturalRule[];
}

export async function getCulturalRules(): Promise<CulturalRulesResponse> {
  const response = await fetch('/api/catalog/cultural-rules');
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error ?? 'Could not load cultural rules') as CatalogApiError;
    error.status = response.status;
    error.code = payload?.error ?? 'CULTURAL_RULES_REQUEST_FAILED';
    throw error;
  }

  return payload as CulturalRulesResponse;
}

export async function getCatalogItems(category?: ItemCategory): Promise<CatalogItemsResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await fetch(`/api/catalog/items${query}`);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error ?? 'Catalog request failed') as CatalogApiError;
    error.status = response.status;
    error.code = payload?.error ?? 'CATALOG_REQUEST_FAILED';
    error.diagnostics = payload?.diagnostics;
    throw error;
  }

  return payload as CatalogItemsResponse;
}

export interface CatalogRecommendationResponse {
  success: true;
  data: RecommendationResponse;
}

export async function getCatalogRecommendation(
  request: RecommendationRequest,
): Promise<CatalogRecommendationResponse> {
  const response = await fetch('/api/catalog/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.message ?? payload?.error ?? 'Recommendation request failed') as CatalogApiError;
    error.status = response.status;
    error.code = payload?.error ?? 'RECOMMENDATION_REQUEST_FAILED';
    throw error;
  }

  return payload as CatalogRecommendationResponse;
}

export interface CatalogValidationResponse {
  success: true;
  data: ValidationResponse;
}

export async function validateCatalogOutfit(
  request: ValidationRequest,
): Promise<CatalogValidationResponse> {
  const response = await fetch('/api/catalog/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.message ?? payload?.error ?? 'Validation request failed') as CatalogApiError;
    error.status = response.status;
    error.code = payload?.error ?? 'VALIDATION_REQUEST_FAILED';
    throw error;
  }

  return payload as CatalogValidationResponse;
}
