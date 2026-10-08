# MVP Avatar Renderer Contract

Contract status: **READY** as a technical target for Phase 3, subject to the human decisions in section 17. This document does not change the runtime types or resolve the current knowledge catalog's missing assets/render metadata.

## 1. Mục tiêu

Specify a deterministic, ID-agnostic renderer for the Việt Phục Remix MVP. The renderer composites an approved Avatar Preset, an independent scene background and resolved outfit items. It does not own outfit policy, catalog lookup, cultural validation or recommendations.

Repository facts this contract builds on:

- Canonical category values are `top`, `bottom`, `shoes`, `bag`, `accessory`.
- Current canonical `Item.render` has `layer`, normalized `position: {x,y,width,height}`, `zIndex`, and optional `compatibleAvatarIds`.
- Current `RenderLayer` only has `back | underlayer | bottom | top | front | overlay`.
- There is currently no canonical `AvatarPreset`, canonical `Outfit`, or `Scene` type.
- `SnoopyOutfit` stores legacy FashionItem objects and uses legacy categories.
- `HumanModel2D` is a temporary SVG mannequin. It has item-ID branches, item-specific SVG shapes/colors, gender branches, and event-specific CSS backgrounds.
- Knowledge catalog currently has two incomplete test item records and no avatar/background records; this contract does not make that catalog READY.

## 2. Render Space

- Logical output canvas: **1000 × 1400**, portrait, front-facing.
- The background is rendered to the same logical canvas and cropped/scaled by the scene/background policy, not by Outfit slots.
- Avatar base and every render-layer asset use the exact same 1000 × 1400 canvas and rig registration. Item-specific art is aligned inside a transparent full-canvas layer.
- Output must preserve aspect ratio when displayed. Fit the canvas into the available viewport; do not independently stretch x and y.
- Coordinates and layer order are independent of device pixels. The renderer may scale the completed logical canvas uniformly for display/export.

## 3. Coordinate System

- Origin: top-left.
- Normalized x and y range from 0 through 1; x increases rightward, y downward.
- For any normalized point or extent:

```text
pixelX = x * canvasWidth
pixelY = y * canvasHeight
pixelWidth = width * canvasWidth
pixelHeight = height * canvasHeight
```

### Item `render.position` semantics

The existing canonical type has `{x, y, width, height}` but no anchor field. For this contract, define it as the **normalized visible-art bounding rectangle** on the 1000×1400 layer canvas:

- `x`,`y`: top-left of the expected non-transparent visible-art bounds.
- `width`,`height`: expected visible-art bounds as a fraction of canvas size.
- `anchor`: implicitly `top-left` for this rectangle; no center/anchor transform is performed.
- Renderer draws a full-canvas `renderLayer` asset at pixel `(0,0)` and does not translate/scale it by this rectangle. The rectangle supports validation, diagnostics and asset-fit tooling only.

A center anchor is not selected because Phase 2.6 specifies full-avatar-canvas, rig-aligned render layers. Re-centering each layer would destroy shared registration. If a later asset pipeline switches to item-local cropped assets, add an explicit anchor/pivot and transform contract then; do not infer one from current `{x,y,width,height}`.

All rectangles must be finite, positive-sized and remain inside `[0,1]`. Their values must be measured/approved against the rig and alpha bounds, not guessed to pass validation.

## 4. Layer System

### Canonical render-layer enum proposal

```text
shoes
bottom
underlayer
top
bag-back
accessory
bag-front
hair-back
hair-front
face-overlay
```

Background and avatar body are scene/avatar assets, not Item layers. `bag` remains the canonical item category; `bag-back` and `bag-front` are placement layers only. No category-specific item IDs are used to determine placement.

### Deterministic order

| Order / zIndex band | Layer | Contents |
|---:|---|---|
| Scene only | background | Selected background preset; outside item sorting |
| Avatar base | avatar/body | Base body and base facial features from Avatar Preset |
| 100–199 | hair-back | Optional rear hair asset, behind body/garments where required |
| 200–299 | shoes | Shoes over foot landmarks |
| 300–399 | bottom | Bottom garment |
| 400–449 | underlayer | Required inner layer, behind outer top |
| 450–499 | top | Outer top garment |
| 500–549 | bag-back | Bag strap/body elements explicitly authored behind torso/top |
| 550–599 | accessory | Non-face accessories with item-authored placement |
| 600–649 | bag-front | Bag elements authored in front of torso/top |
| 650–699 | hair-front | Front hair pieces that overlap garments or accessories |
| 700–799 | face-overlay | Face-aligned items such as glasses |

Items sort by layer rank, then ascending `zIndex`, then stable `itemId` lexical order as a tie-break. The primary order comes from the enum/rank table, not UI selection order. `zIndex` is only an ordering value within an approved range; an item cannot jump across semantic layers by supplying an arbitrary large value. Duplicate zIndex values are allowed and use the stable ID tie-break.

MVP limit: one Item has one `render.layer` and one `assets.renderLayer`, so one bag item renders in exactly one bag layer (`bag-back` or `bag-front`). Do not create two Outfit bag slots. If the chosen bag design genuinely requires a strap behind and body in front, simplify the asset so it can render in one layer or defer that design; multi-part item assets require a later explicit schema extension and are not part of this contract.

The current `RenderLayer` enum is insufficient for this order. Phase 3 must extend it to the proposed values; this document does not edit TypeScript.

## 5. Outfit Slot Contract

Canonical slots hold item IDs, never full Item objects or image data:

```ts
type ItemId = string;
type OutfitSlot = 'top' | 'underlayer' | 'bottom' | 'shoes' | 'bag' | 'accessory';

interface Outfit {
  top: ItemId | null;
  underlayer: ItemId | null;
  bottom: ItemId | null;
  shoes: ItemId | null;
  bag: ItemId | null;
  accessory: ItemId | null;
}
```

Rules:

- `top`, `bottom`, `shoes`, `bag`, `accessory` preserve canonical categories.
- **Add `underlayer` as a separate nullable slot.** Existing `rule_layering_aotac` explicitly requires an inner white shirt with visible collar for Áo Tấc/Áo Ngũ Thân. The existing Outfit cannot represent two top garments otherwise.
- `underlayer` accepts an Item ID whose canonical category remains `top`; its Item render layer must be `underlayer`. It is not a sixth item category and must not be encoded as category `underlayer`.
- Underlayer stays `null` unless selected/required by a verified catalog rule. The renderer does not infer necessity from names or cultural knowledge.
- Each slot can be set, replaced or cleared independently. Renderer input is read-only; rendering never edits Outfit.
- Before resolution, the outfit resolver checks that every referenced item exists and category matches its slot. The `underlayer` slot permits category `top` only.
- No `suitabilityScore` is part of Outfit or rendering.

This is a proposed extension to the Phase 1 five-slot Outfit, justified by an existing knowledge rule. Human approval is still recorded in section 17.

## 6. Bag Rendering

Outfit contains exactly one `bag: ItemId | null` slot. It represents the worn bag, not its visual fragments.

The bag Item's render metadata selects exactly one `bag-back` or `bag-front` layer in MVP. Renderer must not decide bag side from item ID or selection order.

Default proposal: a shoulder bag is assigned wholly to `bag-front` or wholly to `bag-back` based on the approved artwork; a hand-held bag is normally `bag-front`. This is visual authoring guidance, not cultural or garment truth. The asset author and rig reviewer must confirm each item. MVP does not split a single bag across layers.

## 7. Background / Scene Contract

Background is independent of Outfit. Changing `backgroundPresetId` must leave every Outfit slot unchanged.

```ts
interface AvatarScene {
  avatarPresetId: string;
  backgroundPresetId: string;
  outfit: Outfit;
}
```

Background presets have their own records (suggested fields: `id`, `name`, `description`, `asset`, `recommendedOccasionIds`). They are not Item records, do not use ItemCategory, and are not returned as clothing candidates. `backgroundPresetId` resolves separately from item IDs.

The scene supplies the selected background asset reference. Renderer paints background first, then avatar base, then ordered layers. Background must not contain a baked-in avatar or clothing.

The resolver must ensure `scene.avatarPresetId === avatarPreset.avatarPresetId` and `scene.backgroundPresetId === background.backgroundPresetId`; a mismatch is invalid renderer input, not an instruction to silently substitute a preset.

## 8. Avatar Preset Contract

```ts
interface NormalizedPoint {
  x: number;
  y: number;
}

interface AvatarLandmarks {
  headCenter: NormalizedPoint;
  neckCenter: NormalizedPoint;
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
  chestCenter: NormalizedPoint;
  waistCenter: NormalizedPoint;
  hipCenter: NormalizedPoint;
  leftFoot: NormalizedPoint;
  rightFoot: NormalizedPoint;
  leftHand: NormalizedPoint;
  rightHand: NormalizedPoint;
  leftEye: NormalizedPoint;
  rightEye: NormalizedPoint;
}

interface BackgroundPreset {
  backgroundPresetId: string;
  name: string;
  description: string;
  asset: AssetReference;
  recommendedOccasionIds: string[];
}

interface AvatarPreset {
  avatarPresetId: string;
  name: string;
  description: string;
  assets: {
    base: AssetReference;
    hairBack?: AssetReference;
    hairFront?: AssetReference;
  };
  canvas: { width: 1000; height: 1400 };
  rendererProfileId: string;
  landmarks: AvatarLandmarks;
}
```

Avatar Preset owns identity, base/body, rig profile and landmarks only. It must not contain top, underlayer, bottom, shoes, bag or accessory. Changing `avatarPresetId` changes the body/rig while Outfit retains its item IDs. Compatibility can be checked using `Item.render.compatibleAvatarIds`; absent that optional restriction, use shared rig profile compatibility, not item-ID rules.

`base` includes body and base facial features, excludes clothing, bag, glasses and background. Hair can be separate back/front assets where overlap requires it. For an MVP avatar whose hair is baked into the base, declare that profile and accept its fixed occlusion; do not silently paint clothing over a base-baked hairstyle.

## 9. Shared Landmarks

Landmarks are normalized points on the avatar canvas and named by semantic role. Initial required set:

```text
headCenter, neckCenter,
leftShoulder, rightShoulder,
chestCenter, waistCenter, hipCenter,
leftFoot, rightFoot,
leftHand, rightHand,
leftEye, rightEye
```

They support rig authoring, fit review, face/shoe/bag alignment and QA; they do not automatically move an item unless an item's approved position explicitly references a landmark in a future contract revision. Under this contract, `Item.render.position` remains the authoritative full-canvas visible-art bounds, and layer pixels are already registered to the rig.

Every preset sharing a `rendererProfileId` must use the same canvas, front view, scale, pose, landmark names and comparable landmark coordinates within an approved tolerance. If a new avatar has a different pose/proportion, give it a new renderer profile and fit-specific layer assets/positions. Renderer core should remain data-driven; supporting a new profile must not require adding item-ID branches.

## 10. Item Render Contract

Target shape, extending the current Item contract:

```ts
interface ItemRender {
  layer: RenderLayer;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zIndex: number;
  compatibleAvatarIds?: string[];
}
```

Semantics:

- `layer`: required enum value from section 4; category does not determine layer by itself.
- `position`: expected visible-art bounding rectangle on the full-size registered layer canvas, top-left origin, normalized; used for fit/alpha diagnostics, not transform.
- `zIndex`: required finite integer within the assigned layer's band; only orders items inside that layer.
- `compatibleAvatarIds`: optional allow-list when fit has been verified for only some presets. Omission means compatible with the declared renderer profile, not universally compatible with every future rig.

Do not add `scale`, `rotation`, `opacity` or arbitrary per-item transforms for MVP. Full-canvas registered layer assets make those fields unnecessary and arbitrary transforms risk misalignment. If art must be repositioned, fix/export it against the rig and update reviewed bounds.

## 11. Asset Reference Contract

The current Item type requires asset strings that exist on disk; current repository validation treats missing refs as blocking. It cannot yet represent pending assets. Proposed target contract:

```ts
type AssetReference =
  | { status: 'PENDING_ASSET'; assetId: string }
  | { status: 'READY'; assetId: string; path: string; mimeType: string };

interface ItemAssets {
  thumbnail: AssetReference;
  renderLayer: AssetReference;
}
```

- `thumbnail` and `renderLayer` are distinct references; they may point to the same delivered file only after each use is checked.
- `PENDING_ASSET` is valid planning/catalog metadata, not a filesystem path. It is not sent to `<img>` and is not fetched.
- Renderer sees the resolved reference status and emits a diagnostic for pending assets.
- Catalog design may be READY for planning while runtime rendering has pending-asset diagnostics. Do not conflate spec readiness with file-backed runtime catalog readiness.
- No fake paths, placeholder files or guessed extensions.

This is a proposed extension because the current `assets.thumbnail: string` and `assets.renderLayer: string` fields cannot express pending status. Keep this migration explicit in Phase 3.

## 12. Renderer Input Contract

```ts
interface RenderDiagnostic {
  code:
    | 'ITEM_NOT_FOUND'
    | 'SLOT_CATEGORY_MISMATCH'
    | 'ASSET_PENDING'
    | 'ASSET_LOAD_FAILED'
    | 'RENDER_METADATA_INVALID'
    | 'AVATAR_ASSET_PENDING'
    | 'BACKGROUND_ASSET_PENDING'
    | 'AVATAR_INCOMPATIBLE'
    | 'SCENE_REFERENCE_MISMATCH';
  itemId?: ItemId;
  slot?: OutfitSlot;
  assetId?: string;
  message: string;
}

interface AvatarRendererInput {
  scene: AvatarScene;
  avatarPreset: AvatarPreset;
  background: BackgroundPreset;
  resolvedItems: Partial<Record<OutfitSlot, Item>>;
}

interface AvatarRendererOutput {
  canvas: HTMLCanvasElement;
  renderedItemIds: string[];
  diagnostics: RenderDiagnostic[];
}
```

Resolution flow:

```text
scene.outfit Item IDs
  → catalog resolver validates existence/category/slot compatibility
  → resolved Item objects + AvatarPreset + BackgroundPreset
  → renderer
```

- Renderer does not fetch catalog/API or load knowledge JSON itself.
- Resolver performs ID lookup, category-slot checks and pending-asset state resolution.
- Renderer receives resolved records and asset availability status; it may use an injected asset loader/render target, but does not own network/catalog policy.
- Renderer does not receive or call Gemini.
- `scene.outfit` is the immutable requested snapshot; `resolvedItems` is only a view of valid references, not replacement state.

## 13. Renderer Responsibilities

Renderer MAY:

- Receive the selected Avatar Preset, scene background and resolved item records.
- Paint background, avatar base and layer assets in deterministic order.
- Sort using layer rank and zIndex, with a stable tie-break independent of UI order.
- Convert normalized bounds/landmarks to canvas pixels for fit checks/diagnostics.
- Draw available assets and omit only the unavailable layer when asset is pending/failed.
- Return rendered IDs and diagnostics without mutating input.

Renderer MUST NOT:

- Call Gemini, recommendation, validation or Catalog API.
- Decide cultural/occasion/role suitability.
- Modify Outfit, select/remove/replace items or add companion items automatically.
- Hardcode any item ID, item path or item-specific position in conditional branches.
- Infer render layer from item name, category label or selection order.
- Map a legacy ID to a canonical ID.

## 14. Error / Diagnostic Policy

Rendering is best-effort per layer; a bad item must not blank the full avatar.

| Condition | Resolver/renderer behavior | Diagnostic |
|---|---|---|
| Outfit item ID not found | Preserve Outfit ID; omit that layer; continue other layers | `ITEM_NOT_FOUND` with slot and itemId |
| Item category incompatible with slot | Omit layer; do not auto-correct slot | `SLOT_CATEGORY_MISMATCH` |
| Asset `PENDING_ASSET` | Preserve item in Outfit; omit its pixels; continue body/background/other layers | `ASSET_PENDING` with assetId/itemId |
| Asset READY reference cannot load/decode | Omit only that layer; continue rendering | `ASSET_LOAD_FAILED` |
| Render metadata absent/invalid | Omit item layer; do not guess position/layer/zIndex | `RENDER_METADATA_INVALID` |
| Avatar/background asset pending or failed | Render remaining scene layers where possible; if avatar base is unavailable, return empty base canvas plus diagnostic | `AVATAR_ASSET_PENDING` / `BACKGROUND_ASSET_PENDING` |
| Incompatible avatar preset | Omit only incompatible item; retain Outfit selection | `AVATAR_INCOMPATIBLE` |

Diagnostics are technical only; they do not imply PASS/WARN/NEEDS_ADJUSTMENT and do not alter user choice.

## 15. Legacy Renderer Migration Notes

**Legacy renderer: TEMPORARY / TO BE REPLACED.** Do not migrate it in this contract phase.

Verified legacy behavior in `HumanModel2D.tsx`:

- Inline SVG uses a 240×440 viewBox, not the MVP 1000×1400 canvas.
- `SnoopyOutfit` holds whole `FashionItem` objects with `ao`, `quan`, `giay`, `phukien` slots.
- It branches on IDs such as `quan_001`, `quan_004`, `quan_005`, `ao_001`, `ao_004`, `ao_002`, `giay_001`, `giay_003`, `phukien_001`, `phukien_002`, `phukien_004`.
- Garment shapes/colors are drawn in component code; the item `image` is not the renderer layer.
- Gender changes body SVG geometry; event background is hard-coded in the same component.

Phase 3 must replace those ID branches with Item render metadata/assets and Avatar Preset assets; separate scene background; resolve ID-only Outfit slots before rendering; add deterministic layer sorting and per-layer diagnostics. Leave `mockItems.ts`, old routes, recommendation and current UI behavior untouched until their own migration scope is approved.

## 16. Phase 3 Implementation Checklist

- [ ] Avatar preset loader
- [ ] Background preset loader/renderer
- [ ] Canonical layer enum/rank table
- [ ] Layer renderer for registered full-canvas assets
- [ ] Outfit ID → resolved item objects
- [ ] Slot/category validation before render
- [ ] Normalized bounds/landmark pixel conversion
- [ ] zIndex sorting and stable tie-break
- [ ] PENDING_ASSET handling with diagnostics
- [ ] Missing item handling with diagnostics
- [ ] Avatar/profile compatibility check
- [ ] Remove hardcoded item IDs from new renderer
- [ ] Replace legacy mannequin renderer in an explicitly approved migration phase
- [ ] Connect dress-up UI without coupling background to Outfit
- [ ] Verify unchanged Outfit when avatar/background is changed

## 17. Human Decisions Still Required

| Decision | Current proposal | Needs human approval |
|---|---|---|
| Underlayer slot | Add nullable `underlayer: ItemId`; only category `top` accepted, item uses `render.layer: underlayer`; justified by existing `rule_layering_aotac` | YES |
| Bag front/back | One Outfit bag ID; item render metadata may specify `bag-back` or `bag-front`; split strap/body assets under one item if needed | YES |
| Layer order | Order/ranges in section 4, with semantic rank then zIndex then stable ID | YES |
| Avatar presets | Two front-facing presets sharing 1000×1400 canvas and rig landmarks | YES |
| Landmark policy | Shared normalized semantic landmarks per renderer profile; new incompatible pose gets a new profile | YES |
| Asset pending policy | Preserve Outfit; omit only unavailable layer; return diagnostic | YES |
| Position semantics | Full-canvas registered artwork; `position` is normalized visible-art bounds, top-left rectangle; no runtime transform | YES |
| AssetReference migration | Discriminated `PENDING_ASSET` / `READY` union; current string-only Item fields remain unchanged until implementation approval | YES |
| Base hair/face composition | Base contains body and base facial features; hair split into back/front only when supplied/needed; no face accessory baked in | YES |

There is no runtime Avatar or Outfit type today. The proposed Outfit extends the Phase 1 five canonical item slots with `underlayer`; the proposal does not change current source types. AssetReference proposal is also an explicit extension to current string-only asset fields.

AVATAR RENDERER CONTRACT STATUS:
READY
