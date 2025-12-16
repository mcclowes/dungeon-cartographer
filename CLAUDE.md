# dungeon-cartographer

Procedural map generation library - pure TypeScript, framework-agnostic.

## Architecture

```
src/
├── generators/     # Map generation algorithms (BSP, cave, DLA, maze, perlin, voronoi, WFC, etc.)
├── shapes/         # Room shape generation (cellular, polygon, composite, modifiers)
├── render/         # Optional canvas rendering (separate export)
├── utils/          # Shared utilities (random, grid, postprocess, features)
├── types.ts        # Core types and enums
└── index.ts        # Main exports
demo/               # Next.js App Router playground
```

## Key Patterns

- All generators return `Grid` (2D number array)
- Tile types are enums: `TileType`, `TerrainTile`, `MazeTile`
- Rendering is optional via `dungeon-cartographer/render`
- No external runtime dependencies

## Build

```bash
npm run build      # Build with tsup (CJS + ESM + types)
npm run typecheck  # Type check only
npm run test       # Run vitest
```

## Adding a Generator

1. Create `src/generators/myGenerator.ts`
2. Export options interface and main function
3. Re-export from `src/generators/index.ts`
4. Add to demo if visual testing needed

## Commit Messages

- No AI attribution in commit messages
- Keep messages concise and descriptive
