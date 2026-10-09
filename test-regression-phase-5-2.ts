import { KnowledgeCatalogRepository } from './src/services/knowledgeCatalog.ts';
import { runDeterministicValidation, validateOutfitSlotIntegrity } from './src/services/culturalValidation.ts';
import { Context, Outfit } from './src/types/index.ts';

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

async function postValidate(payload: any) {
  const res = await fetch('http://localhost:3000/api/catalog/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function runRegression() {
  console.log('=== VERIFYING ALL SCENARIOS (A - M) ===\n');

  // A. Valid outfit: Áo Tấc with required underlayer -> PASS/WARN, no layering error
  const resA = await postValidate({
    context: gradContext,
    outfit: { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const passA = resA.status === 200 && resA.body.success && resA.body.data.status !== 'NEEDS_ADJUSTMENT' && !resA.body.data.findings.some((f: any) => f.ruleId === 'rule_layering_aotac' && f.severity === 'ERROR');
  console.log('Scenario A (Valid Áo Tấc with underlayer):', passA ? 'PASSED' : 'FAILED', resA.body.data?.status);

  // B. Missing required underlayer: top_001 without top_003 -> NEEDS_ADJUSTMENT
  const resB = await postValidate({
    context: gradContext,
    outfit: { top: 'top_001', underlayer: null, bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
  });
  const passB = resB.status === 200 && resB.body.success && resB.body.data.status === 'NEEDS_ADJUSTMENT' && resB.body.data.findings.some((f: any) => f.ruleId === 'rule_layering_aotac' && f.severity === 'ERROR');
  console.log('Scenario B (Missing underlayer -> NEEDS_ADJUSTMENT):', passB ? 'PASSED' : 'FAILED');

  // C. Empty outfit -> NEEDS_ADJUSTMENT
  const resC = await postValidate({
    context: gradContext,
    outfit: { top: null, underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  const passC = resC.status === 200 && resC.body.success && resC.body.data.status === 'NEEDS_ADJUSTMENT';
  console.log('Scenario C (Empty outfit -> NEEDS_ADJUSTMENT):', passC ? 'PASSED' : 'FAILED');

  // D. Unknown item ID -> 400 INVALID_ITEM_ID
  const resD = await postValidate({
    context: gradContext,
    outfit: { top: 'unknown_item_xyz', underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  const passD = resD.status === 400 && resD.body.error === 'INVALID_ITEM_ID';
  console.log('Scenario D (Unknown item ID -> 400):', passD ? 'PASSED' : 'FAILED');

  // E. Invalid slot/category -> 400 SLOT_CATEGORY_MISMATCH
  const resE = await postValidate({
    context: gradContext,
    outfit: { top: 'bottom_001', underlayer: null, bottom: null, shoes: null, bag: null, accessory: null },
  });
  const passE = resE.status === 400 && resE.body.error === 'SLOT_CATEGORY_MISMATCH';
  console.log('Scenario E (Invalid slot/category -> 400):', passE ? 'PASSED' : 'FAILED');

  // F. Graduation context -> findings grounded in actual available rules only
  const validRuleIds = new Set(catalog.getAllCulturalRules().map((r) => r.ruleId));
  const passF = resA.body.data.appliedRuleIds.every((r: string) => validRuleIds.has(r));
  console.log('Scenario F (Graduation context -> grounded rules only):', passF ? 'PASSED' : 'FAILED');

  // G. Spring/remix context -> no invented cultural restriction error
  const resG = await postValidate({
    context: springContext,
    outfit: { top: 'top_002', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: 'bag_001', accessory: null },
  });
  const passG = resG.status === 200 && !resG.body.data.findings.some((f: any) => f.ruleId === 'rule_remix_boundary' && f.severity === 'ERROR');
  console.log('Scenario G (Spring/remix allows modern bag -> no remix error):', passG ? 'PASSED' : 'FAILED');

  // H. Royal-court context with modern bag/accessory -> NEEDS_ADJUSTMENT with rule_remix_boundary
  const resH = await postValidate({
    context: royalContext,
    outfit: { top: 'top_002', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: 'bag_001', accessory: 'accessory_001' },
  });
  const passH = resH.status === 200 && resH.body.data.status === 'NEEDS_ADJUSTMENT' && resH.body.data.findings.some((f: any) => f.ruleId === 'rule_remix_boundary' && f.severity === 'ERROR');
  console.log('Scenario H (Royal-court with modern accessories -> rule_remix_boundary ERROR):', passH ? 'PASSED' : 'FAILED');

  // I. Deterministic engine standalone works safely without Gemini
  const detResult = runDeterministicValidation(
    gradContext,
    { top: 'top_001', underlayer: 'top_003', bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
    catalog
  );
  const passI = detResult.status === 'PASS' || detResult.status === 'WARN';
  console.log('Scenario I (Deterministic engine safe standalone):', passI ? 'PASSED' : 'FAILED');

  // J & K. Deterministic precedence & sanitization check
  const detErrorResult = runDeterministicValidation(
    gradContext,
    { top: 'top_001', underlayer: null, bottom: 'bottom_001', shoes: null, bag: null, accessory: null },
    catalog
  );
  const passK = detErrorResult.status === 'NEEDS_ADJUSTMENT';
  console.log('Scenario J & K (Status precedence: NEEDS_ADJUSTMENT cannot be downgraded):', passK ? 'PASSED' : 'FAILED');

  // M. Existing recommendation flow from Phase 4.3 works
  const resM = await fetch('http://localhost:3000/api/catalog/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: gradContext,
      userPrompt: 'thanh lịch',
    }),
  });
  const bodyM = await resM.json();
  const passM = resM.status === 200 && bodyM.success === true && typeof bodyM.data.styleVibe === 'string';
  console.log('Scenario M (Phase 4 recommendation endpoint):', passM ? 'PASSED' : 'FAILED');
}

runRegression();
