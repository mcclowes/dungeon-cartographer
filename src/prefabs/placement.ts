import type { Grid, Point, Rect } from "../types";
import { TileType } from "../types";
import { createSeededRandom } from "../utils/random";
import type {
  Prefab,
  PlacedPrefab,
  PrefabPlacementOptions,
  PrefabPlacementResult,
  PrefabConnection,
} from "./types";

/**
 * Rotate a grid 90 degrees clockwise
 */
function rotateGrid90(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const rotated: Grid = [];

  for (let x = 0; x < width; x++) {
    const row: number[] = [];
    for (let y = height - 1; y >= 0; y--) {
      row.push(grid[y][x]);
    }
    rotated.push(row);
  }

  return rotated;
}

/**
 * Rotate a grid by specified degrees (0, 90, 180, 270)
 */
export function rotateGrid(grid: Grid, degrees: 0 | 90 | 180 | 270): Grid {
  let result = grid.map((row) => [...row]);
  const rotations = degrees / 90;

  for (let i = 0; i < rotations; i++) {
    result = rotateGrid90(result);
  }

  return result;
}

/**
 * Mirror a grid horizontally
 */
export function mirrorGrid(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse());
}

/**
 * Rotate a connection point based on grid rotation
 */
function rotateConnection(
  conn: PrefabConnection,
  degrees: 0 | 90 | 180 | 270,
  width: number,
  height: number
): PrefabConnection {
  let { x, y } = conn.position;
  const direction = conn.direction;

  const directionMap: Record<string, Record<number, PrefabConnection["direction"]>> = {
    north: { 0: "north", 90: "east", 180: "south", 270: "west" },
    south: { 0: "south", 90: "west", 180: "north", 270: "east" },
    east: { 0: "east", 90: "south", 180: "west", 270: "north" },
    west: { 0: "west", 90: "north", 180: "east", 270: "south" },
  };

  // Rotate position
  for (let i = 0; i < degrees / 90; i++) {
    const newX = height - 1 - y;
    const newY = x;
    x = newX;
    y = newY;
    // Swap dimensions for next iteration
    const temp = width;
    width = height;
    height = temp;
  }

  return {
    position: { x, y },
    direction: directionMap[direction][degrees],
    required: conn.required,
  };
}

/**
 * Mirror a connection point horizontally
 */
function mirrorConnection(conn: PrefabConnection, width: number): PrefabConnection {
  const direction =
    conn.direction === "east" ? "west" : conn.direction === "west" ? "east" : conn.direction;

  return {
    position: { x: width - 1 - conn.position.x, y: conn.position.y },
    direction,
    required: conn.required,
  };
}

/**
 * Transform a prefab (rotate and/or mirror)
 */
export function transformPrefab(
  prefab: Prefab,
  rotation: 0 | 90 | 180 | 270,
  mirror: boolean
): { grid: Grid; connections: PrefabConnection[]; width: number; height: number } {
  let grid = prefab.grid.map((row) => [...row]);
  let connections = [...prefab.connections];
  let width = prefab.width;
  let height = prefab.height;

  // Apply rotation
  if (rotation !== 0) {
    grid = rotateGrid(grid, rotation);
    connections = connections.map((c) => rotateConnection(c, rotation, width, height));

    // Update dimensions for 90/270 rotation
    if (rotation === 90 || rotation === 270) {
      const temp = width;
      width = height;
      height = temp;
    }
  }

  // Apply mirror
  if (mirror) {
    grid = mirrorGrid(grid);
    connections = connections.map((c) => mirrorConnection(c, width));
  }

  return { grid, connections, width, height };
}

/**
 * Check if a prefab can be placed at a position
 */
function canPlacePrefab(
  dungeonGrid: Grid,
  prefabGrid: Grid,
  position: Point,
  padding: number
): boolean {
  const dungeonHeight = dungeonGrid.length;
  const dungeonWidth = dungeonGrid[0]?.length ?? 0;
  const prefabHeight = prefabGrid.length;
  const prefabWidth = prefabGrid[0]?.length ?? 0;

  // Check bounds with padding
  if (
    position.x - padding < 0 ||
    position.y - padding < 0 ||
    position.x + prefabWidth + padding > dungeonWidth ||
    position.y + prefabHeight + padding > dungeonHeight
  ) {
    return false;
  }

  // Check that area is all walls (uncarved space)
  for (let py = -padding; py < prefabHeight + padding; py++) {
    for (let px = -padding; px < prefabWidth + padding; px++) {
      const dx = position.x + px;
      const dy = position.y + py;

      if (dx >= 0 && dx < dungeonWidth && dy >= 0 && dy < dungeonHeight) {
        if (dungeonGrid[dy][dx] !== TileType.WALL) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Check if placing a prefab would overlap with existing placed prefabs
 */
function wouldOverlap(
  position: Point,
  width: number,
  height: number,
  placedPrefabs: PlacedPrefab[],
  minDistance: number
): boolean {
  const newBounds: Rect = { x: position.x, y: position.y, width, height };

  for (const placed of placedPrefabs) {
    const expandedBounds: Rect = {
      x: placed.bounds.x - minDistance,
      y: placed.bounds.y - minDistance,
      width: placed.bounds.width + minDistance * 2,
      height: placed.bounds.height + minDistance * 2,
    };

    // Check rectangle overlap
    if (
      newBounds.x < expandedBounds.x + expandedBounds.width &&
      newBounds.x + newBounds.width > expandedBounds.x &&
      newBounds.y < expandedBounds.y + expandedBounds.height &&
      newBounds.y + newBounds.height > expandedBounds.y
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Place a prefab onto the dungeon grid
 */
function placePrefabOnGrid(dungeonGrid: Grid, prefabGrid: Grid, position: Point): void {
  const prefabHeight = prefabGrid.length;
  const prefabWidth = prefabGrid[0]?.length ?? 0;

  for (let py = 0; py < prefabHeight; py++) {
    for (let px = 0; px < prefabWidth; px++) {
      const tile = prefabGrid[py][px];
      // Only place non-wall tiles (walls are background)
      if (tile !== TileType.WALL) {
        dungeonGrid[position.y + py][position.x + px] = tile;
      } else {
        // Place walls too - prefab walls are intentional
        dungeonGrid[position.y + py][position.x + px] = tile;
      }
    }
  }
}

/**
 * Connect a placed prefab to the dungeon by carving corridors to its connection points
 */
function connectPrefabToDungeon(
  grid: Grid,
  connections: PrefabConnection[],
  position: Point
): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (const conn of connections) {
    const absX = position.x + conn.position.x;
    const absY = position.y + conn.position.y;

    // Carve a short corridor in the connection direction
    const dirOffsets: Record<string, { dx: number; dy: number }> = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
    };

    const offset = dirOffsets[conn.direction];
    let cx = absX + offset.dx;
    let cy = absY + offset.dy;

    // Carve corridor until we hit existing floor/corridor or go out of bounds
    const maxLength = 10;
    for (let i = 0; i < maxLength; i++) {
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) break;

      const tile = grid[cy][cx];
      if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
        break;
      }

      grid[cy][cx] = TileType.CORRIDOR;
      cx += offset.dx;
      cy += offset.dy;
    }
  }
}

/**
 * Filter prefabs based on options
 */
function filterPrefabs(prefabs: Prefab[], options: PrefabPlacementOptions): Prefab[] {
  let filtered = [...prefabs];

  // Filter by category
  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter((p) => options.categories!.includes(p.category));
  }

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter((p) => p.tags?.some((t) => options.tags!.includes(t)));
  }

  // Filter by level
  const level = options.level ?? 1;
  filtered = filtered.filter((p) => {
    const minOk = p.minLevel === undefined || level >= p.minLevel;
    const maxOk = p.maxLevel === undefined || level <= p.maxLevel;
    return minOk && maxOk;
  });

  return filtered;
}

/**
 * Select a random prefab based on weights
 */
function selectWeightedPrefab(prefabs: Prefab[], random: () => number): Prefab {
  const totalWeight = prefabs.reduce((sum, p) => sum + (p.weight ?? 1), 0);
  let roll = random() * totalWeight;

  for (const prefab of prefabs) {
    roll -= prefab.weight ?? 1;
    if (roll <= 0) {
      return prefab;
    }
  }

  return prefabs[prefabs.length - 1];
}

/**
 * Find valid placement positions for a prefab in the dungeon
 */
function findValidPositions(
  dungeonGrid: Grid,
  prefabWidth: number,
  prefabHeight: number,
  placedPrefabs: PlacedPrefab[],
  padding: number,
  minDistance: number
): Point[] {
  const positions: Point[] = [];
  const dungeonHeight = dungeonGrid.length;
  const dungeonWidth = dungeonGrid[0]?.length ?? 0;

  // Sample positions (not every single one for performance)
  const step = 2;

  for (let y = padding; y < dungeonHeight - prefabHeight - padding; y += step) {
    for (let x = padding; x < dungeonWidth - prefabWidth - padding; x += step) {
      const pos = { x, y };

      // Create a temp grid for the prefab
      const tempGrid: Grid = Array(prefabHeight)
        .fill(0)
        .map(() => Array(prefabWidth).fill(TileType.WALL));

      if (
        canPlacePrefab(dungeonGrid, tempGrid, pos, padding) &&
        !wouldOverlap(pos, prefabWidth, prefabHeight, placedPrefabs, minDistance)
      ) {
        positions.push(pos);
      }
    }
  }

  return positions;
}

/**
 * Place prefab rooms into an existing dungeon grid
 *
 * @param grid - The dungeon grid to modify
 * @param options - Placement options
 * @param seed - Random seed for reproducibility
 * @returns Result with modified grid and placement info
 *
 * @example
 * ```ts
 * const dungeon = generateBSP(64);
 * const result = placePrefabs(dungeon, {
 *   prefabs: builtInPrefabs,
 *   maxPrefabs: 3,
 *   categories: ["treasure", "boss"]
 * });
 * console.log(`Placed ${result.placedPrefabs.length} prefabs`);
 * ```
 */
export function placePrefabs(
  grid: Grid,
  options: PrefabPlacementOptions,
  seed?: number
): PrefabPlacementResult {
  const random = createSeededRandom(seed);
  const resultGrid = grid.map((row) => [...row]);
  const placedPrefabs: PlacedPrefab[] = [];
  const failedPrefabs: Prefab[] = [];

  const padding = options.padding ?? 1;
  const minDistance = options.minDistance ?? 5;
  const dungeonArea = grid.length * (grid[0]?.length ?? 0);
  const maxPrefabs = options.maxPrefabs ?? Math.floor(Math.sqrt(dungeonArea) / 10);

  // Filter available prefabs
  const availablePrefabs = filterPrefabs(options.prefabs, options);

  if (availablePrefabs.length === 0) {
    return { grid: resultGrid, placedPrefabs, failedPrefabs: options.prefabs };
  }

  // Try to place prefabs
  let attempts = 0;
  const maxAttempts = maxPrefabs * 10;

  while (placedPrefabs.length < maxPrefabs && attempts < maxAttempts) {
    attempts++;

    // Select a random prefab
    const prefab = selectWeightedPrefab(availablePrefabs, random);

    // Determine transformation
    const allowRotation = prefab.allowRotation !== false;
    const allowMirror = prefab.allowMirror !== false;

    const rotations: (0 | 90 | 180 | 270)[] = allowRotation ? [0, 90, 180, 270] : [0];
    const rotation = rotations[Math.floor(random() * rotations.length)];
    const mirrored = allowMirror && random() < 0.5;

    // Transform prefab
    const transformed = transformPrefab(prefab, rotation, mirrored);

    // Find valid positions
    const validPositions = findValidPositions(
      resultGrid,
      transformed.width,
      transformed.height,
      placedPrefabs,
      padding,
      minDistance
    );

    if (validPositions.length === 0) {
      if (!failedPrefabs.includes(prefab)) {
        failedPrefabs.push(prefab);
      }
      continue;
    }

    // Select random position
    const position = validPositions[Math.floor(random() * validPositions.length)];

    // Place the prefab
    placePrefabOnGrid(resultGrid, transformed.grid, position);

    // Connect to dungeon
    if (options.ensureConnectivity !== false) {
      connectPrefabToDungeon(resultGrid, transformed.connections, position);
    }

    // Record placement
    placedPrefabs.push({
      prefab,
      position,
      rotation,
      mirrored,
      bounds: {
        x: position.x,
        y: position.y,
        width: transformed.width,
        height: transformed.height,
      },
    });
  }

  return { grid: resultGrid, placedPrefabs, failedPrefabs };
}

/**
 * Place a specific prefab at a specific position
 *
 * @param grid - The dungeon grid to modify (mutated in place)
 * @param prefab - The prefab to place
 * @param position - Where to place it
 * @param rotation - Rotation in degrees
 * @param mirror - Whether to mirror horizontally
 * @returns The placed prefab info, or null if placement failed
 */
export function placePrefabAt(
  grid: Grid,
  prefab: Prefab,
  position: Point,
  rotation: 0 | 90 | 180 | 270 = 0,
  mirror: boolean = false
): PlacedPrefab | null {
  const transformed = transformPrefab(prefab, rotation, mirror);

  if (!canPlacePrefab(grid, transformed.grid, position, 0)) {
    return null;
  }

  placePrefabOnGrid(grid, transformed.grid, position);

  return {
    prefab,
    position,
    rotation,
    mirrored: mirror,
    bounds: {
      x: position.x,
      y: position.y,
      width: transformed.width,
      height: transformed.height,
    },
  };
}
