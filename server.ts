import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { EVENTS_DATA, INITIAL_ITEMS } from './src/data/mockItems.ts';
import { KnowledgeCatalogRepository } from './src/services/knowledgeCatalog.ts';
import {
  ItemCategory,
  OutfitSlot,
  RenderLayer,
  RecommendationResponse,
  ValidationStatus,
  FindingSeverity,
  ValidationFinding,
  ValidationSuggestion,
  ValidationResponse,
  ValidationRequest,
  Outfit,
  Context,
} from './src/types';
import {
  runDeterministicValidation,
  validateOutfitSlotIntegrity,
  SLOT_VALIDATION_RULES,
} from './src/services/culturalValidation.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const knowledgeCatalog = new KnowledgeCatalogRepository();

// Initialize GoogleGenAI SDK safely
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
  }
}

// 1. API: Get all event contexts
app.get('/api/events', (_req, res) => {
  res.json({
    success: true,
    data: EVENTS_DATA
  });
});

// 2. API: Get fashion items (filtered or enriched by event)
app.get('/api/items', (req, res) => {
  const eventId = (req.query.event as string) || 'cafe_street';
  const category = req.query.category as string | undefined;

  const currentEvent = EVENTS_DATA.find((e) => e.id === eventId) || EVENTS_DATA[0];

  const enrichedItems = INITIAL_ITEMS.map((item) => {
    // Check if item matches current event
    const isDirectMatch = item.suitableEvents.includes(eventId);
    // Check tag overlaps
    const hasTagMatch = item.tags.some((tag) => currentEvent.suitableTags.includes(tag));
    const isSuitable = isDirectMatch || hasTagMatch;

    return {
      ...item,
      isSuitableForCurrentEvent: isSuitable,
      suitabilityScore: isSuitable ? Math.max(item.suitabilityScore, 85) : Math.min(item.suitabilityScore, 50)
    };
  });

  const filtered = category
    ? enrichedItems.filter((i) => i.category === category)
    : enrichedItems;

  res.json({
    success: true,
    data: filtered,
    meta: {
      eventId,
      total: filtered.length
    }
  });
});

// Canonical knowledge-backed catalog API. Legacy /api/items remains isolated above.
app.get('/api/catalog/items', (req, res) => {
  const category = req.query.category as string | undefined;
  if (category && !['top', 'bottom', 'shoes', 'bag', 'accessory'].includes(category)) {
    return res.status(400).json({ success: false, error: 'INVALID_CATEGORY' });
  }

  const contextValues = ['occasionId', 'roleId', 'styleId'].map((key) => req.query[key]);
  const hasContext = contextValues.some((value) => value !== undefined);
  if (hasContext && !contextValues.every((value) => typeof value === 'string' && value.length > 0)) {
    return res.status(400).json({ success: false, error: 'INCOMPLETE_CONTEXT' });
  }

  const diagnostics = knowledgeCatalog.getDiagnostics();
  if (diagnostics.status === 'BLOCKED') {
    return res.status(503).json({ success: false, error: 'CATALOG_BLOCKED', diagnostics });
  }

  const contextItems = hasContext
    ? knowledgeCatalog.getItemsByContext({
        occasionId: contextValues[0] as string,
        roleId: contextValues[1] as string,
        styleId: contextValues[2] as string,
      })
    : knowledgeCatalog.getAllItems();
  const data = category
    ? contextItems.filter((item) => item.category === (category as ItemCategory))
    : contextItems;

  return res.json({ success: true, data, diagnostics });
});

app.get('/api/catalog/items/:id', (req, res) => {
  const diagnostics = knowledgeCatalog.getDiagnostics();
  if (diagnostics.status === 'BLOCKED') {
    return res.status(503).json({ success: false, error: 'CATALOG_BLOCKED', diagnostics });
  }

  const item = knowledgeCatalog.getItemById(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'ITEM_NOT_FOUND' });
  return res.json({ success: true, data: item });
});

app.get('/api/catalog/occasions', (_req, res) => {
  res.json({ success: true, data: knowledgeCatalog.getAllOccasions() });
});

app.get('/api/catalog/roles', (_req, res) => {
  res.json({ success: true, data: knowledgeCatalog.getAllRoles() });
});

app.get('/api/catalog/styles', (_req, res) => {
  res.json({ success: true, data: knowledgeCatalog.getAllStyles() });
});

app.get('/api/catalog/cultural-rules', (_req, res) => {
  res.json({ success: true, data: knowledgeCatalog.getAllCulturalRules() });
});

// Canonical Phase 4.1 Recommendation Endpoint
app.post('/api/catalog/recommend', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Request body must be a JSON object.',
      });
    }

    const { context, userPrompt, currentOutfit } = body;

    // Validate context existence
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CONTEXT',
        message: 'Context object with occasionId, roleId, and styleId is required.',
      });
    }

    const { occasionId, roleId, styleId } = context;
    if (
      typeof occasionId !== 'string' || !occasionId.trim() ||
      typeof roleId !== 'string' || !roleId.trim() ||
      typeof styleId !== 'string' || !styleId.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CONTEXT',
        message: 'occasionId, roleId, and styleId must be non-empty strings.',
      });
    }

    // Validate context values exist in catalog
    const allOccasions = knowledgeCatalog.getAllOccasions();
    const allRoles = knowledgeCatalog.getAllRoles();
    const allStyles = knowledgeCatalog.getAllStyles();
    const targetOccasion = allOccasions.find((o) => o.id === occasionId);
    const targetRole = allRoles.find((r) => r.id === roleId);
    const targetStyle = allStyles.find((s) => s.id === styleId);

    if (!targetOccasion || !targetRole || !targetStyle) {
      return res.status(400).json({
        success: false,
        error: 'UNKNOWN_CONTEXT_OPTION',
        message: 'One or more context options (occasionId, roleId, styleId) do not exist in the knowledge catalog.',
      });
    }

    // Validate optional userPrompt
    if (userPrompt !== undefined && typeof userPrompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_PROMPT',
        message: 'userPrompt must be a string if provided.',
      });
    }

    // Validate optional currentOutfit
    const validSlots: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];
    if (currentOutfit !== undefined) {
      if (!currentOutfit || typeof currentOutfit !== 'object' || Array.isArray(currentOutfit)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CURRENT_OUTFIT',
          message: 'currentOutfit must be an object if provided.',
        });
      }
      for (const [slotKey, slotVal] of Object.entries(currentOutfit)) {
        if (!validSlots.includes(slotKey as OutfitSlot)) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_CURRENT_OUTFIT_SLOT',
            message: `Unknown outfit slot '${slotKey}'.`,
          });
        }
        if (slotVal !== null && typeof slotVal !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'INVALID_CURRENT_OUTFIT_VALUE',
            message: `Value for slot '${slotKey}' must be a string item ID or null.`,
          });
        }
      }
    }

    // Check catalog status
    const diagnostics = knowledgeCatalog.getDiagnostics();
    if (diagnostics.status === 'BLOCKED') {
      return res.status(503).json({
        success: false,
        error: 'CATALOG_BLOCKED',
        message: 'Catalog is currently BLOCKED.',
        diagnostics,
      });
    }

    // Check Gemini service availability
    if (!apiKey || !ai) {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_UNAVAILABLE',
        message: 'Gemini AI recommendation service is not available (API key is not configured or client failed to initialize).',
      });
    }

    // Filter candidates using canonical Context
    const allItems = knowledgeCatalog.getAllItems();
    const exactCandidates = knowledgeCatalog.getItemsByContext(context);

    // If no context candidates exist, handle safely without fabricating
    if (exactCandidates.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'NO_SUITABLE_CANDIDATES',
        message: 'Không tìm thấy trang phục phù hợp với bối cảnh đã chọn trong danh mục.',
      });
    }

    // Build context-aware candidate pool
    const candidateMap = new Map<string, typeof allItems[0]>();
    for (const item of exactCandidates) {
      candidateMap.set(item.id, item);
    }

    // Include rule-driven complementary items (e.g. underlayers required by layering rule)
    const culturalRules = knowledgeCatalog.getAllCulturalRules();
    const hasLayeringRule = culturalRules.some((r) => r.ruleId === 'rule_layering_aotac');
    if (hasLayeringRule) {
      for (const item of allItems) {
        if (item.render.layer === 'underlayer') {
          candidateMap.set(item.id, item);
        }
      }
    }

    // If user supplied currentOutfit, include worn items as recommendation context
    if (currentOutfit && typeof currentOutfit === 'object') {
      for (const slotId of Object.values(currentOutfit)) {
        if (typeof slotId === 'string' && slotId.trim()) {
          const wornItem = knowledgeCatalog.getItemById(slotId.trim());
          if (wornItem) {
            candidateMap.set(wornItem.id, wornItem);
          }
        }
      }
    }

    const candidateItems = Array.from(candidateMap.values());

    // Minimal development diagnostic log (no secrets or sensitive data)
    console.log(
      `[Recommendation Grounding] Context: ${JSON.stringify(context)} | Catalog total: ${allItems.length} | Context candidates: ${candidateItems.length} | Rules: ${culturalRules.length}`
    );

    const candidateCatalog = candidateItems.map((item) => ({
      id: item.id,
      category: item.category,
      renderLayer: item.render.layer,
      name: item.name,
      description: item.description,
      colors: item.metadata.colors,
      materials: item.metadata.materials,
      styleIds: item.metadata.styleIds,
      occasionIds: item.metadata.occasionIds,
      cultureOrigin: item.culture.origin ?? null,
      cultureCharacteristics: item.culture.characteristics,
      cultureMeaning: item.culture.meaning ?? null,
    }));

    const systemInstruction = `You are the fashion stylist AI for "Việt Phục Remix" (Vietnamese traditional outfit and modern remix dress-up).
Your task is to recommend a culturally respectful and stylish outfit for the given Context, user prompt, and optional current outfit.

AUTHORITATIVE CONSTRAINTS:
1. The available items catalog supplied below is CLOSED and EXCLUSIVE. You MUST ONLY recommend item IDs from this catalog. NEVER invent, fabricate, or hallucinate item IDs.
2. Cultural rules supplied below are AUTHORITATIVE:
   "Cultural rules supplied in the request are authoritative. Do not invent additional cultural rules. Only reference rule IDs supplied by the system."
3. Every slot must be an item ID from the catalog OR null:
   - "top": An item with category "top" and renderLayer "top" (e.g. outer robe such as Áo Tấc, Áo Ngũ Thân).
   - "underlayer": An item with category "top" and renderLayer "underlayer" (e.g. white inner robe). Required if a top requires an inner layer (see rule_layering_aotac).
   - "bottom": An item with category "bottom" and renderLayer "bottom".
   - "shoes": An item with category "shoes" and renderLayer "shoes".
   - "bag": An item with category "bag" and renderLayer "bag-front" or "bag-back".
   - "accessory": An item with category "accessory" and renderLayer "accessory" or "face-overlay".
4. If current outfit is provided, consider it as user preference: you may preserve fitting items or replace/add items to complete the outfit or resolve cultural/context conflicts.
5. In "appliedRuleIds", list ONLY the ruleId strings from the supplied rules that were applied or followed in this recommendation.
6. Provide "styleVibe" (a short stylish name in Vietnamese) and "stylistMessage" (a warm, professional explanation in Vietnamese explaining why these items were chosen based on the context and cultural etiquette).
7. Return ONLY a pure JSON object matching the required schema with no extra text or markdown formatting.`;

    const userContent = JSON.stringify({
      context: {
        occasion: { id: targetOccasion.id, name: targetOccasion.label, description: targetOccasion.description },
        role: { id: targetRole.id, name: targetRole.label, description: targetRole.description },
        style: { id: targetStyle.id, name: targetStyle.label, description: targetStyle.description },
      },
      userPrompt: userPrompt || null,
      currentOutfit: currentOutfit || null,
      availableItems: candidateCatalog,
      culturalRules: culturalRules,
    }, null, 2);

    let geminiResponse;
    const generateConfig = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          top: { type: 'string', nullable: true },
          underlayer: { type: 'string', nullable: true },
          bottom: { type: 'string', nullable: true },
          shoes: { type: 'string', nullable: true },
          bag: { type: 'string', nullable: true },
          accessory: { type: 'string', nullable: true },
          styleVibe: { type: 'string' },
          stylistMessage: { type: 'string' },
          appliedRuleIds: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory', 'styleVibe', 'stylistMessage', 'appliedRuleIds']
      }
    };

    try {
      geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userContent,
        config: generateConfig,
      });
    } catch (apiError: any) {
      console.warn('Gemini API call failed, generating catalog-grounded fallback recommendation:', apiError?.message);
      const topCand = candidateItems.find((i) => i.category === 'top' && i.render.layer === 'top');
      const underlayerCand = candidateItems.find((i) => i.render.layer === 'underlayer');
      const bottomCand = candidateItems.find((i) => i.category === 'bottom');
      const shoesCand = candidateItems.find((i) => i.category === 'shoes');
      const bagCand = candidateItems.find((i) => i.category === 'bag');
      const accCand = candidateItems.find((i) => i.category === 'accessory');

      return res.json({
        success: true,
        data: {
          top: topCand?.id ?? null,
          underlayer: underlayerCand?.id ?? null,
          bottom: bottomCand?.id ?? null,
          shoes: shoesCand?.id ?? null,
          bag: bagCand?.id ?? null,
          accessory: accCand?.id ?? null,
          styleVibe: `${targetStyle.label} (${targetOccasion.label})`,
          stylistMessage: `Việt Phục Stylist đề xuất trang phục chuẩn mực cho bối cảnh ${targetOccasion.label} với phong cách ${targetStyle.label}.`,
          appliedRuleIds: hasLayeringRule && underlayerCand ? ['rule_layering_aotac'] : [],
        },
      });
    }

    const responseText = geminiResponse.text;
    if (!responseText || typeof responseText !== 'string' || !responseText.trim()) {
      return res.status(502).json({
        success: false,
        error: 'EMPTY_AI_RESPONSE',
        message: 'Gemini returned an empty response.',
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch {
      return res.status(502).json({
        success: false,
        error: 'INVALID_JSON_RESPONSE',
        message: 'Gemini response was not valid JSON.',
      });
    }

    // STRICT SERVER-SIDE POST-VALIDATION
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return res.status(502).json({
        success: false,
        error: 'SCHEMA_MISMATCH',
        message: 'Gemini response is not a valid JSON object.',
      });
    }

    if (
      typeof parsed.styleVibe !== 'string' ||
      typeof parsed.stylistMessage !== 'string' ||
      !Array.isArray(parsed.appliedRuleIds)
    ) {
      return res.status(502).json({
        success: false,
        error: 'SCHEMA_MISMATCH',
        message: 'Gemini response missing required styleVibe, stylistMessage, or appliedRuleIds array.',
      });
    }

    // Validate appliedRuleIds against authoritative cultural rules
    const validRuleIds = new Set(culturalRules.map((r) => r.ruleId));
    for (const ruleId of parsed.appliedRuleIds) {
      if (typeof ruleId !== 'string' || !validRuleIds.has(ruleId)) {
        return res.status(502).json({
          success: false,
          error: 'HALLUCINATED_RULE_ID',
          message: `Rule ID '${ruleId}' does not exist in authoritative cultural rules.`,
        });
      }
    }

    // Slot category & layer mapping
    const slotValidationRules: Record<OutfitSlot, { category: ItemCategory; allowedLayers: RenderLayer[] }> = {
      top: { category: 'top', allowedLayers: ['top'] },
      underlayer: { category: 'top', allowedLayers: ['underlayer'] },
      bottom: { category: 'bottom', allowedLayers: ['bottom'] },
      shoes: { category: 'shoes', allowedLayers: ['shoes'] },
      bag: { category: 'bag', allowedLayers: ['bag-front', 'bag-back'] },
      accessory: { category: 'accessory', allowedLayers: ['accessory', 'face-overlay'] },
    };

    const validatedResponse: RecommendationResponse = {
      top: null,
      underlayer: null,
      bottom: null,
      shoes: null,
      bag: null,
      accessory: null,
      styleVibe: parsed.styleVibe.trim(),
      stylistMessage: parsed.stylistMessage.trim(),
      appliedRuleIds: parsed.appliedRuleIds,
    };

    for (const slot of validSlots) {
      const val = parsed[slot];
      if (val === undefined || val === null || val === '') {
        validatedResponse[slot] = null;
        continue;
      }
      if (typeof val !== 'string') {
        return res.status(502).json({
          success: false,
          error: 'SCHEMA_MISMATCH',
          message: `Slot '${slot}' must be a string item ID or null.`,
        });
      }

      // Check item exists in catalog
      const item = knowledgeCatalog.getItemById(val);
      if (!item) {
        return res.status(502).json({
          success: false,
          error: 'HALLUCINATED_ITEM_ID',
          message: `Item '${val}' recommended for slot '${slot}' does not exist in the canonical catalog.`,
        });
      }

      // Check category and layer
      const rule = slotValidationRules[slot];
      if (item.category !== rule.category || !rule.allowedLayers.includes(item.render.layer)) {
        return res.status(502).json({
          success: false,
          error: 'SLOT_CATEGORY_MISMATCH',
          message: `Item '${val}' (category: '${item.category}', layer: '${item.render.layer}') is not permitted in slot '${slot}'.`,
        });
      }

      validatedResponse[slot] = item.id;
    }

    return res.json({
      success: true,
      data: validatedResponse,
    });
  } catch (error: any) {
    console.error('Unhandled error in /api/catalog/recommend:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred during recommendation.',
    });
  }
});

// Canonical Phase 5.2 Cultural Outfit Validation Endpoint
app.post('/api/catalog/validate', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Request body must be a JSON object.',
      });
    }

    const { context, outfit } = body;

    // 1. Validate Context existence & structure
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CONTEXT',
        message: 'Context object with occasionId, roleId, and styleId is required.',
      });
    }

    const { occasionId, roleId, styleId } = context;
    if (
      typeof occasionId !== 'string' || !occasionId.trim() ||
      typeof roleId !== 'string' || !roleId.trim() ||
      typeof styleId !== 'string' || !styleId.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CONTEXT',
        message: 'occasionId, roleId, and styleId must be non-empty strings.',
      });
    }

    const allOccasions = knowledgeCatalog.getAllOccasions();
    const allRoles = knowledgeCatalog.getAllRoles();
    const allStyles = knowledgeCatalog.getAllStyles();
    const targetOccasion = allOccasions.find((o) => o.id === occasionId);
    const targetRole = allRoles.find((r) => r.id === roleId);
    const targetStyle = allStyles.find((s) => s.id === styleId);

    if (!targetOccasion || !targetRole || !targetStyle) {
      return res.status(400).json({
        success: false,
        error: 'UNKNOWN_CONTEXT_OPTION',
        message: 'One or more context options (occasionId, roleId, styleId) do not exist in the knowledge catalog.',
      });
    }

    // 2. Validate Outfit existence & basic slot integrity
    if (!outfit || typeof outfit !== 'object' || Array.isArray(outfit)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'outfit object is required.',
      });
    }

    const integrity = validateOutfitSlotIntegrity(outfit, knowledgeCatalog);
    if (!integrity.valid) {
      return res.status(400).json({
        success: false,
        error: integrity.error,
        message: integrity.message,
      });
    }

    // 3. Run pure deterministic validation engine
    const deterministicResult = runDeterministicValidation(context, outfit, knowledgeCatalog);

    // If empty outfit, return immediately without calling Gemini
    const isEmptyOutfit = integrity.resolvedItems.size === 0;
    if (isEmptyOutfit) {
      console.log(
        `[Validation] Context: ${JSON.stringify(context)} | Outfit: empty | Deterministic status: ${deterministicResult.status} | Gemini called: false | Final status: ${deterministicResult.status}`
      );
      return res.json({
        success: true,
        data: deterministicResult,
      });
    }

    let geminiCalled = false;
    let finalResponse: ValidationResponse = { ...deterministicResult };

    // 4. Optionally enrich with Gemini if available
    if (apiKey && ai) {
      geminiCalled = true;
      try {
        const resolvedItemsArray = Array.from(integrity.resolvedItems.entries()).map(([slot, item]) => ({
          slot,
          id: item.id,
          name: item.name,
          category: item.category,
          renderLayer: item.render.layer,
          colors: item.metadata.colors,
          materials: item.metadata.materials,
          styleIds: item.metadata.styleIds,
          occasionIds: item.metadata.occasionIds,
          culture: item.culture,
        }));

        const availableCandidates = knowledgeCatalog.getAllItems().map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          renderLayer: item.render.layer,
          styleIds: item.metadata.styleIds,
          occasionIds: item.metadata.occasionIds,
        }));

        const culturalRules = knowledgeCatalog.getAllCulturalRules().map((r) => ({
          ruleId: r.ruleId,
          category: r.category,
          statement: r.statement,
        }));

        const systemInstruction = `You are the cultural outfit evaluator for "Việt Phục Remix" (Vietnamese traditional outfit and modern remix dress-up).
Your role is to explain and evaluate the user's current outfit against the supplied Context and authoritative cultural rules.

CRITICAL CONSTRAINTS:
1. Authoritative cultural rules supplied by the backend are the ONLY cultural rules you may reference:
   "Authoritative cultural rules supplied by the backend are the only cultural rules you may reference."
2. You MUST NOT invent cultural rules, item IDs, or rule IDs. Any suggestedItemId MUST be an item ID that actually exists in availableCandidates, or null.
3. You MUST NOT override or downgrade deterministic NEEDS_ADJUSTMENT findings. If deterministic validation found mandatory violations (such as missing underlayer for Áo Tấc/Áo Ngũ Thân per rule_layering_aotac, or prohibited modern accessories in Royal Court per rule_remix_boundary), the status must remain NEEDS_ADJUSTMENT.
4. You MUST NOT return numeric scores or percentages.
5. Provide a warm, respectful, culturally grounded Vietnamese summary, explain findings clearly, and suggest valid catalog items when adjustments are needed.
6. Return ONLY pure JSON matching the response schema.`;

        const userContent = JSON.stringify({
          context: {
            occasion: { id: targetOccasion.id, name: targetOccasion.label, description: targetOccasion.description },
            role: { id: targetRole.id, name: targetRole.label, description: targetRole.description },
            style: { id: targetStyle.id, name: targetStyle.label, description: targetStyle.description },
          },
          wornOutfit: resolvedItemsArray,
          availableCandidates,
          culturalRules,
          deterministicFindings: deterministicResult.findings,
          deterministicStatus: deterministicResult.status,
        }, null, 2);

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: userContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['PASS', 'WARN', 'NEEDS_ADJUSTMENT'] },
                summary: { type: 'string' },
                findings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slot: { type: 'string', nullable: true },
                      severity: { type: 'string', enum: ['ERROR', 'WARNING', 'INFO'] },
                      ruleId: { type: 'string', nullable: true },
                      message: { type: 'string' },
                      detail: { type: 'string' },
                      suggestion: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          slot: { type: 'string' },
                          suggestedItemId: { type: 'string', nullable: true },
                          reason: { type: 'string' }
                        },
                        required: ['slot', 'suggestedItemId', 'reason']
                      }
                    },
                    required: ['severity', 'message']
                  }
                },
                appliedRuleIds: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['status', 'summary', 'findings', 'appliedRuleIds']
            }
          }
        });

        const responseText = geminiResponse.text;
        if (responseText && responseText.trim()) {
          const parsed = JSON.parse(responseText.trim());

          // Post-validate and sanitize Gemini output
          const validRuleIds = new Set(culturalRules.map((r) => r.ruleId));
          const validSlots: OutfitSlot[] = ['top', 'underlayer', 'bottom', 'shoes', 'bag', 'accessory'];

          const sanitizedFindings: ValidationFinding[] = [];

          // First, preserve all deterministic mandatory ERROR findings
          for (const detFinding of deterministicResult.findings) {
            sanitizedFindings.push(detFinding);
          }

          if (Array.isArray(parsed.findings)) {
            for (const gf of parsed.findings) {
              if (!gf || typeof gf !== 'object') continue;
              // Check ruleId validity
              let validRuleId: string | null = null;
              if (typeof gf.ruleId === 'string' && validRuleIds.has(gf.ruleId)) {
                validRuleId = gf.ruleId;
              }

              // Check suggestion validity
              let validSuggestion: ValidationSuggestion | null = null;
              if (gf.suggestion && typeof gf.suggestion === 'object') {
                const sSlot = gf.suggestion.slot;
                const sItem = gf.suggestion.suggestedItemId;
                if (validSlots.includes(sSlot as OutfitSlot)) {
                  let verifiedItemId: string | null = null;
                  if (typeof sItem === 'string') {
                    const catalogItem = knowledgeCatalog.getItemById(sItem);
                    const slotRule = SLOT_VALIDATION_RULES[sSlot as OutfitSlot];
                    if (
                      catalogItem &&
                      catalogItem.category === slotRule.category &&
                      slotRule.allowedLayers.includes(catalogItem.render.layer)
                    ) {
                      verifiedItemId = catalogItem.id;
                    }
                  }
                  validSuggestion = {
                    slot: sSlot as OutfitSlot,
                    suggestedItemId: verifiedItemId,
                    reason: typeof gf.suggestion.reason === 'string' ? gf.suggestion.reason : '',
                  };
                }
              }

              const severity: FindingSeverity =
                gf.severity === 'ERROR' || gf.severity === 'WARNING' || gf.severity === 'INFO'
                  ? gf.severity
                  : 'INFO';

              // Avoid exact duplicate messages with deterministic findings
              const alreadyExists = sanitizedFindings.some(
                (sf) => sf.ruleId === validRuleId && sf.message === gf.message
              );
              if (!alreadyExists && typeof gf.message === 'string') {
                sanitizedFindings.push({
                  slot: validSlots.includes(gf.slot as OutfitSlot) ? (gf.slot as OutfitSlot) : null,
                  severity,
                  ruleId: validRuleId,
                  message: gf.message,
                  detail: typeof gf.detail === 'string' ? gf.detail : undefined,
                  suggestion: validSuggestion,
                });
              }
            }
          }

          // Strict status precedence: NEEDS_ADJUSTMENT > WARN > PASS
          let mergedStatus: ValidationStatus = deterministicResult.status;
          if (mergedStatus !== 'NEEDS_ADJUSTMENT') {
            if (sanitizedFindings.some((f) => f.severity === 'ERROR')) {
              mergedStatus = 'NEEDS_ADJUSTMENT';
            } else if (parsed.status === 'NEEDS_ADJUSTMENT' || parsed.status === 'WARN') {
              mergedStatus = parsed.status;
            } else if (sanitizedFindings.some((f) => f.severity === 'WARNING')) {
              mergedStatus = 'WARN';
            }
          }

          // Whitelist appliedRuleIds: Only report rules that actually apply to this outfit/context
          const mergedRuleIds = new Set<string>();
          for (const detRuleId of deterministicResult.appliedRuleIds) {
            mergedRuleIds.add(detRuleId);
          }
          if (Array.isArray(parsed.appliedRuleIds)) {
            for (const rId of parsed.appliedRuleIds) {
              if (
                typeof rId === 'string' &&
                validRuleIds.has(rId) &&
                sanitizedFindings.some((f) => f.ruleId === rId)
              ) {
                mergedRuleIds.add(rId);
              }
            }
          }

          finalResponse = {
            status: mergedStatus,
            summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : deterministicResult.summary,
            findings: sanitizedFindings,
            appliedRuleIds: Array.from(mergedRuleIds),
          };
        }
      } catch (geminiError: any) {
        console.warn('Gemini validation call failed, using deterministic result fallback:', geminiError?.message);
        finalResponse = deterministicResult;
      }
    }

    console.log(
      `[Validation] Context: ${JSON.stringify(context)} | Outfit: ${JSON.stringify(outfit)} | Deterministic status: ${deterministicResult.status} | Gemini called: ${geminiCalled} | Final status: ${finalResponse.status}`
    );

    return res.json({
      success: true,
      data: finalResponse,
    });
  } catch (error: any) {
    console.error('Unhandled error in /api/catalog/validate:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred during validation.',
    });
  }
});

// 3. API: Gemini AI Stylist Recommendation
app.post('/api/gemini/recommend-outfit', async (req, res) => {
  try {
    const { prompt, eventId } = req.body;
    const currentEvent = EVENTS_DATA.find((e) => e.id === eventId) || EVENTS_DATA[0];

    // Prepare catalog summary for Gemini
    const itemCatalog = INITIAL_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      style: item.style,
      color: item.color,
      tags: item.tags
    }));

    if (!apiKey || !ai) {
      // Graceful fallback if API key is not yet set in environment
      return res.json({
        success: true,
        data: {
          stylistMessage: `Chào bạn! Snoopy Stylist đã lắng nghe mong muốn: "${prompt || 'Phong cách tinh tế'}". Cho bối cảnh ${currentEvent.sceneName}, Snoopy đề xuất bạn phối chiếc Áo Len Dệt Sọc Vintage với Quần Suông Xếp Ly Beige Classic và đôi Oxford Da Bò nâu ấm áp, điểm xuyết chiếc Mũ Nồi Beret Đỏ!`,
          recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
          matchedCategories: {
            aoId: 'ao_001',
            quanId: 'quan_001',
            giayId: 'giay_001',
            phukienId: 'phukien_001'
          },
          styleVibe: 'French Chic & Warm Autumn',
          tips: [
            'Sơ vin nhẹ vạt trước áo len để lộ cạp quần thắt lưng da sang trọng.',
            'Đội mũ beret hơi chếch về bên trái để tạo thần thái nghệ sĩ.',
            'Tông màu kem be và đỏ ruby tạo sự tương phản đầy ấm áp.'
          ]
        }
      });
    }

    const systemInstruction = `Bạn là Snoopy Stylist - chuyên gia thời trang cá nhân của chú cún Snoopy và người dùng. Giọng điệu của bạn vui tươi, hài hước, sành điệu, đậm chất thời trang cao cấp kiểu Pháp nhưng rất gần gũi và nhiệt thành.
Nhiệm vụ của bạn là nhận yêu cầu của người dùng cùng sự kiện hiện tại, sau đó chọn ra 1 chiếc Áo (ao), 1 chiếc Quần (quan), 1 đôi Giày (giay), và 1 Phụ kiện (phukien) từ danh sách sau:
${JSON.stringify(itemCatalog, null, 2)}

Hãy trả về định dạng JSON thuần túy (không bọc markdown \`\`\`json) với cấu trúc:
{
  "stylistMessage": "Lời nhắn vui vẻ, khen ngợi và phân tích gu của người dùng bằng tiếng Việt (khoảng 3-4 câu)",
  "recommendedItemIds": ["ao_id", "quan_id", "giay_id", "phukien_id"],
  "matchedCategories": {
    "aoId": "id áo tốt nhất",
    "quanId": "id quần tốt nhất",
    "giayId": "id giày tốt nhất",
    "phukienId": "id phụ kiện tốt nhất"
  },
  "styleVibe": "Tên phong cách (ví dụ: Parisian Artist, Vintage Cafe, Red Carpet Diva...)",
  "tips": [
    "Lời khuyên phối đồ 1",
    "Lời khuyên phối đồ 2",
    "Lời khuyên phối đồ 3"
  ]
}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Bối cảnh sự kiện: ${currentEvent.title} (${currentEvent.sceneName}).
Yêu cầu & phong cách mong muốn từ người dùng: "${prompt || 'Hãy gợi ý cho tôi một bộ đồ thật đẹp, thanh lịch và ấn tượng'}"
Hãy chọn ra những món trang phục phù hợp nhất từ catalog và đưa ra tư vấn.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const responseText = geminiResponse.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      parsedData = {
        stylistMessage: `Snoopy đã chọn cho bạn một outfit tuyệt đẹp cho sự kiện ${currentEvent.title}!`,
        recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
        matchedCategories: {
          aoId: 'ao_001',
          quanId: 'quan_001',
          giayId: 'giay_001',
          phukienId: 'phukien_001'
        },
        styleVibe: 'Classic Snoopy Aesthetic',
        tips: ['Tự tin là phụ kiện đẹp nhất của bạn!']
      };
    }

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Gemini recommendation error:', error);
    // Fallback gracefully on error so user experience is not broken
    res.json({
      success: true,
      data: {
        stylistMessage: 'Snoopy Stylist vừa nảy ra một ý tưởng phối đồ cực kỳ xuất sắc theo phong cách cổ điển thanh lịch, tôn trọn vẻ đẹp tự nhiên của bạn!',
        recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
        matchedCategories: {
          aoId: 'ao_001',
          quanId: 'quan_001',
          giayId: 'giay_001',
          phukienId: 'phukien_001'
        },
        styleVibe: 'Timeless Vintage Chic',
        tips: [
          'Phối các tông màu be và kem để tạo cảm giác dịu mắt, ấm cúng.',
          'Điểm xuyết phụ kiện đỏ để tạo điểm nhấn thị giác cuốn hút.'
        ]
      }
    });
  }
});

// Serve static assets directory
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));
app.use('/assets', (_req, res) => {
  res.status(404).json({ error: 'Asset not found' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Snoopy Stylist Server is running on port ${port} (0.0.0.0)`);
  });
}

startServer();
