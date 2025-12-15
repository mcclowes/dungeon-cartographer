# dungeon-cartographer

Procedural map generation library for dungeons, caves, mazes, and terrain.

## Installation

```bash
npm install dungeon-cartographer
```

## Usage

### Generators

```typescript
import {
  generateBSP,
  generateCave,
  generateDrunkardWalk,
  generateMaze,
  generatePerlin,
  generateWFC,
} from 'dungeon-cartographer';

// BSP Dungeon - rooms connected by corridors
const dungeon = generateBSP(32);

// Cellular Automata Caves
const cave = generateCave(32, { iterations: 4 });

// Drunkard's Walk - organic cave carving
const organic = generateDrunkardWalk(32, { variant: 'weighted' });

// Maze - multiple algorithms
const maze = generateMaze(31, { algorithm: 'backtracking' });

// Perlin Terrain - island or continent
const terrain = generatePerlin(64, { islandMode: true });

// Wave Function Collapse
const wfc = generateWFC(32);
```

All generators return a `Grid` (2D number array) where each number represents a tile type.

### Optional Canvas Rendering

```typescript
import { generatePerlin } from 'dungeon-cartographer';
import { drawGrid } from 'dungeon-cartographer/render';

const terrain = generatePerlin(64);
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

drawGrid(ctx, terrain, canvas.width, canvas.height, { style: 'terrain' });
```

## Generators

### BSP (Binary Space Partitioning)

Creates structured dungeons with distinct rooms and corridors.

```typescript
generateBSP(size, {
  minPartitionSize?: number,  // default: 6
  maxDepth?: number,          // default: 4
  minRoomSize?: number,       // default: 3
  padding?: number,           // default: 1
  addDoors?: boolean,         // default: true
});
```

### Cellular Automata Caves

Organic cave systems using cellular automata rules.

```typescript
generateCave(size, {
  iterations?: number,              // default: 3
  initialFillProbability?: number,  // default: 0.5
});
```

### Drunkard's Walk

Random walk algorithms for organic spaces.

```typescript
generateDrunkardWalk(size, {
  fillPercentage?: number,                          // default: 0.45
  variant?: 'simple' | 'weighted' | 'multiple',     // default: 'weighted'
  numWalkers?: number,                              // default: 4 (for 'multiple')
});
```

### Maze

Multiple maze generation algorithms.

```typescript
generateMaze(size, {
  algorithm?: 'backtracking' | 'prims' | 'division',  // default: 'backtracking'
  addStartEnd?: boolean,                               // default: true
  loopChance?: number,                                 // default: 0 (perfect maze)
  openness?: number,                                   // default: 0
});
```

### Perlin Terrain

Natural terrain using Perlin noise.

```typescript
generatePerlin(size, {
  scale?: number,            // default: 0.08
  octaves?: number,          // default: 4
  islandMode?: boolean,      // default: true
  waterLevel?: number,       // default: 0.35
  // ... more threshold options
});
```

### Wave Function Collapse

Constraint-based generation using adjacency rules.

```typescript
generateWFC(size, {
  seedRadius?: number,  // default: size/6
});
```

## Tile Types

```typescript
// Dungeon tiles (BSP, Cave, Drunkard, WFC)
enum TileType {
  WALL = 0,
  FLOOR = 1,
  DOOR = 2,
  SECRET_DOOR = 3,
  CORRIDOR = 4,
}

// Terrain tiles (Perlin)
enum TerrainTile {
  DEEP_WATER = 0,
  WATER = 1,
  SAND = 2,
  GRASS = 3,
  FOREST = 4,
  MOUNTAIN = 5,
}

// Maze tiles
enum MazeTile {
  WALL = 0,
  PASSAGE = 1,
  START = 2,
  END = 3,
}
```

## Rendering

The optional render module provides canvas rendering with multiple styles:

```typescript
import { drawGrid, renderToCanvas, renderToDataURL } from 'dungeon-cartographer/render';

// Draw to existing context
drawGrid(ctx, grid, width, height, {
  style: 'dungeon' | 'terrain' | 'maze' | 'simple',
  palette?: Record<number, string>,
  showGrid?: boolean,
  shadows?: boolean,
});

// Create a new canvas
const canvas = renderToCanvas(grid, 700, 700, { style: 'terrain' });

// Get data URL for export
const dataUrl = renderToDataURL(grid, 700, 700, {}, 'png');
```

## Demo

Run the interactive demo:

```bash
cd demo
npm install
npm run dev
```

## License

MIT
