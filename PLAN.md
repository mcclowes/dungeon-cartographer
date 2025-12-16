# Non-Rectangular Rooms Implementation Plan

## Overview

Add support for diverse room shapes to the dungeon generation system. This includes composite shapes (L, T, +), templates, procedural modifiers, cellular automata rooms, and polygon-based rooms.

## Architecture Design

### New Module Structure

```
src/
├── shapes/                    # NEW: Room shape system
│   ├── index.ts              # Shape exports
│   ├── types.ts              # Shape type definitions
│   ├── composite.ts          # L, T, + shaped rooms
│   ├── templates.ts          # Pre-defined shape templates
│   ├── modifiers.ts          # Post-processing shape modifiers
│   ├── cellular.ts           # Cellular automata room generation
│   ├── polygon.ts            # Polygon-based rooms
│   └── draw.ts               # Unified shape drawing utilities
├── generators/
│   └── bsp.ts                # Update to support room shapes
└── types.ts                  # Add shape-related types
```

### Type Definitions

```typescript
// src/shapes/types.ts

/** Base room shape that all shapes extend */
export interface BaseRoomShape {
  type: RoomShapeType;
  boundingBox: Rect;  // For collision detection and placement
}

/** Shape type discriminator */
export enum RoomShapeType {
  RECTANGLE = 'rectangle',
  COMPOSITE = 'composite',
  TEMPLATE = 'template',
  CELLULAR = 'cellular',
  POLYGON = 'polygon',
}

/** Simple rectangle (existing behavior) */
export interface RectangleShape extends BaseRoomShape {
  type: RoomShapeType.RECTANGLE;
  rect: Rect;
}

/** Composite: multiple overlapping rectangles */
export interface CompositeShape extends BaseRoomShape {
  type: RoomShapeType.COMPOSITE;
  rects: Rect[];
  variant: CompositeVariant;
}

export type CompositeVariant = 'L' | 'T' | 'CROSS' | 'U' | 'Z' | 'RANDOM';

/** Template: boolean mask defining shape */
export interface TemplateShape extends BaseRoomShape {
  type: RoomShapeType.TEMPLATE;
  mask: boolean[][];
  templateName: string;
}

/** Cellular: organic room from cellular automata */
export interface CellularShape extends BaseRoomShape {
  type: RoomShapeType.CELLULAR;
  tiles: Point[];  // List of floor tile positions
}

/** Polygon: defined by vertices */
export interface PolygonShape extends BaseRoomShape {
  type: RoomShapeType.POLYGON;
  vertices: Point[];
  variant: PolygonVariant;
}

export type PolygonVariant = 'hexagon' | 'octagon' | 'circle' | 'ellipse' | 'custom';

/** Union type for all shapes */
export type RoomShape =
  | RectangleShape
  | CompositeShape
  | TemplateShape
  | CellularShape
  | PolygonShape;

/** Shape modifier operations */
export interface ShapeModifier {
  type: ModifierType;
  probability?: number;
  params?: Record<string, number>;
}

export enum ModifierType {
  NIBBLE_CORNERS = 'nibble_corners',
  ADD_ALCOVES = 'add_alcoves',
  ROUND_CORNERS = 'round_corners',
  ADD_PILLARS = 'add_pillars',
  IRREGULAR_EDGES = 'irregular_edges',
}

/** Configuration for room shape generation */
export interface RoomShapeOptions {
  /** Which shape types to use (default: all) */
  allowedShapes?: RoomShapeType[];

  /** Weights for shape selection (default: equal) */
  shapeWeights?: Partial<Record<RoomShapeType, number>>;

  /** Composite shape options */
  compositeVariants?: CompositeVariant[];

  /** Template names to use */
  allowedTemplates?: string[];

  /** Polygon variants to use */
  polygonVariants?: PolygonVariant[];

  /** Post-processing modifiers to apply */
  modifiers?: ShapeModifier[];

  /** Cellular automata iterations (default: 4) */
  cellularIterations?: number;

  /** Cellular fill probability (default: 0.45) */
  cellularFillProbability?: number;
}
```

## Implementation Steps

### Step 1: Create Shape Type Definitions
- Create `src/shapes/types.ts` with all shape interfaces
- Export types from `src/shapes/index.ts`
- Add to main exports in `src/index.ts`

### Step 2: Implement Shape Drawing Utilities
Create `src/shapes/draw.ts`:
- `drawRoomShape(grid, shape)` - Main dispatcher
- `drawRectangle(grid, rect)` - Existing logic extracted
- `drawComposite(grid, rects)` - Draw multiple overlapping rects
- `drawTemplate(grid, mask, position)` - Draw from boolean mask
- `drawCellular(grid, tiles)` - Draw from tile list
- `drawPolygon(grid, vertices)` - Rasterize polygon
- `getBoundingBox(shape)` - Calculate bounds for any shape
- `getShapeTiles(shape)` - Get all floor tiles for a shape

### Step 3: Implement Composite Shapes
Create `src/shapes/composite.ts`:
- `createLShape(width, height, armWidth)` - L-shaped room
- `createTShape(width, height, stemWidth)` - T-shaped room
- `createCrossShape(width, height, armWidth)` - + shaped room
- `createUShape(width, height, armWidth)` - U-shaped room
- `createZShape(width, height, armWidth)` - Z-shaped room
- `createRandomComposite(bounds, minRects, maxRects)` - Random composite
- `generateCompositeShape(bounds, variant)` - Main factory function

### Step 4: Implement Shape Templates
Create `src/shapes/templates.ts`:
- Define template library as Record<string, boolean[][]>
- Templates: 'cross', 'diamond', 'octagon', 'rounded', 'irregular1-5'
- `getTemplate(name)` - Get template by name
- `scaleTemplate(template, scale)` - Scale template to fit bounds
- `rotateTemplate(template, rotation)` - 0, 90, 180, 270 degrees
- `generateTemplateShape(bounds, templateName)` - Main factory

### Step 5: Implement Shape Modifiers
Create `src/shapes/modifiers.ts`:
- `applyModifiers(grid, room, modifiers)` - Apply modifier chain
- `nibbleCorners(grid, room, probability)` - Remove random corners
- `addAlcoves(grid, room, count, size)` - Add rectangular extensions
- `roundCorners(grid, room, radius)` - Diagonal corner cuts
- `addPillars(grid, room, count)` - Interior pillar placement
- `irregularEdges(grid, room, variance)` - Random edge modifications

### Step 6: Implement Cellular Automata Rooms
Create `src/shapes/cellular.ts`:
- `generateCellularRoom(bounds, options)` - Main generator
- `initializeCells(bounds, fillProbability)` - Random initial state
- `iterateCellular(cells, iterations)` - Apply CA rules
- `extractLargestRegion(cells)` - Flood fill to get connected region
- `cellsToShape(cells, bounds)` - Convert to CellularShape

### Step 7: Implement Polygon Rooms
Create `src/shapes/polygon.ts`:
- `createHexagon(center, radius)` - Regular hexagon vertices
- `createOctagon(center, radius)` - Regular octagon vertices
- `createCircle(center, radius, segments)` - Approximated circle
- `createEllipse(center, radiusX, radiusY, segments)` - Ellipse
- `rasterizePolygon(vertices, bounds)` - Scanline fill algorithm
- `generatePolygonShape(bounds, variant)` - Main factory

### Step 8: Create Shape Factory
Create unified factory in `src/shapes/index.ts`:
- `generateRoomShape(bounds, options)` - Main entry point
- Select shape type based on weights
- Call appropriate generator
- Apply modifiers if configured
- Return RoomShape with bounding box

### Step 9: Update BSP Generator
Modify `src/generators/bsp.ts`:
- Add `roomShapeOptions?: RoomShapeOptions` to BSPOptions
- Update `createRooms()` to use shape factory
- Update `drawAllRooms()` to use `drawRoomShape()`
- Update `getCenter()` to work with non-rectangular shapes
- Update door placement to find actual room edges

### Step 10: Update Demo
Modify `demo/app/page.tsx`:
- Add room shape controls to BSP generator panel
- Shape type checkboxes
- Modifier toggles
- Preview different shape types

## Testing Strategy

### Unit Tests
- Each shape generator produces valid output
- Bounding boxes correctly calculated
- Modifiers preserve room connectivity
- Polygon rasterization accuracy

### Integration Tests
- BSP generates valid dungeons with mixed shapes
- Doors placed correctly on non-rectangular rooms
- Features place correctly in irregular rooms
- No floating/disconnected tiles

### Visual Tests (Demo)
- Each shape type renders correctly
- Modifiers produce expected visual results
- Mixed shape dungeons look good

## Migration & Compatibility

- Default behavior unchanged (rectangle shapes only when no options)
- Existing BSPOptions interface extended, not replaced
- No breaking changes to public API
- New shapes are opt-in via `roomShapeOptions`

## File Change Summary

### New Files (10)
1. `src/shapes/types.ts` - Type definitions
2. `src/shapes/draw.ts` - Drawing utilities
3. `src/shapes/composite.ts` - L, T, +, U, Z shapes
4. `src/shapes/templates.ts` - Template library
5. `src/shapes/modifiers.ts` - Shape modifiers
6. `src/shapes/cellular.ts` - Cellular automata rooms
7. `src/shapes/polygon.ts` - Polygon rooms
8. `src/shapes/index.ts` - Main exports and factory
9. `src/shapes/__tests__/shapes.test.ts` - Unit tests
10. `src/shapes/__tests__/integration.test.ts` - Integration tests

### Modified Files (4)
1. `src/types.ts` - Re-export shape types
2. `src/index.ts` - Export shapes module
3. `src/generators/bsp.ts` - Integrate room shapes
4. `demo/app/page.tsx` - Add shape controls
