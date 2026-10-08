# Việt Phục Remix — MVP Catalog & Asset Specification

Status: **Specification READY for asset search**  
Runtime catalog status: **not changed by this document**. This is a planning artifact; `PENDING_ASSET` is not currently accepted as a real file by the runtime repository.

## 1. Scope and data rules

This spec proposes 7 clothing/accessory items, 2 avatar presets and 3 backgrounds. It does not add runtime knowledge records or claim historical facts. New IDs are reserved proposal IDs and do not alias `ao_001`, `quan_001`, `ao_mock_001` or `quan_mock_001`.

Use these data states in any later implementation:

- `PROPOSED`: catalog choice for demo, awaiting content approval.
- `HUMAN_REVIEW_REQUIRED`: cultural, material, color or context claim must not be shown as verified until approved.
- `PENDING_ASSET`: asset brief is ready; no image file is required yet.
- `VERIFIED`: a human-approved fact or asset has a recorded source/review.

Do not encode `PENDING_ASSET` as a fabricated path. Keep the specification/asset manifest separate from runtime `Item.assets` paths until files exist. The current repository requires existing local files and will report the catalog BLOCKED for pending asset values.

## 2. MVP catalog

IDs follow `<category>_<three-digit-sequence>`. Categories are canonical and singular: `top`, `bottom`, `shoes`, `bag`, `accessory`.

| ID | Category | Proposed name | Purpose in demo | Style / occasion proposal | Asset status |
|---|---|---|---|---|---|
| `top_001` | top | Áo Tấc (candidate) | Main Việt Phục garment; show item detail and required inner-layer relationship | `style_elegant`; `occ_graduation` (both copied from the test record as proposals, not verified applicability) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `top_002` | top | Áo Ngũ Thân (candidate) | Alternative top for the spring-walk modern-remix recommendation story | `style_modern_remix`; `occ_spring_walk` (proposed; human review) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `bottom_001` | bottom | Quần Lụa Trắng (candidate) | Pair with a top and provide the core bottom slot | `style_elegant`, `style_modern_remix`; `occ_graduation`, `occ_spring_walk` (IDs appear in the test record; modern-remix applicability still needs approval) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `shoes_001` | shoes | Giày bệt trơn, tông trung tính (visual brief) | Demonstrate shoes slot; avoid claiming a historic shoe type | `style_modern_remix`; `occ_spring_walk` (proposed; human review) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `bag_001` | bag | Túi đeo vai nhỏ, ít chi tiết (visual brief) | Primary recommendation for “cần một chiếc túi nhỏ, thanh lịch, không quá nổi bật” | `style_modern_remix`; `occ_spring_walk` (modern accessory allowance exists in `rule_remix_boundary`; item applicability still needs review) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `bag_002` | bag | Túi cầm tay nhỏ, phom gọn (visual brief) | Alternative item for the same request; enables catalog-grounded choice | `style_modern_remix`; `occ_spring_walk` (proposed; human review) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |
| `accessory_001` | accessory | Kính gọng mảnh, kiểu dáng trung tính (visual brief) | Demonstrate accessory slot and modern-remix boundary; no historical claim | `style_modern_remix`; `occ_spring_walk` (the rule permits modern accessories in this occasion; exact item suitability needs review) | `PENDING_ASSET`; content `HUMAN_REVIEW_REQUIRED` |

Colors/materials for proposed items must remain unset or marked for review until a human approves them. Do not infer silk, leather, historical period, traditional meaning, wearer role or suitability from a visual brief. Existing test-record text is evidence of what the test record says, not independent verification.

### Proposed catalog record shape

This is a data specification, not a runtime JSON example. Replace every `PENDING_ASSET` with an approved file reference only after asset delivery. Required item fields remain those in the canonical `Item` contract: `id`, `category`, `name`, `description`, `assets`, `metadata`, `culture`, `render`.

```text
assets.thumbnail: PENDING_ASSET
assets.renderLayer: PENDING_ASSET
metadata.colors: HUMAN_REVIEW_REQUIRED until approved
metadata.materials: HUMAN_REVIEW_REQUIRED until approved
metadata.styleIds: proposed knowledge IDs, human-approved before production
metadata.occasionIds: proposed knowledge IDs, human-approved before production
culture: source-backed fields only; otherwise HUMAN_REVIEW_REQUIRED
render: layer + normalized position + zIndex from the approved avatar rig
```

Catalog record content and asset acquisition are separate. A missing image does not invalidate this specification, but it does prevent the current runtime repository from declaring its file-backed catalog READY.

## 3. Asset specification per item

Every item requires a thumbnail brief and a separate renderer-layer brief. Team may deliver the same source artwork in two exports only if it satisfies both specifications; do not assume one image is automatically fit for both. Render subject positions below are approximate normalized target regions on the 1000×1400 canvas, not final renderer coordinates; confirm them against the approved avatar rig.

| Item ID / category | Asset | Visual description and required view | Background / transparent | Approximate canvas | Subject position | Layer / notes |
|---|---|---|---|---|---|---|
| `top_001` / top | `top_001_thumb` | Approved Áo Tấc candidate, isolated front view; full item visible | Neutral light or transparent; no mannequin/text/watermark | 1024×1024 thumbnail | Centered, garment fills about 80% of height | Catalog/detail only; construction details need human approval |
| `top_001` / top | `top_001_layer` | Same approved item aligned to avatar torso/arms | Transparent alpha | 1000×1400 | Torso target x .18-.82, y .18-.54 | `top`, provisional z=500; inner collar only if verified |
| `top_002` / top | `top_002_thumb` | Approved Áo Ngũ Thân candidate, isolated front view | Neutral light or transparent; no mannequin/text/watermark | 1024×1024 thumbnail | Centered, garment fills about 80% of height | Catalog/detail only; no unapproved ornament |
| `top_002` / top | `top_002_layer` | Same approved item aligned to avatar torso/arms | Transparent alpha | 1000×1400 | Torso target x .18-.82, y .18-.54 | `top`, provisional z=500; final alignment from rig |
| `bottom_001` / bottom | `bottom_001_thumb` | Approved white-trouser candidate, isolated full front view | Neutral light or transparent; no wearer | 1024×1024 | Centered; waist and hems fully visible | Color/design approval required |
| `bottom_001` / bottom | `bottom_001_layer` | Garment aligned from avatar waist through ankles | Transparent alpha | 1000×1400 | Lower-body target x .25-.75, y .40-.92 | `bottom`, provisional z=400; rig review required |
| `shoes_001` / shoes | `shoes_001_thumb` | Pair of simple, unbranded shoes, front/three-quarter view | Neutral light or transparent | 1024×1024 | Pair centered with both shoes fully visible | Modern visual brief, not a historical footwear claim |
| `shoes_001` / shoes | `shoes_001_layer` | Pair placed on avatar feet | Transparent alpha | 1000×1400 | Foot target x .20-.80, y .86-.98 | `front`, provisional z=300; align to foot landmarks |
| `bag_001` / bag | `bag_001_thumb` | Small shoulder bag, isolated three-quarter view, no logo/text | Neutral light or transparent | 1024×1024 | Centered, full bag and strap visible | Catalog/detail; approve design and color |
| `bag_001` / bag | `bag_001_layer` | Bag/strap as front overlay on avatar | Transparent alpha | 1000×1400 | Provisional hip/side target x .58-.88, y .36-.72 | `front`, provisional z=600; must not hide face or key garment details |
| `bag_002` / bag | `bag_002_thumb` | Compact hand-held bag, isolated front/three-quarter view, no logo/text | Neutral light or transparent | 1024×1024 | Centered, full item visible | Catalog/detail; approve design and color |
| `bag_002` / bag | `bag_002_layer` | Bag placed beside the avatar hand/hip | Transparent alpha | 1000×1400 | Provisional hand/hip target x .58-.88, y .52-.84 | `front`, provisional z=600; depends on avatar hand pose |
| `accessory_001` / accessory | `accessory_001_thumb` | Thin-frame glasses, isolated front view | Neutral light or transparent | 1024×1024 | Centered, full frame visible | Modern accessory visual brief |
| `accessory_001` / accessory | `accessory_001_layer` | Glasses aligned to avatar eye landmarks | Transparent alpha | 1000×1400 | Face target x .32-.68, y .10-.22 | `overlay`, provisional z=700; fit-check both avatar presets |

`layer`/`zIndex` above are ordering proposals only. The asset team should not bake a mannequin, body, background, shadow or unrelated garment into render layers.

## 4. Asset search sheet

| Item ID | Search for | View | Background | Transparent? | Layer | Notes |
|---|---|---|---|---|---|---|
| `top_001` | Approved Áo Tấc design | Front, isolated | Neutral or none | Yes for render layer | top / 500 | Human reviewer must approve garment construction/details. |
| `top_002` | Approved Áo Ngũ Thân design | Front, isolated | Neutral or none | Yes for render layer | top / 500 | Do not invent pattern, trim or period-specific detail. |
| `bottom_001` | Approved white-trouser design | Front, full length | Neutral or none | Yes for render layer | bottom / 400 | Confirm item identity and white color before sourcing. |
| `shoes_001` | Simple unbranded shoes | Front/three-quarter thumbnail; pair on avatar layer | Neutral or none | Yes for render layer | front / 300 | Modern styling brief, not historical footwear. |
| `bag_001` | Small low-detail shoulder bag | Three-quarter thumbnail; avatar-aligned layer | Neutral or none | Yes for render layer | front / 600 | Recommendation primary. |
| `bag_002` | Compact hand-held bag | Three-quarter thumbnail; avatar-aligned layer | Neutral or none | Yes for render layer | front / 600 | Recommendation alternative. |
| `accessory_001` | Thin-frame glasses | Front thumbnail; eye-aligned layer | Neutral or none | Yes for render layer | overlay / 700 | Modern accessory; check face fit on every avatar. |

## 5. Avatar presets

MVP proposes two selectable upright human presets. These are neutral product/rig choices, not culturally meaningful identities. No runtime image generation is used.

| ID | Name | Description | Base asset brief | Canvas | Default position |
|---|---|---|---|---|---|
| `avatar_001` | Mẫu người 01 | Upright, front-facing, neutral stance; arms slightly separated from torso so garment layers remain visible | `avatar_001_base`; full-body neutral base, consistent lighting, no clothing beyond neutral base underlayer; transparent background; no props | 1000×1400 | `{x: 0.15, y: 0.03, width: 0.70, height: 0.94}` provisional |
| `avatar_002` | Mẫu người 02 | Same pose and proportions as preset 01, with a second approved body/hair presentation; preserve landmarks for shared item layers | `avatar_002_base`; same framing/lighting/pose contract; transparent background; no props | 1000×1400 | `{x: 0.15, y: 0.03, width: 0.70, height: 0.94}` provisional |

The avatar provider/team must approve presentation, proportions, face/hair variants, base underlayer and rights. If one item layer cannot align across both presets, record per-avatar positions/assets rather than stretching the art.

## 6. Background presets

Backgrounds are a separate catalog from clothing items and are never stored in an Outfit slot.

| ID | Name | Description / visual specification | Recommended occasions | Asset status |
|---|---|---|---|---|
| `background_001` | Studio tối giản | Quiet neutral studio, soft floor shadow, no cultural symbols or text; keep avatar contrast high | Any occasion; default | `PENDING_ASSET` |
| `background_002` | Sân khấu tốt nghiệp | Generic academic stage with restrained celebratory details; no institution logos, named school, or historical motifs | `occ_graduation` | `PENDING_ASSET`; visual review required |
| `background_003` | Phố xuân cách tân | Generic festive street palette and abstract seasonal decor; no claim that a motif is historically authentic | `occ_spring_walk` | `PENDING_ASSET`; cultural review if specific motifs are introduced |

Background delivery brief: 1600×1400 or larger, avatar-safe central area, no person/clothing baked in, no text/logos, sufficient contrast with white and dark garments. Prefer one background asset per preset, not generated at runtime.

## 7. Render coordinate system and layer order

### Coordinate system

- Shared avatar canvas: **1000×1400 pixels**, portrait, front view.
- Normalized coordinates use top-left origin: `x = pixelX / 1000`, `y = pixelY / 1400`, `width = pixelWidth / 1000`, `height = pixelHeight / 1400`.
- Bounds are `[0,1]`; `width` and `height` must be positive and the rectangle must remain inside the canvas.
- Item render assets use the full avatar canvas to preserve alignment. Thumbnail dimensions are independent.
- The position rectangles in avatar rows are provisional framing, not final garment coordinates. Final landmarks and garment bounds require a chosen base avatar and manual fit review.

### Proposed stacking order

| zIndex | Layer | Use |
|---:|---|---|
| 0 | background | Background preset, rendered behind avatar composition |
| 100 | body | Avatar base/body |
| 200 | hair-back | Back hair, if supplied as a separate avatar layer |
| 300 | shoes | Shoes over feet; currently represented by canonical `layer: front` plus this ordering slot until the enum gains a shoes layer |
| 400 | bottom | Bottom garment |
| 450 | underlayer | Required inner layer where applicable |
| 500 | top | Outer top garment |
| 600 | bag/front accessory | Bag and accessories that should sit over clothing |
| 650 | hair-front | Front hair strands, when split from base |
| 700 | face overlay | Glasses or face-aligned accessory |

Within each layer, render ascending zIndex. Bag straps may need back and front assets to pass behind and over clothing; if a single asset cannot preserve that appearance, split the asset or simplify the approved bag design. Background is not an `ItemCategory` and does not use outfit item IDs.

The current `RenderLayer` enum has no explicit `shoes`, `bag-back`, or `hair` value. This document uses `front`/`overlay` plus zIndex for specification; a later implementation owner must decide whether to extend the enum before item JSON is written.

## 8. Context coverage and demo scenarios

Existing knowledge option IDs:

- Graduation: `occ_graduation`
- Spring walk: `occ_spring_walk`
- Student/sĩ tử: `role_student`
- Elegant: `style_elegant`
- Modern remix: `style_modern_remix`
- Strict traditional: `style_strict_traditional`

### Scenario A: graduation outfit browse

```text
Context: occ_graduation + role_student + style_elegant
Candidate outfit: top_001 + bottom_001
```

This proves a concrete catalog-selection path using items whose test records already carry these proposed occasion/style IDs. `top_001` and `bottom_001` remain candidates derived from test records, not promoted records; their names/materials and cultural compatibility require human approval. Do not claim cultural PASS before review.

### Scenario B: catalog-grounded bag recommendation

```text
Context: occ_spring_walk + role_student + style_modern_remix
Current outfit: top_002 + bottom_001 + shoes_001
User request: "Tôi muốn một chiếc túi nhỏ, thanh lịch, không quá nổi bật."
Candidate response: bag_001; alternative: bag_002
```

`rule_remix_boundary` explicitly permits modern accessories for spring walk or modern-remix style. It prohibits them at `occ_royal_court`. Exact item occasion/role suitability still needs human approval. Gemini must receive only IDs from the approved catalog; this phase does not implement that behavior.

## 9. Validation coverage (spec only)

The catalog fields intended to support future checks are `category`, `styleIds`, `occasionIds`, role applicability (see decision below), required companion/layer relationships, and references to approved rule IDs. Do not add `suitabilityScore`.

- **PASS fixture candidate:** an approved outfit/context with no violated applicable rules. Current knowledge does not yet establish enough item compatibility to label either scenario PASS.
- **WARN fixture candidate:** an outfit with incomplete human-reviewed applicability evidence; WARN policy and wording require product-owner approval.
- **NEEDS_ADJUSTMENT fixture:** modern bag/glasses with `occ_royal_court`, referencing existing `rule_remix_boundary`.
- **Required layering:** `rule_layering_aotac` says Áo Tấc/Áo Ngũ Thân requires a thin white inner shirt with visible collar. The current Outfit contract permits only one item ID in `top`; the catalog cannot represent/select both layers without an explicit decision. Do not silently mark an Áo Tấc outfit PASS while this is unresolved.

## 10. Human decisions required

1. Approve or replace the 7 proposed item concepts/names and the proposed IDs before creating knowledge records.
2. Verify item descriptions, colors, materials, style/occasion applicability and role applicability. Existing test JSON is not sufficient evidence for production claims.
3. Decide how the required inner shirt is represented: a selectable second top layer, an explicit companion item, or another approved data model. The current single `top` Outfit slot cannot express two separately worn tops.
4. Decide whether to add explicit renderer layers such as `shoes`, `bag-back`, and `hair`, or keep a generic `front`/`overlay` plus zIndex convention.
5. Approve avatar presentation, base underlayer, landmarks, image rights and whether all item layers must support both avatar presets.
6. Review background visual motifs and confirm that no proposed decoration implies unsupported historical/cultural authenticity.
7. Define operational PASS/WARN policy once reviewed item/rule evidence is available.
8. Confirm `roleIds`/role applicability representation. The current canonical Item metadata has no role reference field; do not invent role compatibility in item records until the contract owner approves a representation.

## 11. Asset delivery checklist

For every catalog item, deliver:

- Thumbnail for catalog card/detail, separately identified from renderer artwork.
- Transparent render layer aligned to the 1000×1400 avatar canvas.
- Source file, exported file, actual MIME type/extension, dimensions, alpha-channel check and checksum.
- Approval record for visual design and rights.
- Per-avatar fit check; no baked body/background/text/watermark in render layers.

For backgrounds, deliver a separate background asset with no avatar/item baked in. Runtime image generation is out of scope.

## 12. Scope check

This phase creates only a data/asset specification. It does not implement Avatar Renderer, Gemini recommendation, Validation, Final Outfit, database, UI redesign, asset search/download, or changes to legacy `mockItems.ts`/endpoints.
