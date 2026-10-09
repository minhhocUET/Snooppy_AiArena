import { KnowledgeCatalogRepository } from './src/services/knowledgeCatalog.ts';
import { runDeterministicValidation } from './src/services/culturalValidation.ts';
import { Context, Outfit } from './src/types/index.ts';

const catalog = new KnowledgeCatalogRepository();

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function runDemoScenarios() {
  console.log('=== PHASE 6.1 DEMO READINESS & END-TO-END SCENARIO VERIFICATION ===\n');

  // ================= SCENARIO A: GRADUATION =================
  console.log('--- SCENARIO A: Graduation Context ---');
  const gradContext: Context = {
    occasionId: 'occ_graduation',
    roleId: 'role_student',
    styleId: 'style_elegant',
  };

  // Step 1: Request Recommendation
  const recA = await postJson('http://localhost:3000/api/catalog/recommend', {
    context: gradContext,
    userPrompt: 'trang phục tốt nghiệp trang nhã, đúng chuẩn mực',
  });
  const recPassA =
    recA.status === 200 &&
    recA.body.success === true &&
    typeof recA.body.data.styleVibe === 'string' &&
    typeof recA.body.data.stylistMessage === 'string' &&
    (recA.body.data.top === 'top_001' || recA.body.data.top === 'top_002');
  console.log('1. Recommendation returned valid catalog items:', recPassA ? 'PASS' : 'FAIL', recA.body.data?.styleVibe);

  // Step 2: Validate equipped outfit with underlayer
  const equippedOutfitA: Outfit = {
    top: 'top_001',
    underlayer: 'top_003',
    bottom: 'bottom_001',
    shoes: null,
    bag: null,
    accessory: null,
  };
  const valA = await postJson('http://localhost:3000/api/catalog/validate', {
    context: gradContext,
    outfit: equippedOutfitA,
  });
  const valPassA =
    valA.status === 200 &&
    valA.body.success === true &&
    (valA.body.data.status === 'PASS' || valA.body.data.status === 'WARN') &&
    !valA.body.data.findings.some((f: any) => f.severity === 'ERROR') &&
    valA.body.data.appliedRuleIds.includes('rule_layering_aotac') &&
    !valA.body.data.appliedRuleIds.includes('rule_color_royal');
  console.log('2. Outfit validation produced PASS/WARN with valid cultural rules:', valPassA ? 'PASS' : 'FAIL', valA.body.data?.status);

  // ================= SCENARIO B: SPRING / MODERN REMIX =================
  console.log('\n--- SCENARIO B: Spring / Modern Remix ---');
  const springContext: Context = {
    occasionId: 'occ_spring_walk',
    roleId: 'role_student',
    styleId: 'style_modern_remix',
  };

  const remixOutfit: Outfit = {
    top: 'top_002', // Áo Ngũ Thân
    underlayer: 'top_003', // Áo lót trắng
    bottom: 'bottom_001', // Quần lụa trắng
    shoes: 'shoes_001', // Giày bệt hiện đại
    bag: 'bag_001', // Túi đeo vai hiện đại
    accessory: 'accessory_001', // Kính gọng mảnh hiện đại
  };

  const valB = await postJson('http://localhost:3000/api/catalog/validate', {
    context: springContext,
    outfit: remixOutfit,
  });
  const hasRemixViolation = valB.body.data?.findings?.some(
    (f: any) => f.ruleId === 'rule_remix_boundary' && f.severity === 'ERROR'
  );
  const valPassB =
    valB.status === 200 &&
    valB.body.success === true &&
    !hasRemixViolation &&
    valB.body.data.appliedRuleIds.includes('rule_remix_boundary');
  console.log('1. Modern remix in spring walk allows modern accessories:', valPassB ? 'PASS' : 'FAIL', 'Remix violations:', hasRemixViolation ? 'YES' : 'NONE');

  // ================= SCENARIO C: MISSING UNDERLAYER =================
  console.log('\n--- SCENARIO C: Missing Underlayer ---');
  const unlayeredOutfit: Outfit = {
    top: 'top_001', // Áo Tấc
    underlayer: null, // Thiếu áo lót
    bottom: 'bottom_001',
    shoes: null,
    bag: null,
    accessory: null,
  };

  const valC = await postJson('http://localhost:3000/api/catalog/validate', {
    context: gradContext,
    outfit: unlayeredOutfit,
  });
  const layerErrorC = valC.body.data?.findings?.find((f: any) => f.ruleId === 'rule_layering_aotac');
  const valPassC =
    valC.status === 200 &&
    valC.body.data.status === 'NEEDS_ADJUSTMENT' &&
    layerErrorC &&
    layerErrorC.severity === 'ERROR' &&
    layerErrorC.suggestion?.slot === 'underlayer' &&
    layerErrorC.suggestion?.suggestedItemId === 'top_003';
  console.log('1. Missing underlayer produces NEEDS_ADJUSTMENT:', valPassC ? 'PASS' : 'FAIL');
  console.log('2. Suggestion recommends top_003 without auto-mutating:', layerErrorC?.suggestion?.suggestedItemId === 'top_003' ? 'PASS' : 'FAIL');

  // ================= SCENARIO D: GEMINI UNAVAILABLE / FALLBACK =================
  console.log('\n--- SCENARIO D: Gemini Unavailable / Fallback ---');
  const detFallback = runDeterministicValidation(gradContext, equippedOutfitA, catalog);
  const fallbackPass =
    detFallback &&
    (detFallback.status === 'PASS' || detFallback.status === 'WARN') &&
    typeof detFallback.summary === 'string' &&
    detFallback.findings.length === 0;
  console.log('1. Deterministic validation fallback runs standalone:', fallbackPass ? 'PASS' : 'FAIL', detFallback.status);

  console.log('\n=== ALL 4 DEMO SCENARIOS COMPLETED ===');
}

runDemoScenarios();
