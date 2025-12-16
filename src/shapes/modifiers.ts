import type { Grid, Point } from "../types";
import { TileType } from "../types";
import type { ShapeModifier, RoomShape } from "./types";
import { ModifierType } from "./types";
import { getShapeTiles } from "./draw";
import { randomInt } from "../utils/random";

/**
 * Apply a list of modifiers to a room on the grid
 */
export function applyModifiers(
  grid: Grid,
  shape: RoomShape,
  modifiers: ShapeModifier[]
): void {
  for (const modifier of modifiers) {
    // Check probability
    const probability = modifier.probability ?? 1;
    if (Math.random() > probability) {
      continue;
    }

    switch (modifier.type) {
      case ModifierType.NIBBLE_CORNERS:
        nibbleCorners(grid, shape, modifier.params);
        break;
      case ModifierType.ADD_ALCOVES:
        addAlcoves(grid, shape, modifier.params);
        break;
      case ModifierType.ROUND_CORNERS:
        roundCorners(grid, shape, modifier.params);
        break;
      case ModifierType.ADD_PILLARS:
        addPillars(grid, shape, modifier.params);
        break;
      case ModifierType.IRREGULAR_EDGES:
        irregularEdges(grid, shape, modifier.params);
        break;
    }
  }
}

/**
 * Remove random corners from a room to create irregular edges
 */
export function nibbleCorners(
  grid: Grid,
  shape: RoomShape,
  params?: Record<string, number>
): void {
  const probability = params?.probability ?? 0.3;
  const maxNibbleSize = params?.maxSize ?? 2;

  const bb = shape.boundingBox;
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Find corner positions
  const corners: { x: number; y: number; dx: number; dy: number }[] = [
    { x: bb.x, y: bb.y, dx: 1, dy: 1 }, // Top-left
    { x: bb.x + bb.width - 1, y: bb.y, dx: -1, dy: 1 }, // Top-right
    { x: bb.x, y: bb.y + bb.height - 1, dx: 1, dy: -1 }, // Bottom-left
    { x: bb.x + bb.width - 1, y: bb.y + bb.height - 1, dx: -1, dy: -1 }, // Bottom-right
  ];

  for (const corner of corners) {
    if (Math.random() > probability) continue;

    const nibbleSize = randomInt(maxNibbleSize + 1, 1);

    // Nibble a triangular corner
    for (let i = 0; i < nibbleSize; i++) {
      for (let j = 0; j < nibbleSize - i; j++) {
        const nx = corner.x + corner.dx * i;
        const ny = corner.y + corner.dy * j;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (grid[ny][nx] === TileType.FLOOR) {
            grid[ny][nx] = TileType.WALL;
          }
        }
      }
    }
  }
}

/**
 * Add small rectangular alcoves extending from the room
 */
export function addAlcoves(
  grid: Grid,
  shape: RoomShape,
  params?: Record<string, number>
): void {
  const count = params?.count ?? randomInt(4, 1);
  const minSize = params?.minSize ?? 1;
  const maxSize = params?.maxSize ?? 2;

  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Get edge tiles
  const tiles = getShapeTiles(shape);
  const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));

  // Find edge tiles (adjacent to at least one wall)
  const edgeTiles: Point[] = tiles.filter((tile) => {
    const neighbors = [
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
    ];

    return neighbors.some((n) => {
      if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) return false;
      return !tileSet.has(`${n.x},${n.y}`) && grid[n.y][n.x] === TileType.WALL;
    });
  });

  if (edgeTiles.length === 0) return;

  for (let i = 0; i < count; i++) {
    const edgeTile = edgeTiles[randomInt(edgeTiles.length, 0)];

    // Find which direction the wall is
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const wallX = edgeTile.x + dir.dx;
      const wallY = edgeTile.y + dir.dy;

      if (wallX < 1 || wallX >= width - 1 || wallY < 1 || wallY >= height - 1) {
        continue;
      }

      if (grid[wallY][wallX] !== TileType.WALL) continue;

      // Create alcove extending in this direction
      const alcoveDepth = randomInt(maxSize + 1, minSize);
      const alcoveWidth = randomInt(maxSize + 1, minSize);

      // Determine alcove bounds
      let alcoveOk = true;
      const alcoveTiles: Point[] = [];

      for (let d = 1; d <= alcoveDepth && alcoveOk; d++) {
        for (let w = -Math.floor(alcoveWidth / 2); w <= Math.floor(alcoveWidth / 2) && alcoveOk; w++) {
          let ax: number, ay: number;

          if (dir.dx !== 0) {
            // Horizontal alcove
            ax = edgeTile.x + dir.dx * d;
            ay = edgeTile.y + w;
          } else {
            // Vertical alcove
            ax = edgeTile.x + w;
            ay = edgeTile.y + dir.dy * d;
          }

          // Check bounds (leave border)
          if (ax < 1 || ax >= width - 1 || ay < 1 || ay >= height - 1) {
            alcoveOk = false;
            break;
          }

          // Only carve into walls
          if (grid[ay][ax] !== TileType.WALL) {
            alcoveOk = false;
            break;
          }

          alcoveTiles.push({ x: ax, y: ay });
        }
      }

      // Carve the alcove
      if (alcoveOk && alcoveTiles.length > 0) {
        for (const tile of alcoveTiles) {
          grid[tile.y][tile.x] = TileType.FLOOR;
        }
        break; // Only add one alcove per edge tile
      }
    }
  }
}

/**
 * Round the corners of a room by replacing corner tiles with diagonal walls
 */
export function roundCorners(
  grid: Grid,
  shape: RoomShape,
  params?: Record<string, number>
): void {
  const radius = params?.radius ?? 1;

  const bb = shape.boundingBox;
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Process each corner
  const corners: { x: number; y: number; dx: number; dy: number }[] = [
    { x: bb.x, y: bb.y, dx: 1, dy: 1 },
    { x: bb.x + bb.width - 1, y: bb.y, dx: -1, dy: 1 },
    { x: bb.x, y: bb.y + bb.height - 1, dx: 1, dy: -1 },
    { x: bb.x + bb.width - 1, y: bb.y + bb.height - 1, dx: -1, dy: -1 },
  ];

  for (const corner of corners) {
    // Create a rounded corner by removing tiles outside a circle
    for (let dy = 0; dy < radius; dy++) {
      for (let dx = 0; dx < radius; dx++) {
        // Check if this tile is outside the rounded corner
        const distX = radius - dx - 0.5;
        const distY = radius - dy - 0.5;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist > radius) {
          const cx = corner.x + (corner.dx > 0 ? dx : -dx);
          const cy = corner.y + (corner.dy > 0 ? dy : -dy);

          if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
            if (grid[cy][cx] === TileType.FLOOR) {
              grid[cy][cx] = TileType.WALL;
            }
          }
        }
      }
    }
  }
}

/**
 * Add interior pillars to a room
 */
export function addPillars(
  grid: Grid,
  shape: RoomShape,
  params?: Record<string, number>
): void {
  const count = params?.count ?? randomInt(5, 2);
  const minSpacing = params?.minSpacing ?? 2;

  const tiles = getShapeTiles(shape);
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Find interior tiles (not adjacent to walls)
  const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));
  const interiorTiles = tiles.filter((tile) => {
    // Check all 8 neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = tile.x + dx;
        const ny = tile.y + dy;

        if (!tileSet.has(`${nx},${ny}`)) {
          return false;
        }
      }
    }
    return true;
  });

  if (interiorTiles.length < count) return;

  const pillars: Point[] = [];

  for (let i = 0; i < count && interiorTiles.length > 0; i++) {
    // Find a tile that's far enough from existing pillars
    let attempts = 0;
    while (attempts < 50) {
      const idx = randomInt(interiorTiles.length, 0);
      const candidate = interiorTiles[idx];

      // Check distance from existing pillars
      const tooClose = pillars.some((p) => {
        const dist = Math.abs(p.x - candidate.x) + Math.abs(p.y - candidate.y);
        return dist < minSpacing;
      });

      if (!tooClose) {
        pillars.push(candidate);
        // Remove nearby tiles from candidates
        for (let j = interiorTiles.length - 1; j >= 0; j--) {
          const t = interiorTiles[j];
          const dist = Math.abs(t.x - candidate.x) + Math.abs(t.y - candidate.y);
          if (dist < minSpacing) {
            interiorTiles.splice(j, 1);
          }
        }
        break;
      }

      attempts++;
    }
  }

  // Place pillars
  for (const pillar of pillars) {
    if (pillar.y >= 0 && pillar.y < height && pillar.x >= 0 && pillar.x < width) {
      grid[pillar.y][pillar.x] = TileType.WALL;
    }
  }
}

/**
 * Make room edges irregular by randomly removing/adding edge tiles
 */
export function irregularEdges(
  grid: Grid,
  shape: RoomShape,
  params?: Record<string, number>
): void {
  const probability = params?.probability ?? 0.2;
  const variance = params?.variance ?? 1;

  const tiles = getShapeTiles(shape);
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Find edge tiles
  const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));
  const edgeTiles = tiles.filter((tile) => {
    const neighbors = [
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
    ];

    return neighbors.some((n) => !tileSet.has(`${n.x},${n.y}`));
  });

  // Randomly remove some edge tiles
  for (const tile of edgeTiles) {
    if (Math.random() < probability) {
      // Only remove if it won't disconnect the room
      // Simple check: ensure at least 2 adjacent floor tiles remain
      const adjacentFloors = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 },
      ].filter((n) => tileSet.has(`${n.x},${n.y}`));

      if (adjacentFloors.length >= 2 && tile.y >= 0 && tile.y < height && tile.x >= 0 && tile.x < width) {
        grid[tile.y][tile.x] = TileType.WALL;
        tileSet.delete(`${tile.x},${tile.y}`);
      }
    }
  }

  // Randomly add some tiles adjacent to edges
  for (const tile of edgeTiles) {
    if (Math.random() < probability * 0.5) {
      const directions = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
      ];

      const dir = directions[randomInt(4, 0)];
      for (let d = 1; d <= variance; d++) {
        const nx = tile.x + dir.dx * d;
        const ny = tile.y + dir.dy * d;

        if (nx < 1 || nx >= width - 1 || ny < 1 || ny >= height - 1) break;

        if (grid[ny][nx] === TileType.WALL && !tileSet.has(`${nx},${ny}`)) {
          grid[ny][nx] = TileType.FLOOR;
          tileSet.add(`${nx},${ny}`);
          break;
        }
      }
    }
  }
}

/**
 * Create modifier with default parameters
 */
export function createModifier(
  type: ModifierType,
  probability?: number,
  params?: Record<string, number>
): ShapeModifier {
  return {
    type,
    probability,
    params,
  };
}
