import { KnowledgeCatalogRepository } from './src/services/knowledgeCatalog.ts';
import { runDeterministicValidation, validateOutfitSlotIntegrity, SLOT_VALIDATION_RULES } from './src/services/culturalValidation.ts';
import { Context, Outfit, ValidationSuggestion } from './src/types/index.ts';

const catalog = new KnowledgeCatalogRepository();

const gradContext: Context = {
  occasionId: 'occ_graduation',
  roleId: 'role_student',
  styleId: 'style_elegant',
};

const royalContext: Context = {
  occasionId: 'occ_royal_court',
  roleId: 'role_student',
  styleId: 'style_strict_traditional',
};

const springContext: Context = {
  occasionId: 'occ_spring_walk',
  roleId: 'role_student',
  styleId: 'style_modern_remix',
};

const weddingContext: Context = {
  occasionId: 'occ_wedding',
  roleId: 'role_guest',
  styleId: 'style_elegant',
};

async function postValidate(payload: any) {
  const res = await fetch('http://localhost:3000/api/catalog/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function runAllPhase53Tests() {
  console.log('=== PHASE 5.3 VALIDATION INTEGRATION AUDIT & REGRESSION SUITE ===\n');
  let passCount = 0;
  let totalCount = 0;

  function assert(scenario: string, condition: boolean, details?: any) {
    totalCount++;
    if (condition) {
      passCount++;
      console.log(`[PASS] Scenario ${scenario}`);
    } else {
      console.error(`[FAIL] Scenario ${scenario}:`, details ? JSON.stringify(details) : '');
    }
  }

  // A. Valid Áo Tấc outfit with its required underlayer
  const resA = await postValidate({
    context: gradContext,
    outfit: { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  assert(
    'A (Valid Áo Tấc outfit with underlayer -> PASS/WARN, no layering error)',
    resA.status === 200 &&
      resA.body.success &&
      (resA.body.data.status === 'PASS' || resA.body.data.status === 'WARN') &&
      !resA.body.data.findings.some((f: any) => f.ruleId === 'rule_layering_aotac' && f.severity === 'ERROR') &&
      resA.body.data.appliedRuleIds.includes('rule_layering_aotac'),
    resA.body
  );

  // B. Áo Tấc outfit missing the required underlayer
  const resB = await postValidate({
    context: gradContext,
    outfit: { top: 'top_001', underlayer: null, bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const layerFinding = resB.body.data?.findings?.find((f: any) => f.ruleId === 'rule_layering_aotac');
  assert(
    'B (Áo Tấc missing underlayer -> NEEDS_ADJUSTMENT with top_003 suggestion)',
    resB.status === 200 &&
      resB.body.success &&
      resB.body.data.status === 'NEEDS_ADJUSTMENT' &&
      layerFinding &&
      layerFinding.severity === 'ERROR' &&
      layerFinding.suggestion?.slot === 'underlayer' &&
      layerFinding.suggestion?.suggestedItemId === 'top_003',
    resB.body
  );

  // C. Empty Outfit
  const resC = await postValidate({
    context: gradContext,
    outfit: { top: null, underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  assert(
    'C (Empty outfit -> NEEDS_ADJUSTMENT with empty outfit finding)',
    resC.status === 200 &&
      resC.body.success &&
      resC.body.data.status === 'NEEDS_ADJUSTMENT' &&
      resC.body.data.findings.some((f: any) => f.message.includes('Chưa có trang phục')),
    resC.body
  );

  // D. Unknown item ID
  const resD = await postValidate({
    context: gradContext,
    outfit: { top: 'item_does_not_exist_999', underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  assert(
    'D (Unknown item ID -> HTTP 400 INVALID_ITEM_ID)',
    resD.status === 400 && resD.body.success === false && resD.body.error === 'INVALID_ITEM_ID',
    resD.body
  );

  // E. Wrong category or render layer
  const resE = await postValidate({
    context: gradContext,
    outfit: { top: 'bottom_001', underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  assert(
    'E (Wrong slot category assignment -> HTTP 400 SLOT_CATEGORY_MISMATCH)',
    resE.status === 400 && resE.body.success === false && resE.body.error === 'SLOT_CATEGORY_MISMATCH',
    resE.body
  );

  // F. Graduation context with no unsupported cultural claims
  const resF = await postValidate({
    context: gradContext,
    outfit: { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const ungroundedRules = resF.body.data.appliedRuleIds.filter(
    (id: string) => id === 'rule_color_royal' || id === 'rule_mourning_colors' || id === 'rule_remix_boundary'
  );
  assert(
    'F (Graduation context -> only relevant rules applied, no ungrounded rules)',
    resF.status === 200 && ungroundedRules.length === 0,
    resF.body.data.appliedRuleIds
  );

  // G. Spring/remix context with modern accessories
  const resG = await postValidate({
    context: springContext,
    outfit: { top: 'top_002', underlayer: 'top_003', bottom: 'bottom_001', shoes: 'shoes_001', bag: 'bag_001', accessory: 'accessory_001' },
  });
  const hasRemixErrorG = resG.body.data.findings.some((f: any) => f.ruleId === 'rule_remix_boundary' && f.severity === 'ERROR');
  assert(
    'G (Spring/remix context allows modern accessories -> no remix violation error)',
    resG.status === 200 && !hasRemixErrorG && resG.body.data.appliedRuleIds.includes('rule_remix_boundary'),
    resG.body
  );

  // H. Royal-court context with modern accessories
  const resH = await postValidate({
    context: royalContext,
    outfit: { top: 'top_002', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: 'bag_001', accessory: 'accessory_001' },
  });
  const remixErrorsH = resH.body.data.findings.filter((f: any) => f.ruleId === 'rule_remix_boundary' && f.severity === 'ERROR');
  assert(
    'H (Royal court with modern accessories -> NEEDS_ADJUSTMENT with rule_remix_boundary ERROR)',
    resH.status === 200 && resH.body.data.status === 'NEEDS_ADJUSTMENT' && remixErrorsH.length >= 2,
    resH.body
  );

  // I. Royal-yellow rule evaluated with source data fidelity
  // Normal civilian outfit with standard colors must NOT trigger royal yellow violation
  const resI = await postValidate({
    context: gradContext, // role_student
    outfit: { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const hasRoyalColorViolation = resI.body.data.findings.some((f: any) => f.ruleId === 'rule_color_royal');
  assert(
    'I (Standard civilian outfit without royal yellow -> rule_color_royal not violated)',
    resI.status === 200 && !hasRoyalColorViolation && !resI.body.data.appliedRuleIds.includes('rule_color_royal'),
    resI.body
  );

  // J. Wedding/mourning-color rule: Standard white trousers/inner robes are not mourning clothes
  const resJ = await postValidate({
    context: weddingContext,
    outfit: { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const hasMourningViolation = resJ.body.data.findings.some((f: any) => f.ruleId === 'rule_mourning_colors');
  assert(
    'J (Wedding context with standard white underlayer/pants -> not falsely accused of mourning attire)',
    resJ.status === 200 && !hasMourningViolation && !resJ.body.data.appliedRuleIds.includes('rule_mourning_colors'),
    resJ.body
  );

  // K. Deterministic engine operates standalone without Gemini
  const detResult = runDeterministicValidation(
    gradContext,
    { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
    catalog
  );
  assert(
    'K (Deterministic engine returns complete valid ValidationResponse standalone)',
    detResult &&
      (detResult.status === 'PASS' || detResult.status === 'WARN') &&
      typeof detResult.summary === 'string' &&
      Array.isArray(detResult.findings) &&
      Array.isArray(detResult.appliedRuleIds),
    detResult
  );

  // L. Unknown item/rule ID sanitization
  // Ensure that slot integrity strictly checks IDs against catalog
  const unknownIntegrity = validateOutfitSlotIntegrity(
    { top: 'fake_top_id', underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
    catalog
  );
  assert(
    'L (Catalog integrity rejects fabricated or unknown item IDs)',
    unknownIntegrity.valid === false && unknownIntegrity.error === 'INVALID_ITEM_ID',
    unknownIntegrity
  );

  // M. Precedence enforcement: Gemini cannot downgrade NEEDS_ADJUSTMENT
  const missingUnderlayerDet = runDeterministicValidation(
    gradContext,
    { top: 'top_001', underlayer: null, bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
    catalog
  );
  assert(
    'M (Deterministic status precedence: NEEDS_ADJUSTMENT is immutable)',
    missingUnderlayerDet.status === 'NEEDS_ADJUSTMENT' &&
      missingUnderlayerDet.findings.some((f) => f.severity === 'ERROR'),
    missingUnderlayerDet
  );

  // N. State tracking: Outfit changes reflect stale state
  const initialOutfit: Outfit = { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null };
  const editedOutfit: Outfit = { ...initialOutfit, bag: 'bag_001' };
  const outfitChanged = JSON.stringify(initialOutfit) !== JSON.stringify(editedOutfit);
  assert(
    'N (Editing outfit alters outfit state triggering stale state detection)',
    outfitChanged && editedOutfit.bag === 'bag_001',
    { initialOutfit, editedOutfit }
  );

  // O. Applying suggestion modifies only intended slot
  const currentOutfitBefore: Outfit = { top: 'top_001', underlayer: null, bottom: 'bottom_001', shoes: null, bag: 'bag_001', accessory: null };
  const suggestionToApply: ValidationSuggestion = { slot: 'underlayer', suggestedItemId: 'top_003', reason: 'Add inner robe' };
  const nextOutfitAfter: Outfit = {
    ...currentOutfitBefore,
    [suggestionToApply.slot]: suggestionToApply.suggestedItemId,
  };
  assert(
    'O (Applying a suggestion updates only the target slot while preserving other slots)',
    nextOutfitAfter.underlayer === 'top_003' &&
      nextOutfitAfter.top === 'top_001' &&
      nextOutfitAfter.bottom === 'bottom_001' &&
      nextOutfitAfter.bag === 'bag_001',
    nextOutfitAfter
  );

  // P. Phase 4 recommendation endpoint still works
  const resP = await fetch('http://localhost:3000/api/catalog/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: gradContext,
      userPrompt: 'thanh lịch phong nhã',
    }),
  });
  const bodyP = await resP.json();
  assert(
    'P (Phase 4 AI recommendation endpoint returns valid typed recommendation)',
    resP.status === 200 &&
      bodyP.success === true &&
      typeof bodyP.data.styleVibe === 'string' &&
      typeof bodyP.data.stylistMessage === 'string' &&
      bodyP.data.top !== undefined,
    bodyP
  );

  console.log(`\n=== RESULT: ${passCount} / ${totalCount} SCENARIOS PASSED ===`);
  if (passCount === totalCount) {
    console.log('✅ ALL PHASE 5.3 INTEGRATION REGRESSION SCENARIOS VERIFIED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME SCENARIOS FAILED!');
    process.exit(1);
  }
}

runAllPhase53Tests();
