import React, { useEffect, useRef, useState } from 'react';
import {
  AssetReference,
  AvatarPreset,
  AvatarScene,
  Item,
  ItemCategory,
  OutfitSlot,
  RenderDiagnostic,
  RenderLayer,
} from '../../types';

export interface AvatarRendererProps {
  avatarPreset: AvatarPreset;
  scene: AvatarScene;
  items: Item[];
  onDiagnostics?: (diagnostics: RenderDiagnostic[]) => void;
}

export interface ResolvedRenderLayer {
  item: Item;
  layerRank: number;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1400;

const LAYER_ORDER: Record<RenderLayer, number> = {
  shoes: 200,
  bottom: 300,
  underlayer: 400,
  top: 450,
  'bag-back': 500,
  accessory: 550,
  'bag-front': 600,
  'hair-back': 100,
  'hair-front': 650,
  'face-overlay': 700,
};

const LAYER_BANDS: Record<RenderLayer, [number, number]> = {
  shoes: [200, 299],
  bottom: [300, 399],
  underlayer: [400, 449],
  top: [450, 499],
  'bag-back': [500, 549],
  accessory: [550, 599],
  'bag-front': [600, 649],
  'hair-back': [100, 199],
  'hair-front': [650, 699],
  'face-overlay': [700, 799],
};

const OUTFIT_SLOTS: OutfitSlot[] = [
  'top',
  'underlayer',
  'bottom',
  'shoes',
  'bag',
  'accessory',
];

const SLOT_CATEGORIES: Record<OutfitSlot, ItemCategory> = {
  top: 'top',
  underlayer: 'top',
  bottom: 'bottom',
  shoes: 'shoes',
  bag: 'bag',
  accessory: 'accessory',
};

const SLOT_RENDER_LAYERS: Record<OutfitSlot, readonly RenderLayer[]> = {
  top: ['top'],
  underlayer: ['underlayer'],
  bottom: ['bottom'],
  shoes: ['shoes'],
  bag: ['bag-back', 'bag-front'],
  accessory: ['accessory', 'face-overlay'],
};

export function isRenderLayerAllowedForSlot(slot: OutfitSlot, layer: RenderLayer): boolean {
  return SLOT_RENDER_LAYERS[slot].includes(layer);
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function resolveRenderLayers(items: readonly Item[]): ResolvedRenderLayer[] {
  return items
    .map((item) => ({ item, layerRank: LAYER_ORDER[item.render.layer] }))
    .sort(
      (left, right) =>
        left.layerRank - right.layerRank ||
        left.item.render.zIndex - right.item.render.zIndex ||
        compareIds(left.item.id, right.item.id),
    );
}

function isNormalizedBounds(position: Item['render']['position']): boolean {
  return Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.width) &&
    Number.isFinite(position.height) &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.width > 0 &&
    position.height > 0 &&
    position.x + position.width <= 1 &&
    position.y + position.height <= 1;
}

function isKnownRenderLayer(layer: string): layer is RenderLayer {
  return Object.prototype.hasOwnProperty.call(LAYER_ORDER, layer);
}

function isZIndexInLayerBand(layer: RenderLayer, zIndex: number): boolean {
  const band = LAYER_BANDS[layer];
  return Number.isInteger(zIndex) && zIndex >= band[0] && zIndex <= band[1];
}

function slotItemId(scene: AvatarScene, slot: OutfitSlot): string | null {
  return scene.outfit[slot];
}

function createDiagnostic(
  code: RenderDiagnostic['code'],
  message: string,
  details: Pick<RenderDiagnostic, 'itemId' | 'slot' | 'assetId'> = {},
): RenderDiagnostic {
  return { code, message, ...details };
}

function loadImage(
  reference: Extract<AssetReference, { status: 'READY' }>,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load asset ${reference.assetId}`));
    image.src = reference.path;
  });
}

function addReferenceCommand(
  commands: RenderCommand[],
  diagnostics: RenderDiagnostic[],
  reference: AssetReference | undefined,
  kind: RenderCommand['kind'],
  layerRank: number,
  itemId?: string,
  slot?: OutfitSlot,
): void {
  if (!reference) return;
  if (reference.status === 'PENDING_ASSET') {
    diagnostics.push(createDiagnostic(
      kind === 'background' ? 'BACKGROUND_ASSET_PENDING' : kind === 'avatar' ? 'AVATAR_ASSET_PENDING' : 'ASSET_PENDING',
      `Asset '${reference.assetId}' is pending and was not rendered.`,
      { itemId, slot, assetId: reference.assetId },
    ));
    return;
  }
  commands.push({ reference, kind, layerRank, itemId, slot });
}

interface RenderCommand {
  reference: Extract<AssetReference, { status: 'READY' }>;
  kind: 'background' | 'avatar' | 'item';
  layerRank: number;
  itemId?: string;
  slot?: OutfitSlot;
}

function drawBackgroundCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
): void {
  const scale = Math.max(CANVAS_WIDTH / image.naturalWidth, CANVAS_HEIGHT / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (CANVAS_WIDTH - drawWidth) / 2;
  const y = (CANVAS_HEIGHT - drawHeight) / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatarPreset,
  scene,
  items,
  onDiagnostics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [diagnostics, setDiagnostics] = useState<RenderDiagnostic[]>([]);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    const nextDiagnostics: RenderDiagnostic[] = [];

    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      const diagnostic = createDiagnostic('RENDER_TARGET_UNAVAILABLE', '2D canvas context is unavailable.');
      setDiagnostics([diagnostic]);
      onDiagnostics?.([diagnostic]);
      return;
    }
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (scene.avatarPresetId !== avatarPreset.avatarPresetId ||
        scene.backgroundPresetId !== scene.background.backgroundPresetId) {
      const diagnostic = createDiagnostic(
        'SCENE_REFERENCE_MISMATCH',
        'Scene avatar/background references do not match the supplied resolved records.',
      );
      setDiagnostics([diagnostic]);
      onDiagnostics?.([diagnostic]);
      return;
    }

    const itemsById = new Map<string, Item>();
    const duplicateIds = new Set<string>();
    for (const item of items) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || item.id.length === 0) {
        nextDiagnostics.push(createDiagnostic('INVALID_ITEM', 'Resolved items contain an invalid item record.'));
        continue;
      }
      if (itemsById.has(item.id)) {
        itemsById.delete(item.id);
        duplicateIds.add(item.id);
        nextDiagnostics.push(createDiagnostic(
          'INVALID_ITEM',
          `Resolved items contain duplicate ID '${item.id}'.`,
          { itemId: item.id },
        ));
        continue;
      }
      if (duplicateIds.has(item.id)) continue;
      itemsById.set(item.id, item);
    }

    const selectedItems: Array<{ item: Item; slot: OutfitSlot }> = [];
    for (const slot of OUTFIT_SLOTS) {
      const itemId = slotItemId(scene, slot);
      if (!itemId) continue;
      if (duplicateIds.has(itemId)) {
        nextDiagnostics.push(createDiagnostic(
          'INVALID_ITEM',
          `Outfit slot '${slot}' references an ambiguous resolved item ID.`,
          { itemId, slot },
        ));
        continue;
      }
      const item = itemsById.get(itemId);
      if (!item) {
        nextDiagnostics.push(createDiagnostic(
          'ITEM_NOT_FOUND',
          `Outfit slot '${slot}' references an item that was not resolved.`,
          { itemId, slot },
        ));
        continue;
      }
      if (item.category !== SLOT_CATEGORIES[slot]) {
        nextDiagnostics.push(createDiagnostic(
          'SLOT_CATEGORY_MISMATCH',
          `Item category '${item.category}' is not allowed in slot '${slot}'.`,
          { itemId, slot },
        ));
        continue;
      }
      if (!item.assets || !item.assets.renderLayer || !item.render || typeof item.render !== 'object') {
        nextDiagnostics.push(createDiagnostic(
          'RENDER_METADATA_INVALID',
          'Item is missing its render metadata or render-layer asset reference.',
          { itemId, slot },
        ));
        continue;
      }
      if (item.render.compatibleAvatarIds && !item.render.compatibleAvatarIds.includes(avatarPreset.avatarPresetId)) {
        nextDiagnostics.push(createDiagnostic(
          'AVATAR_INCOMPATIBLE',
          `Item is not approved for avatar preset '${avatarPreset.avatarPresetId}'.`,
          { itemId, slot },
        ));
        continue;
      }
      if (!isKnownRenderLayer(item.render.layer) ||
          !isRenderLayerAllowedForSlot(slot, item.render.layer) ||
          !item.render.position ||
          !isNormalizedBounds(item.render.position) ||
          !isZIndexInLayerBand(item.render.layer, item.render.zIndex)) {
        nextDiagnostics.push(createDiagnostic(
          isKnownRenderLayer(item.render.layer) && !isRenderLayerAllowedForSlot(slot, item.render.layer)
            ? 'SLOT_RENDER_LAYER_MISMATCH'
            : 'RENDER_METADATA_INVALID',
          `Item render metadata is incompatible with slot '${slot}' or outside normalized bounds/layer zIndex band.`,
          { itemId, slot },
        ));
        continue;
      }
      selectedItems.push({ item, slot });
    }

    const sortedLayers = resolveRenderLayers(selectedItems.map(({ item }) => item));
    const selectedSlots = new Map(selectedItems.map(({ item, slot }) => [item.id, slot]));
    const commands: RenderCommand[] = [];

    if (scene.background?.asset) {
      addReferenceCommand(commands, nextDiagnostics, scene.background.asset, 'background', -1);
    } else {
      nextDiagnostics.push(createDiagnostic('BACKGROUND_ASSET_PENDING', 'Scene background has no asset reference.'));
    }
    if (avatarPreset.assets?.base) {
      addReferenceCommand(commands, nextDiagnostics, avatarPreset.assets.base, 'avatar', 0);
    } else {
      nextDiagnostics.push(createDiagnostic('AVATAR_ASSET_PENDING', 'Avatar preset has no base asset reference.'));
    }
    addReferenceCommand(commands, nextDiagnostics, avatarPreset.assets.hairBack, 'avatar', 100);

    for (const { item, layerRank } of sortedLayers) {
      const slot = selectedSlots.get(item.id);
      addReferenceCommand(commands, nextDiagnostics, item.assets.renderLayer, 'item', layerRank, item.id, slot);
    }

    addReferenceCommand(commands, nextDiagnostics, avatarPreset.assets.hairFront, 'avatar', 650);

    const renderCommands = async () => {
      const loadedCommands = await Promise.all(commands.map(async (command) => {
        try {
          const image = await loadImage(command.reference);
          return { command, image };
        } catch {
          nextDiagnostics.push(createDiagnostic(
            'ASSET_LOAD_FAILED',
            `Asset '${command.reference.assetId}' could not be loaded.`,
            { itemId: command.itemId, slot: command.slot, assetId: command.reference.assetId },
          ));
          return null;
        }
      }));

      if (!active) return;
      for (const loaded of loadedCommands) {
        if (!loaded) continue;
        const { command, image } = loaded;
        if (command.kind !== 'background' &&
            (image.naturalWidth !== CANVAS_WIDTH || image.naturalHeight !== CANVAS_HEIGHT)) {
          nextDiagnostics.push(createDiagnostic(
            'ASSET_DIMENSION_MISMATCH',
            `Asset '${command.reference.assetId}' must use the ${CANVAS_WIDTH}x${CANVAS_HEIGHT} registered avatar canvas.`,
            { itemId: command.itemId, slot: command.slot, assetId: command.reference.assetId },
          ));
          continue;
        }
        if (command.kind === 'background') drawBackgroundCover(context, image);
        else context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      setDiagnostics([...nextDiagnostics]);
      onDiagnostics?.([...nextDiagnostics]);
    };

    void renderCommands();
    return () => {
      active = false;
    };
  }, [avatarPreset, scene, items, onDiagnostics]);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '5 / 7' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Layered avatar scene"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {diagnostics.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-amber-800" role="status" aria-live="polite">
          {diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.code}-${diagnostic.itemId ?? diagnostic.assetId ?? 'scene'}-${index}`}>
              {diagnostic.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
