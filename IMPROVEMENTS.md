# Parchment Style Improvements

Potential enhancements for the parchment/treasure map render style.

## Visual Style

- [x] **Organic/wobbly borders** - More irregular, hand-drawn edges that meander slightly instead of smooth curves *(enhanced `drawLineWithGaps` with perpendicular wobble)*
- [x] **Grid lines across full parchment** - Faint grid extends across margins/wall areas, not just inside rooms *(added via `fullGridLines` option)*
- [x] **Varied hatching patterns** - Crosshatch with varied angles, not just perpendicular strokes *(enhanced `drawMarginHatching` with angle variation and crosshatch)*
- [x] **Edge wear/torn edges** - Rough, torn-looking edges around the parchment border *(added via `tornEdges` option)*
- [x] **Fold lines/creases** - Subtle fold marks across the parchment surface *(added via `foldLines` option)*

## Map Decorations

- [x] **Room labels/numbers** - Option to add room identifiers (I, II, III, etc.) *(added via `roomLabels` option with Roman numeral support)*
- [x] **Compass rose** - Classic N/S/E/W decoration *(added via `compassRose` option)*
- [x] **Scale bar** - "10 feet" style indicator *(added via `scaleBar` option)*
- [ ] **Legend** - Key explaining tile symbols
- [ ] **Title cartouche** - Decorative frame for map title

## Tile Rendering

- [x] **Secret doors** - Different visual treatment (dotted line with 'S')
- [x] **Pillars/columns** - Support columns in large rooms *(added via `pillars` option with room-aware placement)*
- [ ] **Furniture** - Tables, beds, altars for room dressing
- [ ] **Rubble/debris** - Collapsed areas

## Generation Quality

- [x] **Reduce trap clustering** - Better spacing between trap placements *(via `minFeatureDistance` option)*
- [x] **Even feature distribution** - Spread features across rooms, not clustered *(via distance enforcement)*
- [x] **Room-aware placement** - Place features considering room size/purpose *(added `placeFeaturesWithRooms` function and `generateBSPWithRooms`/`generateVoronoiWithRooms`)*
- [x] **Minimum distances** - Enforce spacing between special tiles *(via `minFeatureDistance` and `minAnyFeatureDistance` options)*
