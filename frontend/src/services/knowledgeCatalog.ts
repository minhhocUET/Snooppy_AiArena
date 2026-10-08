import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CatalogDiagnostics,
  CatalogIssue,
  AssetReference,
  Context,
  CulturalRule,
  Item,
  ItemCategory,
  ItemReviewStatus,
  KnowledgeOption,
  RenderLayer,
} from '../types';

const ITEM_CATEGORIES: ItemCategory[] = ['top', 'bottom', 'shoes', 'bag', 'accessory'];
const RENDER_LAYERS: RenderLayer[] = [
  'shoes', 'bottom', 'underlayer', 'top', 'bag-back', 'accessory', 'bag-front',
  'hair-back', 'hair-front', 'face-overlay',
];
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_KNOWLEDGE_DIR = resolve(MODULE_DIR, '../../../knowledge');
const DEFAULT_REPO_ROOT = resolve(DEFAULT_KNOWLEDGE_DIR, '..');

type JsonObject = Record<string, unknown>;

interface RawItemRecord {
  file: string;
  value: JsonObject;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function parseAssetReference(value: unknown): AssetReference | null {
  if (!isObject(value) || !isString(value.assetId)) return null;
  if (value.status === 'PENDING_ASSET') {
    return { status: 'PENDING_ASSET', assetId: value.assetId };
  }
  if (value.status === 'READY' && isString(value.path) && isString(value.mimeType)) {
    return {
      status: 'READY',
      assetId: value.assetId,
      path: value.path,
      mimeType: value.mimeType,
    };
  }
  return null;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function walkJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return walkJsonFiles(entryPath);
    return entry.isFile() && extname(entry.name).toLowerCase() === '.json' ? [entryPath] : [];
  });
}

export class KnowledgeCatalogRepository {
  private readonly items: Item[] = [];
  private readonly occasions: KnowledgeOption[] = [];
  private readonly roles: KnowledgeOption[] = [];
  private readonly styles: KnowledgeOption[] = [];
  private readonly culturalRules: CulturalRule[] = [];
  private readonly issues: CatalogIssue[] = [];
  private invalidItemCount = 0;

  constructor(
    private readonly knowledgeDir = DEFAULT_KNOWLEDGE_DIR,
    private readonly repoRoot = DEFAULT_REPO_ROOT,
  ) {
    this.loadOptions('occasions.json', this.occasions);
    this.loadOptions('roles.json', this.roles);
    this.loadOptions('styles.json', this.styles);
    this.loadCulturalRules();
    this.loadItems();
  }

  getAllItems(): Item[] {
    return [...this.items];
  }

  getItemById(id: string): Item | null {
    return this.items.find((item) => item.id === id) ?? null;
  }

  getItemsByCategory(category: ItemCategory): Item[] {
    return this.items.filter((item) => item.category === category);
  }

  getItemsByContext(context: Context): Item[] {
    const hasOccasion = this.occasions.some((option) => option.id === context.occasionId);
    const hasRole = this.roles.some((option) => option.id === context.roleId);
    const hasStyle = this.styles.some((option) => option.id === context.styleId);
    if (!hasOccasion || !hasRole || !hasStyle) return [];

    // Role compatibility is rule-driven; item-level role metadata is not present in this phase.
    return this.items.filter(
      (item) =>
        item.metadata.occasionIds.includes(context.occasionId) &&
        item.metadata.styleIds.includes(context.styleId),
    );
  }

  getAllOccasions(): KnowledgeOption[] {
    return [...this.occasions];
  }

  getAllRoles(): KnowledgeOption[] {
    return [...this.roles];
  }

  getAllStyles(): KnowledgeOption[] {
    return [...this.styles];
  }

  getAllCulturalRules(): CulturalRule[] {
    return [...this.culturalRules];
  }

  getDiagnostics(): CatalogDiagnostics {
    return {
      status: this.issues.length === 0 && this.items.length > 0 ? 'READY' : 'BLOCKED',
      itemCount: this.items.length,
      invalidItemCount: this.invalidItemCount,
      issues: [...this.issues],
    };
  }

  private loadOptions(fileName: string, target: KnowledgeOption[]): void {
    const filePath = resolve(this.knowledgeDir, fileName);
    let value: unknown;
    try {
      value = readJson(filePath);
    } catch (error) {
      this.issues.push({
        code: 'INVALID_JSON',
        file: relative(this.repoRoot, filePath),
        message: error instanceof Error ? error.message : 'Could not read JSON file',
      });
      return;
    }

    if (!Array.isArray(value)) {
      this.issues.push({
        code: 'INVALID_FIELD',
        file: relative(this.repoRoot, filePath),
        field: 'root',
        message: 'Expected a JSON array',
      });
      return;
    }

    const seenIds = new Set<string>();
    for (const [index, entry] of value.entries()) {
      const file = relative(this.repoRoot, filePath);
      if (!isObject(entry) || !isString(entry.id) || !isString(entry.name) || !isString(entry.description)) {
        this.issues.push({
          code: 'INVALID_FIELD',
          file,
          field: `[${index}]`,
          message: 'Expected id, name and description strings',
        });
        continue;
      }
      if (seenIds.has(entry.id)) {
        this.issues.push({
          code: 'DUPLICATE_ID',
          file,
          itemId: entry.id,
          message: 'Duplicate knowledge option ID',
        });
        continue;
      }
      seenIds.add(entry.id);
      target.push({ id: entry.id, label: entry.name, description: entry.description });
    }
  }

  private loadCulturalRules(): void {
    const filePath = resolve(this.knowledgeDir, 'cultural_rules.json');
    let value: unknown;
    try {
      value = readJson(filePath);
    } catch (error) {
      this.issues.push({
        code: 'INVALID_JSON',
        file: relative(this.repoRoot, filePath),
        message: error instanceof Error ? error.message : 'Could not read JSON file',
      });
      return;
    }

    if (!Array.isArray(value)) {
      this.issues.push({
        code: 'INVALID_FIELD',
        file: relative(this.repoRoot, filePath),
        field: 'root',
        message: 'Expected a JSON array',
      });
      return;
    }

    const seenIds = new Set<string>();
    for (const [index, entry] of value.entries()) {
      const file = relative(this.repoRoot, filePath);
      if (
        !isObject(entry) ||
        !isString(entry.rule_id) ||
        !isString(entry.category) ||
        !isString(entry.rule_text)
      ) {
        this.issues.push({
          code: 'INVALID_FIELD',
          file,
          field: `[${index}]`,
          message: 'Expected rule_id, category and rule_text strings',
        });
        continue;
      }
      if (seenIds.has(entry.rule_id)) {
        this.issues.push({
          code: 'DUPLICATE_ID',
          file,
          itemId: entry.rule_id,
          message: 'Duplicate cultural rule ID',
        });
        continue;
      }
      seenIds.add(entry.rule_id);
      this.culturalRules.push({
        ruleId: entry.rule_id,
        category: entry.category,
        statement: entry.rule_text,
      });
    }
  }

  private loadItems(): void {
    const itemDirectory = resolve(this.knowledgeDir, 'items');
    const files = walkJsonFiles(itemDirectory);
    const records: RawItemRecord[] = [];

    for (const filePath of files) {
      try {
        const value = readJson(filePath);
        if (!isObject(value)) {
          this.issues.push({
            code: 'INVALID_FIELD',
            file: relative(this.repoRoot, filePath),
            field: 'root',
            message: 'Expected a JSON object',
          });
          this.invalidItemCount += 1;
          continue;
        }
        if (value.recordStatus === 'LEGACY') continue;
        records.push({ file: relative(this.repoRoot, filePath), value });
      } catch (error) {
        this.issues.push({
          code: 'INVALID_JSON',
          file: relative(this.repoRoot, filePath),
          message: error instanceof Error ? error.message : 'Could not read JSON file',
        });
        this.invalidItemCount += 1;
      }
    }

    const idCounts = new Map<string, number>();
    for (const record of records) {
      if (isString(record.value.id)) {
        idCounts.set(record.value.id, (idCounts.get(record.value.id) ?? 0) + 1);
      }
    }

    for (const record of records) {
      const issueCountBefore = this.issues.length;
      const item = this.validateItem(record, idCounts);
      if (item && this.issues.length === issueCountBefore) this.items.push(item);
      else this.invalidItemCount += 1;
    }
  }

  private validateItem(record: RawItemRecord, idCounts: Map<string, number>): Item | null {
    const { value, file } = record;
    const itemId = isString(value.id) ? value.id : undefined;
    const addIssue = (code: CatalogIssue['code'], field: string, message: string) => {
      this.issues.push({ code, file, itemId, field, message });
    };

    if (!itemId) addIssue('TODO_DATA', 'id', 'TODO DATA: item ID is required');
    else if ((idCounts.get(itemId) ?? 0) > 1) {
      addIssue('DUPLICATE_ID', 'id', `Duplicate item ID: ${itemId}`);
    }

    if (!ITEM_CATEGORIES.includes(value.category as ItemCategory)) {
      addIssue('INVALID_FIELD', 'category', 'Category must be one of the canonical item categories');
    }
    if (!isString(value.name)) addIssue('TODO_DATA', 'name', 'TODO DATA: item name is required');
    if (!isString(value.description)) {
      addIssue('TODO_DATA', 'description', 'TODO DATA: verified item description is required');
    }

    const assets = isObject(value.assets) ? value.assets : null;
    const thumbnail = parseAssetReference(assets?.thumbnail);
    const renderAsset = parseAssetReference(assets?.renderLayer);
    if (!thumbnail) addIssue('TODO_DATA', 'assets.thumbnail', 'TODO DATA: approved thumbnail asset reference is required');
    else if (thumbnail.status === 'READY' && !this.isValidAssetRef(thumbnail.path)) {
      addIssue('BROKEN_REFERENCE', 'assets.thumbnail', 'Thumbnail reference must resolve to a file inside the repository');
    }
    if (!renderAsset) addIssue('TODO_DATA', 'assets.renderLayer', 'TODO DATA: approved renderer layer asset reference is required');
    else if (renderAsset.status === 'READY' && !this.isValidAssetRef(renderAsset.path)) {
      addIssue('BROKEN_REFERENCE', 'assets.renderLayer', 'Render asset reference must resolve to a file inside the repository');
    }

    const metadata = isObject(value.metadata) ? value.metadata : null;
    const colors = metadata?.colors;
    const materials = metadata?.materials;
    const styleIds = metadata?.styleIds;
    const occasionIds = metadata?.occasionIds;
    const tags = metadata?.tags;
    const reviewStatus = metadata?.reviewStatus;
    if (!isStringArray(colors)) addIssue('TODO_DATA', 'metadata.colors', 'TODO DATA: colors must be a string array');
    if (!isStringArray(materials)) addIssue('TODO_DATA', 'metadata.materials', 'TODO DATA: verified materials must be a string array');
    if (!isStringArray(styleIds)) addIssue('TODO_DATA', 'metadata.styleIds', 'TODO DATA: styleIds must be a string array');
    if (!isStringArray(occasionIds)) addIssue('TODO_DATA', 'metadata.occasionIds', 'TODO DATA: occasionIds must be a string array');
    if (tags !== undefined && !isStringArray(tags)) addIssue('INVALID_FIELD', 'metadata.tags', 'tags must be a string array when provided');
    if (reviewStatus !== undefined && reviewStatus !== 'HUMAN_REVIEW_REQUIRED' && reviewStatus !== 'VERIFIED') {
      addIssue('INVALID_FIELD', 'metadata.reviewStatus', 'reviewStatus must be HUMAN_REVIEW_REQUIRED or VERIFIED');
    }

    if (isStringArray(styleIds)) {
      for (const styleId of styleIds) {
        if (!this.styles.some((style) => style.id === styleId)) {
          addIssue('BROKEN_REFERENCE', 'metadata.styleIds', `Unknown style ID: ${styleId}`);
        }
      }
    }
    if (isStringArray(occasionIds)) {
      for (const occasionId of occasionIds) {
        if (!this.occasions.some((occasion) => occasion.id === occasionId)) {
          addIssue('BROKEN_REFERENCE', 'metadata.occasionIds', `Unknown occasion ID: ${occasionId}`);
        }
      }
    }

    const culture = isObject(value.culture) ? value.culture : null;
    const characteristics = culture?.characteristics;
    if (!culture) addIssue('TODO_DATA', 'culture', 'TODO DATA: culture metadata is required');
    if (characteristics === undefined) {
      addIssue('TODO_DATA', 'culture.characteristics', 'TODO DATA: cultural characteristics are required');
    } else if (!isString(characteristics) && !isStringArray(characteristics)) {
      addIssue('INVALID_FIELD', 'culture.characteristics', 'characteristics must be a string or string array');
    }

    const render = isObject(value.render) ? value.render : null;
    const layer = render?.layer;
    const position = isObject(render?.position) ? render.position : null;
    const zIndex = render?.zIndex;
    if (!render) addIssue('TODO_DATA', 'render', 'TODO DATA: renderer metadata is required');
    if (!RENDER_LAYERS.includes(layer as RenderLayer)) {
      addIssue('TODO_DATA', 'render.layer', 'TODO DATA: a supported renderer layer is required');
    }
    if (!position) addIssue('TODO_DATA', 'render.position', 'TODO DATA: renderer position is required');
    else {
      for (const field of ['x', 'y', 'width', 'height'] as const) {
        const coordinate = position[field];
        if (typeof coordinate !== 'number' || !Number.isFinite(coordinate)) {
          addIssue('TODO_DATA', `render.position.${field}`, 'TODO DATA: finite normalized coordinates are required');
        }
      }
      if (
        typeof position.x === 'number' &&
        typeof position.y === 'number' &&
        typeof position.width === 'number' &&
        typeof position.height === 'number' &&
        (position.x < 0 || position.y < 0 || position.width <= 0 || position.height <= 0 ||
          position.x + position.width > 1 || position.y + position.height > 1)
      ) {
        addIssue('INVALID_FIELD', 'render.position', 'Normalized position must fit within the 0..1 canvas');
      }
    }
    if (typeof zIndex !== 'number' || !Number.isFinite(zIndex)) {
      addIssue('TODO_DATA', 'render.zIndex', 'TODO DATA: finite zIndex is required');
    }

    if (
      this.issues.some((issue) => issue.file === file && issue.itemId === itemId) ||
      !itemId ||
      !ITEM_CATEGORIES.includes(value.category as ItemCategory) ||
      !isString(value.name) ||
      !isString(value.description) ||
      !thumbnail ||
      !renderAsset ||
      !isStringArray(colors) ||
      !isStringArray(materials) ||
      !isStringArray(styleIds) ||
      !isStringArray(occasionIds) ||
      !culture ||
      (!isString(characteristics) && !isStringArray(characteristics)) ||
      !RENDER_LAYERS.includes(layer as RenderLayer) ||
      !position ||
      typeof position.x !== 'number' ||
      typeof position.y !== 'number' ||
      typeof position.width !== 'number' ||
      typeof position.height !== 'number' ||
      typeof zIndex !== 'number'
    ) {
      return null;
    }

    return {
      id: itemId,
      category: value.category as ItemCategory,
      name: value.name,
      description: value.description,
      assets: { thumbnail, renderLayer: renderAsset },
      metadata: {
        colors,
        materials,
        styleIds,
        occasionIds,
        ...(isStringArray(tags) ? { tags } : {}),
        ...(reviewStatus === 'HUMAN_REVIEW_REQUIRED' || reviewStatus === 'VERIFIED'
          ? { reviewStatus: reviewStatus as ItemReviewStatus }
          : {}),
      },
      culture: {
        ...(isString(culture.origin) ? { origin: culture.origin } : {}),
        characteristics: isStringArray(characteristics) ? characteristics : [characteristics],
        ...(isString(culture.meaning) ? { meaning: culture.meaning } : {}),
        ...(Array.isArray(culture.sourceRefs)
          ? {
              sourceRefs: culture.sourceRefs
                .filter((sourceRef): sourceRef is Record<string, unknown> =>
                  isObject(sourceRef) && isString(sourceRef.sourceId))
                .map((sourceRef) => ({
                  sourceId: sourceRef.sourceId as string,
                  ...(isString(sourceRef.locator) ? { locator: sourceRef.locator } : {}),
                })),
            }
          : {}),
      },
      render: {
        layer: layer as RenderLayer,
        position: {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
        },
        zIndex,
        ...(render && isStringArray(render.compatibleAvatarIds)
          ? { compatibleAvatarIds: render.compatibleAvatarIds }
          : {}),
      },
    };
  }

  private isValidAssetRef(assetRef: string): boolean {
    if (/^(?:[a-z]+:)?\/\//i.test(assetRef) || assetRef.startsWith('/')) return false;
    const assetPath = resolve(this.repoRoot, assetRef);
    const relativePath = relative(this.repoRoot, assetPath);
    return relativePath !== '' && !relativePath.startsWith('..') && existsSync(assetPath);
  }
}
