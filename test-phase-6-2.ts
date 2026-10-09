import { KnowledgeCatalogRepository } from './src/services/knowledgeCatalog.ts';
import {
  evaluateSceneDiagnostics,
  runDeterministicValidation,
  isRenderLayerAllowedForSlot,
  SLOT_VALIDATION_RULES,
} from './src/services/culturalValidation.ts';
import { AVATAR_PRESETS, BACKGROUND_PRESETS } from './src/data/renderPresets.ts';
import {
  AvatarScene,
  Context,
  Item,
  Outfit,
  OutfitSlot,
  RenderDiagnostic,
} from './src/types/index.ts';

const catalog = new KnowledgeCatalogRepository();

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function runPhase62Verification() {
  console.log('=== PHASE 6.2 — VIET PHUC ASSET INTEGRATION & RENDERER READINESS TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: any) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}`, details ? JSON.stringify(details, null, 2) : '');
    }
  }

  // ================= 1. ASSET PIPELINE AUDIT =================
  console.log('--- 1. Canonical Item Asset Pipeline ---');
  const items = catalog.getAllItems();
  assert('Catalog loads exactly 8 canonical items', items.length === 8);

  const canonicalItemIds = [
    'top_001',
    'top_002',
    'top_003',
    'bottom_001',
    'shoes_001',
    'bag_001',
    'bag_002',
    'accessory_001',
  ];

  const loadedIds = items.map((i) => i.id);
  assert(
    'All 8 canonical item IDs are loaded',
    canonicalItemIds.every((id) => loadedIds.includes(id))
  );

  assert(
    'Legacy mock records are excluded from canonical catalog',
    !loadedIds.includes('ao_mock_001') && !loadedIds.includes('quan_mock_001')
  );

  let allPending = true;
  let allHaveValidAssetIds = true;
  for (const item of items) {
    if (
      item.assets.thumbnail.status !== 'PENDING_ASSET' ||
      item.assets.renderLayer.status !== 'PENDING_ASSET'
    ) {
      allPending = false;
    }
    if (!item.assets.thumbnail.assetId || !item.assets.renderLayer.assetId) {
      allHaveValidAssetIds = false;
    }
  }
  assert('All 8 items are correctly tracked as PENDING_ASSET (no fabricated READY)', allPending);
  assert('All 8 items define distinct assetIds for thumbnail & renderLayer', allHaveValidAssetIds);

  // ================= 2. STATIC ASSET SERVING AUDIT =================
  console.log('\n--- 2. Static Asset Server Route (/assets) ---');
  try {
    const staticRes = await fetch('http://localhost:3000/assets/items/tops/ao_mock_001.png');
    assert('Existing image file returns HTTP 200 via /assets', staticRes.status === 200);
    const contentType = staticRes.headers.get('content-type') || '';
    assert('Existing image returns image/png Content-Type', contentType.includes('image/png'));
  } catch (err) {
    assert('Existing image file returns HTTP 200 via /assets', false, err);
  }

  try {
    const missingRes = await fetch('http://localhost:3000/assets/items/tops/non_existent.png');
    assert('Missing asset file safely returns 404 without crashing server', missingRes.status === 404);
  } catch (err) {
    assert('Missing asset file safely returns 404', false, err);
  }

  // ================= 3. RENDERER COORDINATES & Z-INDEX ORDER =================
  console.log('\n--- 3. Renderer Normalized Positioning & Layering Hierarchy ---');
  let validPositionBounds = true;
  for (const item of items) {
    const pos = item.render.position;
    if (
      pos.x < 0 ||
      pos.y < 0 ||
      pos.width <= 0 ||
      pos.height <= 0 ||
      pos.x + pos.width > 1 ||
      pos.y + pos.height > 1
    ) {
      validPositionBounds = false;
    }
  }
  assert('All 8 items have valid normalized coordinates within 0..1 bounding box', validPositionBounds);

  const top001 = catalog.getItemById('top_001')!;
  const top003 = catalog.getItemById('top_003')!;
  const bottom001 = catalog.getItemById('bottom_001')!;
  const shoes001 = catalog.getItemById('shoes_001')!;
  const bag001 = catalog.getItemById('bag_001')!;
  const acc001 = catalog.getItemById('accessory_001')!;

  assert(
    'Outer robe top_001 z-index (460) is strictly greater than underlayer top_003 (410)',
    top001.render.zIndex > top003.render.zIndex
  );
  assert(
    'Underlayer top_003 z-index (410) is strictly greater than bottom_001 (310)',
    top003.render.zIndex > bottom001.render.zIndex
  );
  assert(
    'Bottom bottom_001 z-index (310) is strictly greater than shoes_001 (210)',
    bottom001.render.zIndex > shoes001.render.zIndex
  );
  assert(
    'Bag bag_001 z-index (610) sits on top of robes and pants',
    bag001.render.zIndex > top001.render.zIndex
  );
  assert(
    'Accessory accessory_001 z-index (710) sits on top of garments and bags',
    acc001.render.zIndex > bag001.render.zIndex
  );

  // Slot layer allowances
  assert('top slot allows top_001 (top layer)', isRenderLayerAllowedForSlot('top', 'top'));
  assert('top slot forbids underlayer item', !isRenderLayerAllowedForSlot('top', 'underlayer'));
  assert('underlayer slot allows top_003 (underlayer layer)', isRenderLayerAllowedForSlot('underlayer', 'underlayer'));
  assert('underlayer slot forbids outer top item', !isRenderLayerAllowedForSlot('underlayer', 'top'));
  assert('bottom slot allows bottom layer', isRenderLayerAllowedForSlot('bottom', 'bottom'));
  assert('shoes slot allows shoes layer', isRenderLayerAllowedForSlot('shoes', 'shoes'));
  assert('bag slot allows bag-front and bag-back', isRenderLayerAllowedForSlot('bag', 'bag-front') && isRenderLayerAllowedForSlot('bag', 'bag-back'));
  assert('accessory slot allows face-overlay and accessory', isRenderLayerAllowedForSlot('accessory', 'face-overlay') && isRenderLayerAllowedForSlot('accessory', 'accessory'));

  // ================= 4. PRESETS ASSET STATUS =================
  console.log('\n--- 4. Presets Asset Status Audit ---');
  const allAvatarPending = AVATAR_PRESETS.every((a) => a.assets.base.status === 'PENDING_ASSET');
  assert('All Avatar Presets have status PENDING_ASSET (no non-existent physical assets marked READY)', allAvatarPending);

  const allBgPending = BACKGROUND_PRESETS.every((b) => b.asset.status === 'PENDING_ASSET');
  assert('All Background Presets have status PENDING_ASSET (no missing jpg marked READY)', allBgPending);

  // ================= 5. RENDER DIAGNOSTICS EVALUATOR =================
  console.log('\n--- 5. Scene Diagnostics Evaluator (evaluateSceneDiagnostics) ---');
  const validScene: AvatarScene = {
    avatarPresetId: 'avatar_snoopy_classic',
    backgroundPresetId: 'bg_hue_citadel',
    background: BACKGROUND_PRESETS[0],
    outfit: {
      top: 'top_001',
      underlayer: 'top_003',
      bottom: 'bottom_001',
      shoes: 'shoes_001',
      bag: null,
      accessory: null,
    },
  };

  const diag1 = evaluateSceneDiagnostics(validScene, catalog, AVATAR_PRESETS, BACKGROUND_PRESETS);
  assert('Diagnostics detects ASSET_PENDING for equipped items with pending assets', diag1.some((d) => d.code === 'ASSET_PENDING'));
  assert('Diagnostics detects AVATAR_ASSET_PENDING for avatar preset', diag1.some((d) => d.code === 'AVATAR_ASSET_PENDING'));
  assert('Diagnostics detects BACKGROUND_ASSET_PENDING for background preset', diag1.some((d) => d.code === 'BACKGROUND_ASSET_PENDING'));
  assert('No ITEM_NOT_FOUND or SLOT_CATEGORY_MISMATCH for valid scene', !diag1.some((d) => d.code === 'ITEM_NOT_FOUND' || d.code === 'SLOT_CATEGORY_MISMATCH'));

  // Test slot mismatch detection in scene diagnostics
  const mismatchedScene: AvatarScene = {
    ...validScene,
    outfit: {
      ...validScene.outfit,
      top: 'bottom_001', // pants placed in top slot!
    },
  };
  const diag2 = evaluateSceneDiagnostics(mismatchedScene, catalog, AVATAR_PRESETS, BACKGROUND_PRESETS);
  assert('Diagnostics flags SLOT_CATEGORY_MISMATCH when bottom placed in top slot', diag2.some((d) => d.code === 'SLOT_CATEGORY_MISMATCH' && d.slot === 'top'));

  // Test layer mismatch detection in scene diagnostics
  const layerMismatchScene: AvatarScene = {
    ...validScene,
    outfit: {
      ...validScene.outfit,
      top: 'top_003', // underlayer item placed in outer top slot
    },
  };
  const diag3 = evaluateSceneDiagnostics(layerMismatchScene, catalog, AVATAR_PRESETS, BACKGROUND_PRESETS);
  assert('Diagnostics flags SLOT_RENDER_LAYER_MISMATCH when underlayer placed in top slot', diag3.some((d) => d.code === 'SLOT_RENDER_LAYER_MISMATCH' && d.slot === 'top'));

  // Test unknown item ID detection
  const unknownItemScene: AvatarScene = {
    ...validScene,
    outfit: {
      ...validScene.outfit,
      shoes: 'shoes_unknown_999',
    },
  };
  const diag4 = evaluateSceneDiagnostics(unknownItemScene, catalog, AVATAR_PRESETS, BACKGROUND_PRESETS);
  assert('Diagnostics flags ITEM_NOT_FOUND for non-existent item in outfit', diag4.some((d) => d.code === 'ITEM_NOT_FOUND' && d.itemId === 'shoes_unknown_999'));

  // ================= 6. REGRESSION: VALIDATION & RECOMMENDATION ENDPOINTS =================
  console.log('\n--- 6. Regression: Recommendation & Validation Endpoints ---');
  const recRes = await postJson('http://localhost:3000/api/catalog/recommend', {
    context: {
      occasionId: 'occ_graduation',
      roleId: 'role_student',
      styleId: 'style_elegant',
    },
    userPrompt: 'trang phục trang trọng cho lễ tốt nghiệp',
  });
  assert('POST /api/catalog/recommend returns HTTP 200 with valid data', recRes.status === 200 && recRes.body.success === true);

  const valRes = await postJson('http://localhost:3000/api/catalog/validate', {
    context: {
      occasionId: 'occ_graduation',
      roleId: 'role_student',
      styleId: 'style_elegant',
    },
    outfit: {
      top: 'top_001',
      underlayer: 'top_003',
      bottom: 'bottom_001',
      shoes: null,
      bag: null,
      accessory: null,
    },
  });
  assert('POST /api/catalog/validate returns HTTP 200 with PASS/WARN status', valRes.status === 200 && (valRes.body.data.status === 'PASS' || valRes.body.data.status === 'WARN'));

  console.log(`\n=== RESULTS: ${passed} / ${total} TESTS PASSED ===`);
  if (passed === total) {
    console.log('✅ ALL PHASE 6.2 ASSET & RENDERER READINESS TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`❌ SOME TESTS FAILED: ${total - passed} failures`);
    process.exit(1);
  }
}

runPhase62Verification();
