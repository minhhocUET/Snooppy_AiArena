import { CatalogDiagnostics, Item, ItemCategory, KnowledgeOption } from '../types';

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
