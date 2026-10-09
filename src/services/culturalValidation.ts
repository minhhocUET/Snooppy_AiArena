import {
  AvatarPreset,
  AvatarScene,
  BackgroundPreset,
  Context,
  CulturalRule,
  FindingSeverity,
  Item,
  ItemCategory,
  Outfit,
  OutfitSlot,
  RenderDiagnostic,
  RenderLayer,
  ValidationFinding,
  ValidationResponse,
  ValidationStatus,
} from '../types/index.ts';
import { KnowledgeCatalogRepository } from './knowledgeCatalog.ts';

export const SLOT_VALIDATION_RULES: Record<OutfitSlot, { category: ItemCategory; allowedLayers: RenderLayer[] }> = {
  top: { category: 'top', allowedLayers: ['top'] },
  underlayer: { category: 'top', allowedLayers: ['underlayer'] },
  bottom: { category: 'bottom', allowedLayers: ['bottom'] },
  shoes: { category: 'shoes', allowedLayers: ['shoes'] },
  bag: { category: 'bag', allowedLayers: ['bag-front', 'bag-back'] },
  accessory: { category: 'accessory', allowedLayers: ['accessory', 'face-overlay'] },
};

export function isRenderLayerAllowedForSlot(slot: OutfitSlot, layer: RenderLayer): boolean {
  const rule = SLOT_VALIDATION_RULES[slot];
  return rule ? rule.allowedLayers.includes(layer) : false;
}

const SLOTS: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];

export interface SlotIntegrityResult {
  valid: true;
  resolvedItems: Map<OutfitSlot, Item>;
}

export interface SlotIntegrityError {
  valid: false;
  error: 'INVALID_ITEM_ID' | 'SLOT_CATEGORY_MISMATCH';
  message: string;
}

/**
 * Validates the basic structural integrity of the Outfit slots.
 * Ensures every non-null ID exists in the catalog and matches the expected category and renderLayer.
 */
export function validateOutfitSlotIntegrity(
  outfit: Outfit,
  catalog: KnowledgeCatalogRepository,
): SlotIntegrityResult | SlotIntegrityError {
  const resolvedItems = new Map<OutfitSlot, Item>();

  for (const slot of SLOTS) {
    const itemId = outfit[slot];
    if (itemId === null || itemId === undefined || itemId === '') {
      continue;
    }

    if (typeof itemId !== 'string') {
      return {
        valid: false,
        error: 'INVALID_ITEM_ID',
        message: `Mã món đồ ở vị trí '${slot}' không hợp lệ.`,
      };
    }

    const item = catalog.getItemById(itemId);
    if (!item) {
      return {
        valid: false,
        error: 'INVALID_ITEM_ID',
        message: `Món đồ '${itemId}' ở vị trí '${slot}' không tồn tại trong danh mục.`,
      };
    }

    const rule = SLOT_VALIDATION_RULES[slot];
    if (item.category !== rule.category || !rule.allowedLayers.includes(item.render.layer)) {
      return {
        valid: false,
        error: 'SLOT_CATEGORY_MISMATCH',
        message: `Món đồ '${item.name}' (danh mục: '${item.category}', tầng hiển thị: '${item.render.layer}') không hợp lệ cho vị trí '${slot}'.`,
      };
    }

    resolvedItems.set(slot, item);
  }

  return {
    valid: true,
    resolvedItems,
  };
}

/**
 * Pure, deterministic cultural and contextual validation engine.
 * Never mutates outfit or catalog, never calls external network or Gemini.
 */
export function runDeterministicValidation(
  context: Context,
  outfit: Outfit,
  catalog: KnowledgeCatalogRepository,
): ValidationResponse {
  const integrity = validateOutfitSlotIntegrity(outfit, catalog);
  if (!integrity.valid) {
    throw new Error(integrity.message);
  }

  const resolvedItems = integrity.resolvedItems;
  const appliedRuleIds = new Set<string>();
  const findings: ValidationFinding[] = [];

  // Case 1: Empty outfit check
  if (resolvedItems.size === 0) {
    return {
      status: 'NEEDS_ADJUSTMENT',
      summary: 'Người mẫu chưa mặc bất kỳ trang phục nào. Bạn vui lòng chọn đồ trước khi kiểm tra độ phù hợp.',
      findings: [
        {
          severity: 'ERROR',
          ruleId: null,
          message: 'Chưa có trang phục nào được chọn',
          detail: 'Bộ đồ hoàn toàn trống. Vui lòng chọn ít nhất áo và quần để hoàn thiện trang phục cơ bản.',
          suggestion: null,
        },
      ],
      appliedRuleIds: [],
    };
  }

  // Case 2: Mandatory Layering Rule (rule_layering_aotac)
  // If top is Áo Tấc (top_001) or Áo Ngũ Thân (top_002) and underlayer is null
  const topItem = resolvedItems.get('top');
  const underlayerItem = resolvedItems.get('underlayer');

  if (topItem) {
    const isAoTacOrNguThan =
      topItem.id === 'top_001' ||
      topItem.id === 'top_002' ||
      topItem.culture.sourceRefs?.some((r) => r.sourceId === 'rule_layering_aotac');

    if (isAoTacOrNguThan && !underlayerItem) {
      const suggestedUnderlayer = catalog
        .getAllItems()
        .find((i) => i.render.layer === 'underlayer');

      findings.push({
        slot: 'underlayer',
        severity: 'ERROR',
        ruleId: 'rule_layering_aotac',
        message: 'Thiếu áo lót trắng mặc kèm bên trong',
        detail:
          'Theo quy chuẩn trang phục Áo Tấc và Áo Ngũ Thân, bắt buộc phải có áo lót (áo trắng mỏng) mặc kèm bên trong để lộ cổ áo trang nhã, không được mặc trần.',
        suggestion: {
          slot: 'underlayer',
          suggestedItemId: suggestedUnderlayer?.id ?? 'top_003',
          reason: 'Bổ sung Áo lót trắng mỏng bên trong để hoàn thiện quy chuẩn cổ áo Việt phục.',
        },
      });
      appliedRuleIds.add('rule_layering_aotac');
    } else if (isAoTacOrNguThan && underlayerItem) {
      appliedRuleIds.add('rule_layering_aotac');
    }
  } else {
    // Missing top garment
    findings.push({
      slot: 'top',
      severity: 'ERROR',
      ruleId: null,
      message: 'Chưa chọn áo',
      detail: 'Trang phục cần có áo chính để đảm bảo tính lịch sự và hoàn chỉnh của bộ đồ.',
      suggestion: null,
    });
  }

  // Check bottom garment
  const bottomItem = resolvedItems.get('bottom');
  if (!bottomItem) {
    findings.push({
      slot: 'bottom',
      severity: 'ERROR',
      ruleId: null,
      message: 'Chưa chọn quần',
      detail: 'Trang phục cần có quần để hoàn chỉnh phần thân dưới.',
      suggestion: null,
    });
  }

  // Case 3: Modern Remix Boundary Rule (rule_remix_boundary)
  // If occasion is Royal Court (occ_royal_court), forbid modern bags/accessories
  if (context.occasionId === 'occ_royal_court') {
    for (const [slot, item] of resolvedItems.entries()) {
      if (slot === 'bag' || slot === 'accessory' || slot === 'shoes') {
        const isModern = item.metadata.styleIds.includes('style_modern_remix');

        if (isModern) {
          findings.push({
            slot,
            severity: 'ERROR',
            ruleId: 'rule_remix_boundary',
            message: `Phụ kiện hiện đại '${item.name}' không được phép trong Lễ hội cung đình`,
            detail:
              'Theo quy tắc văn hóa, cấm kết hợp phụ kiện hiện đại (túi xách, giày, kính) trong không gian Lễ hội cung đình đòi hỏi tính lịch sử tuyệt đối.',
            suggestion: {
              slot,
              suggestedItemId: null,
              reason: 'Tháo phụ kiện hiện đại ra khỏi bộ trang phục cung đình.',
            },
          });
          appliedRuleIds.add('rule_remix_boundary');
        }
      }
    }
  } else if (
    context.occasionId === 'occ_spring_walk' ||
    context.styleId === 'style_modern_remix'
  ) {
    const hasModernAccessory =
      resolvedItems.has('bag') || resolvedItems.has('accessory');
    if (hasModernAccessory) {
      appliedRuleIds.add('rule_remix_boundary');
    }
  }

  // Case 3b: Royal Color Restriction (rule_color_royal)
  // "Tuyệt đối không gợi ý trang phục có màu 'Vàng chính sắc' (Hoàng thổ) và họa tiết 'Rồng 5 móng' cho các vai trò dân thường hoặc khách mời. Đây là đặc quyền của Vua."
  const isCivilianOrGuest =
    context.roleId === 'role_guest' ||
    context.roleId === 'role_student';

  if (isCivilianOrGuest) {
    for (const [slot, item] of resolvedItems.entries()) {
      const colors = item.metadata.colors || [];
      const tags = item.metadata.tags || [];
      const hasRoyalColor = colors.some((c) => {
        const lower = c.toLowerCase();
        return (
          lower.includes('vàng chính sắc') ||
          lower.includes('hoàng thổ') ||
          lower.includes('hoang_tho') ||
          lower === 'royal_yellow'
        );
      });
      const hasFiveClawDragon = tags.some((t) => {
        const lower = t.toLowerCase();
        return lower.includes('rong_5_mong') || lower.includes('rồng 5 móng');
      });

      if (hasRoyalColor || hasFiveClawDragon) {
        findings.push({
          slot,
          severity: 'ERROR',
          ruleId: 'rule_color_royal',
          message: `Màu 'Vàng chính sắc' hoặc họa tiết 'Rồng 5 móng' trên '${item.name}' là đặc quyền của bậc Đế vương`,
          detail:
            'Theo điển chế trang phục triều Nguyễn, màu Vàng chính sắc (Hoàng thổ) và họa tiết rồng 5 móng là đặc quyền tối thượng của nhà Vua, vai trò thường dân hoặc khách mời không được sử dụng.',
          suggestion: {
            slot,
            suggestedItemId: null,
            reason: 'Thay thế bằng trang phục có tông màu phù hợp với vai trò dân sự.',
          },
        });
        appliedRuleIds.add('rule_color_royal');
      }
    }
  }

  // Case 3c: Mourning Color Restriction (rule_mourning_colors)
  // "Không gợi ý toàn bộ trang phục màu trắng tuyền hoặc đen tuyền (như đồ tang lễ) cho hoàn cảnh 'Đám cưới truyền thống' hoặc 'Dạo phố du xuân' trừ khi đó là màu điểm xuyết."
  // Note: Standard white pants/inner robes or black silk robes are normal attire and do NOT imply mourning intent.
  // This rule applies only if items explicitly carry mourning metadata/designations.
  if (context.occasionId === 'occ_wedding' || context.occasionId === 'occ_spring_walk') {
    for (const [slot, item] of resolvedItems.entries()) {
      const tags = item.metadata.tags || [];
      const origin = item.culture.origin?.toLowerCase() || '';
      const isMourningAttire =
        tags.some((t) => t.toLowerCase().includes('tang') || t.toLowerCase().includes('mourning')) ||
        origin.includes('tang lễ') ||
        origin.includes('đồ tang');

      if (isMourningAttire) {
        findings.push({
          slot,
          severity: 'ERROR',
          ruleId: 'rule_mourning_colors',
          message: `Trang phục mang tính chất tang lễ '${item.name}' kiêng kỵ trong hỉ sự và du xuân`,
          detail:
            'Theo phong tục truyền thống, không sử dụng trang phục mang tính chất tang lễ trong ngày cưới truyền thống hoặc dạo phố du xuân.',
          suggestion: {
            slot,
            suggestedItemId: null,
            reason: 'Thay thế bằng trang phục mang sắc màu tươi sáng phù hợp với ngày vui.',
          },
        });
        appliedRuleIds.add('rule_mourning_colors');
      }
    }
  }

  // Case 4: Occasion Incompatibility Checks
  for (const [slot, item] of resolvedItems.entries()) {
    if (
      item.metadata.occasionIds.length > 0 &&
      !item.metadata.occasionIds.includes(context.occasionId)
    ) {
      // Soft context mismatch
      findings.push({
        slot,
        severity: 'WARNING',
        ruleId: null,
        message: `Món đồ '${item.name}' không phải trang phục tiêu biểu cho hoàn cảnh này`,
        detail: `Món đồ này thường được sử dụng trong các dịp khác (${item.metadata.occasionIds.join(', ')}). Bạn có thể cân nhắc thay thế nếu muốn đạt độ tương thích cao nhất.`,
        suggestion: null,
      });
    }
  }

  // Case 5: Style Incompatibility Checks
  for (const [slot, item] of resolvedItems.entries()) {
    if (
      item.metadata.styleIds.length > 0 &&
      !item.metadata.styleIds.includes(context.styleId)
    ) {
      findings.push({
        slot,
        severity: 'WARNING',
        ruleId: null,
        message: `Phong cách của '${item.name}' có phần khác biệt với phong cách đã chọn`,
        detail: `Món đồ có xu hướng mang phong cách ${item.metadata.styleIds.join(', ')}, trong khi bạn đang chọn phong cách ${context.styleId}.`,
        suggestion: null,
      });
    }
  }

  // Determine final status based on strict precedence: NEEDS_ADJUSTMENT > WARN > PASS
  let status: ValidationStatus = 'PASS';
  if (findings.some((f) => f.severity === 'ERROR')) {
    status = 'NEEDS_ADJUSTMENT';
  } else if (findings.some((f) => f.severity === 'WARNING')) {
    status = 'WARN';
  }

  // Generate safe Vietnamese summary
  let summary = '';
  if (status === 'NEEDS_ADJUSTMENT') {
    summary =
      'Trang phục hiện tại chưa đạt quy chuẩn văn hóa hoặc bối cảnh đã chọn. Bạn vui lòng xem các điểm cần điều chỉnh bên dưới.';
  } else if (status === 'WARN') {
    summary =
      'Bộ trang phục nhìn chung phù hợp nhưng có một vài điểm cần lưu ý để hài hòa hơn với bối cảnh và phong cách.';
  } else {
    summary =
      'Bộ trang phục hoàn toàn đạt chuẩn mực và rất hài hòa với bối cảnh bạn đã chọn!';
  }

  return {
    status,
    summary,
    findings,
    appliedRuleIds: Array.from(appliedRuleIds),
  };
}

/**
 * Evaluates renderer and asset readiness diagnostics for an AvatarScene.
 * Checks for missing catalog items, slot/category mismatches, layer incompatibilities,
 * pending assets (items, avatar body, backdrop), and out-of-bounds positioning.
 */
export function evaluateSceneDiagnostics(
  scene: AvatarScene,
  catalog: KnowledgeCatalogRepository | Item[],
  avatarPresets?: AvatarPreset[],
  backgroundPresets?: BackgroundPreset[],
): RenderDiagnostic[] {
  const diagnostics: RenderDiagnostic[] = [];
  const items = Array.isArray(catalog) ? catalog : catalog.getAllItems();
  const itemsById = new Map(items.map((item) => [item.id, item]));

  // 1. Check Avatar Preset
  if (avatarPresets && avatarPresets.length > 0) {
    const avatar = avatarPresets.find((a) => a.avatarPresetId === scene.avatarPresetId);
    if (!avatar) {
      diagnostics.push({
        code: 'SCENE_REFERENCE_MISMATCH',
        message: `Không tìm thấy preset avatar với ID: ${scene.avatarPresetId}`,
      });
    } else if (avatar.assets.base?.status === 'PENDING_ASSET') {
      diagnostics.push({
        code: 'AVATAR_ASSET_PENDING',
        assetId: avatar.assets.base.assetId,
        message: `Tư liệu hình ảnh người mẫu (${avatar.name}) đang chờ cập nhật (PENDING_ASSET).`,
      });
    }
  }

  // 2. Check Background Preset
  if (backgroundPresets && backgroundPresets.length > 0) {
    const background = backgroundPresets.find((b) => b.backgroundPresetId === scene.backgroundPresetId);
    if (!background) {
      diagnostics.push({
        code: 'SCENE_REFERENCE_MISMATCH',
        message: `Không tìm thấy preset phông nền với ID: ${scene.backgroundPresetId}`,
      });
    } else if (background.asset?.status === 'PENDING_ASSET') {
      diagnostics.push({
        code: 'BACKGROUND_ASSET_PENDING',
        assetId: background.asset.assetId,
        message: `Tư liệu phông nền (${background.name}) đang chờ cập nhật (PENDING_ASSET).`,
      });
    }
  } else if (scene.background?.asset?.status === 'PENDING_ASSET') {
    diagnostics.push({
      code: 'BACKGROUND_ASSET_PENDING',
      assetId: scene.background.asset.assetId,
      message: `Tư liệu phông nền (${scene.background.name}) đang chờ cập nhật (PENDING_ASSET).`,
    });
  }

  // 3. Check Outfit Slot & Item Diagnostics
  const slots: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];
  for (const slot of slots) {
    const itemId = scene.outfit[slot];
    if (!itemId) continue;

    const item = itemsById.get(itemId);
    if (!item) {
      diagnostics.push({
        code: 'ITEM_NOT_FOUND',
        slot,
        itemId,
        message: `Trang phục không tồn tại trong danh mục: ${itemId}`,
      });
      continue;
    }

    const slotRule = SLOT_VALIDATION_RULES[slot];

    // Check slot category match
    if (slotRule && slotRule.category !== item.category) {
      diagnostics.push({
        code: 'SLOT_CATEGORY_MISMATCH',
        slot,
        itemId,
        message: `Danh mục '${item.category}' của '${item.name}' không khớp với slot '${slot}'.`,
      });
    }

    // Check slot render layer match
    if (slotRule && !slotRule.allowedLayers.includes(item.render.layer)) {
      diagnostics.push({
        code: 'SLOT_RENDER_LAYER_MISMATCH',
        slot,
        itemId,
        message: `Lớp hiển thị '${item.render.layer}' của '${item.name}' không được phép trong slot '${slot}'.`,
      });
    }

    // Check avatar compatibility
    if (
      item.render.compatibleAvatarIds &&
      item.render.compatibleAvatarIds.length > 0 &&
      !item.render.compatibleAvatarIds.includes(scene.avatarPresetId)
    ) {
      diagnostics.push({
        code: 'AVATAR_INCOMPATIBLE',
        slot,
        itemId,
        message: `Trang phục '${item.name}' không tương thích với avatar '${scene.avatarPresetId}'.`,
      });
    }

    // Check render position bounds
    const pos = item.render.position;
    if (
      !pos ||
      pos.x < 0 ||
      pos.y < 0 ||
      pos.width <= 0 ||
      pos.height <= 0 ||
      pos.x + pos.width > 1 ||
      pos.y + pos.height > 1
    ) {
      diagnostics.push({
        code: 'RENDER_METADATA_INVALID',
        slot,
        itemId,
        message: `Tọa độ hiển thị của '${item.name}' không hợp lệ hoặc vượt ngoài khung canvas (0..1).`,
      });
    }

    // Check asset status
    if (item.assets.renderLayer.status === 'PENDING_ASSET') {
      diagnostics.push({
        code: 'ASSET_PENDING',
        slot,
        itemId,
        assetId: item.assets.renderLayer.assetId,
        message: `Ảnh lớp đồ họa (renderLayer) của '${item.name}' đang ở trạng thái PENDING_ASSET.`,
      });
    }

    if (item.assets.thumbnail.status === 'PENDING_ASSET') {
      diagnostics.push({
        code: 'ASSET_PENDING',
        slot,
        itemId,
        assetId: item.assets.thumbnail.assetId,
        message: `Ảnh thu nhỏ (thumbnail) của '${item.name}' đang ở trạng thái PENDING_ASSET.`,
      });
    }
  }

  return diagnostics;
}

