import type { Grid, Point, Rect, Room } from "../types";
import { TileType, RoomSize, RoomType } from "../types";
import { cloneGrid } from "./grid";

export interface FeaturePlacementOptions {
  /** Chance to place stairs (0-1, default: 0.3) */
  stairsChance?: number;
  /** Chance to place treasure per room (0-1, default: 0.2) */
  treasureChance?: number;
  /** Chance to place a trap per room (0-1, default: 0.15) */
  trapChance?: number;
  /** Chance to place water features (0-1, default: 0.1) */
  waterChance?: number;
  /** Max treasures per dungeon (default: 3) */
  maxTreasures?: number;
  /** Max traps per dungeon (default: 5) */
  maxTraps?: number;
  /** Guarantee at least one stairs up and down (default: true) */
  guaranteeStairs?: boolean;
  /** Minimum distance between features of the same type (default: 3) */
  minFeatureDistance?: number;
  /** Minimum distance between any features (default: 2) */
  minAnyFeatureDistance?: number;
}

/**
 * Find all floor tiles in the grid
 */
export function findFloorTiles(grid: Grid): Point[] {
  const floors: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === TileType.FLOOR) {
        floors.push({ x, y });
      }
    }
  }
  return floors;
}

/**
 * Find floor tiles that are not adjacent to walls (interior tiles)
 */
export function findInteriorFloors(grid: Grid): Point[] {
  const floors: Point[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      // Check all 4 neighbors are also floor-like
      const neighbors = [
        grid[y - 1][x],
        grid[y + 1][x],
        grid[y][x - 1],
        grid[y][x + 1],
      ];

      const allFloorLike = neighbors.every(
        (n) =>
          n === TileType.FLOOR ||
          n === TileType.CORRIDOR ||
          n === TileType.DOOR
      );

      if (allFloorLike) {
        floors.push({ x, y });
      }
    }
  }
  return floors;
}

/**
 * Find corner tiles (floor tiles with exactly 2 adjacent walls in an L shape)
 */
export function findCornerTiles(grid: Grid): Point[] {
  const corners: Point[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      const top = grid[y - 1][x] === TileType.WALL;
      const bottom = grid[y + 1][x] === TileType.WALL;
      const left = grid[y][x - 1] === TileType.WALL;
      const right = grid[y][x + 1] === TileType.WALL;

      // Check for L-shaped wall patterns
      if (
        (top && left) ||
        (top && right) ||
        (bottom && left) ||
        (bottom && right)
      ) {
        corners.push({ x, y });
      }
    }
  }
  return corners;
}

/**
 * Find dead-end corridors (corridors with 3 walls around them)
 */
export function findDeadEnds(grid: Grid): Point[] {
  const deadEnds: Point[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] !== TileType.CORRIDOR) continue;

      const wallCount = [
        grid[y - 1][x] === TileType.WALL,
        grid[y + 1][x] === TileType.WALL,
        grid[y][x - 1] === TileType.WALL,
        grid[y][x + 1] === TileType.WALL,
      ].filter(Boolean).length;

      if (wallCount === 3) {
        deadEnds.push({ x, y });
      }
    }
  }
  return deadEnds;
}

/**
 * Get distance from a point to the nearest wall
 */
function distanceToWall(grid: Grid, x: number, y: number): number {
  let distance = 0;
  const maxDist = Math.max(grid.length, grid[0].length);

  while (distance < maxDist) {
    distance++;
    for (let dy = -distance; dy <= distance; dy++) {
      for (let dx = -distance; dx <= distance; dx++) {
        if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
          if (grid[ny][nx] === TileType.WALL) {
            return distance;
          }
        }
      }
    }
  }
  return maxDist;
}

/**
 * Find the most central floor tile in the grid
 */
export function findCentralFloor(grid: Grid): Point | null {
  const floors = findFloorTiles(grid);
  if (floors.length === 0) return null;

  let bestPoint: Point | null = null;
  let maxDist = -1;

  for (const floor of floors) {
    const dist = distanceToWall(grid, floor.x, floor.y);
    if (dist > maxDist) {
      maxDist = dist;
      bestPoint = floor;
    }
  }

  return bestPoint;
}

/**
 * Shuffle array in place using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Calculate Manhattan distance between two points
 */
function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a point is at least minDistance away from all points in the list
 */
function hasMinDistance(point: Point, placed: Point[], minDistance: number): boolean {
  for (const p of placed) {
    if (manhattanDistance(point, p) < minDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Feature types for tracking placed features
 */
type FeatureCategory = "stairs" | "treasure" | "trap" | "water";

/**
 * Place dungeon features (stairs, treasures, traps, water) on a grid
 * with improved spacing to prevent clustering
 *
 * Note: This function creates a copy of the grid and does not mutate the original.
 */
export function placeFeatures(
  inputGrid: Grid,
  options: FeaturePlacementOptions = {}
): Grid {
  const {
    stairsChance = 0.3,
    treasureChance = 0.2,
    trapChance = 0.15,
    waterChance = 0.1,
    maxTreasures = 3,
    maxTraps = 5,
    guaranteeStairs = true,
    minFeatureDistance = 3,
    minAnyFeatureDistance = 2,
  } = options;

  // Clone the grid to avoid mutating the original
  const grid = cloneGrid(inputGrid);

  // Find suitable locations
  const floors = shuffleArray([...findFloorTiles(grid)]);
  const corners = shuffleArray([...findCornerTiles(grid)]);
  const deadEnds = shuffleArray([...findDeadEnds(grid)]);
  const interiors = shuffleArray([...findInteriorFloors(grid)]);

  // Track placed features by category for distance enforcement
  const placedByCategory: Record<FeatureCategory, Point[]> = {
    stairs: [],
    treasure: [],
    trap: [],
    water: [],
  };

  // Get all placed features as a flat array
  const getAllPlaced = (): Point[] => [
    ...placedByCategory.stairs,
    ...placedByCategory.treasure,
    ...placedByCategory.trap,
    ...placedByCategory.water,
  ];

  let treasuresPlaced = 0;
  let trapsPlaced = 0;
  let stairsUpPlaced = false;
  let stairsDownPlaced = false;

  // Place stairs - prefer corners or dead ends, spread apart
  const stairsLocations = [...corners, ...deadEnds, ...floors];
  for (const loc of stairsLocations) {
    if (stairsUpPlaced && stairsDownPlaced) break;

    // Check minimum distance from all features
    if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

    if (!stairsUpPlaced && (guaranteeStairs || Math.random() < stairsChance)) {
      grid[loc.y][loc.x] = TileType.STAIRS_UP;
      placedByCategory.stairs.push(loc);
      stairsUpPlaced = true;
      continue;
    }

    if (!stairsDownPlaced && (guaranteeStairs || Math.random() < stairsChance)) {
      // Ensure stairs down is well-separated from stairs up
      if (!hasMinDistance(loc, placedByCategory.stairs, minFeatureDistance)) continue;

      if (grid[loc.y][loc.x] === TileType.FLOOR) {
        grid[loc.y][loc.x] = TileType.STAIRS_DOWN;
        placedByCategory.stairs.push(loc);
        stairsDownPlaced = true;
      }
    }
  }

  // Place treasures - prefer dead ends and corners, spread evenly
  const treasureLocations = [...deadEnds, ...corners, ...interiors];
  for (const loc of treasureLocations) {
    if (treasuresPlaced >= maxTreasures) break;
    if (grid[loc.y][loc.x] !== TileType.FLOOR) continue;

    // Check minimum distance from same type and all features
    if (!hasMinDistance(loc, placedByCategory.treasure, minFeatureDistance)) continue;
    if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

    if (Math.random() < treasureChance) {
      grid[loc.y][loc.x] = Math.random() < 0.5 ? TileType.TREASURE : TileType.CHEST;
      placedByCategory.treasure.push(loc);
      treasuresPlaced++;
    }
  }

  // Place traps - prefer corridors and floor tiles, with good spacing
  for (const loc of floors) {
    if (trapsPlaced >= maxTraps) break;
    if (grid[loc.y][loc.x] !== TileType.FLOOR && grid[loc.y][loc.x] !== TileType.CORRIDOR) continue;

    // Enforce minimum distance between traps (prevents clustering)
    if (!hasMinDistance(loc, placedByCategory.trap, minFeatureDistance)) continue;
    // Also check distance from all other features
    if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

    if (Math.random() < trapChance) {
      grid[loc.y][loc.x] = Math.random() < 0.6 ? TileType.TRAP : TileType.TRAP_PIT;
      placedByCategory.trap.push(loc);
      trapsPlaced++;
    }
  }

  // Place water features - prefer interior spaces
  if (interiors.length > 3 && Math.random() < waterChance) {
    // Find an interior tile that's away from other features
    let waterCenter: Point | null = null;
    for (const loc of interiors) {
      if (hasMinDistance(loc, getAllPlaced(), minFeatureDistance)) {
        waterCenter = loc;
        break;
      }
    }

    if (waterCenter) {
      const waterType = Math.random() < 0.7 ? TileType.WATER :
                        Math.random() < 0.5 ? TileType.DEEP_WATER : TileType.LAVA;

      grid[waterCenter.y][waterCenter.x] = waterType;
      placedByCategory.water.push(waterCenter);

      // Expand to adjacent floor tiles
      const neighbors = [
        { x: waterCenter.x, y: waterCenter.y - 1 },
        { x: waterCenter.x, y: waterCenter.y + 1 },
        { x: waterCenter.x - 1, y: waterCenter.y },
        { x: waterCenter.x + 1, y: waterCenter.y },
      ];

      for (const n of neighbors) {
        if (
          n.y >= 0 &&
          n.y < grid.length &&
          n.x >= 0 &&
          n.x < grid[0].length &&
          grid[n.y][n.x] === TileType.FLOOR &&
          Math.random() < 0.5
        ) {
          grid[n.y][n.x] = waterType;
          placedByCategory.water.push(n);
        }
      }
    }
  }

  return grid;
}

/**
 * Place a pit in a room (useful for arena-style rooms)
 */
export function placePit(grid: Grid, room: Rect): boolean {
  const cx = room.x + Math.floor(room.width / 2);
  const cy = room.y + Math.floor(room.height / 2);

  if (grid[cy][cx] === TileType.FLOOR) {
    grid[cy][cx] = TileType.PIT;
    return true;
  }
  return false;
}

export interface RoomAwareFeatureOptions extends FeaturePlacementOptions {
  /** Place treasures preferentially in larger rooms (default: true) */
  treasureInLargeRooms?: boolean;
  /** Place traps in corridors and small rooms (default: true) */
  trapsInCorridors?: boolean;
  /** Place stairs at room edges (default: true) */
  stairsAtEdges?: boolean;
  /** Skip placing features in entrance rooms (default: false) */
  safeEntrance?: boolean;
  /** Skip placing features in treasure rooms (auto-placed treasure) (default: true) */
  autoTreasureRoom?: boolean;
}

/**
 * Get floor tiles within a specific room
 */
function getRoomFloorTiles(grid: Grid, room: Room): Point[] {
  return room.tiles.filter(tile => {
    const tileType = grid[tile.y][tile.x];
    return tileType === TileType.FLOOR;
  });
}

/**
 * Get edge tiles (adjacent to walls) within a room
 */
function getRoomEdgeTiles(grid: Grid, room: Room): Point[] {
  return room.tiles.filter(tile => {
    if (grid[tile.y][tile.x] !== TileType.FLOOR) return false;

    // Check if any neighbor is a wall
    const neighbors = [
      [tile.x - 1, tile.y],
      [tile.x + 1, tile.y],
      [tile.x, tile.y - 1],
      [tile.x, tile.y + 1],
    ];

    return neighbors.some(([nx, ny]) => {
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return true;
      return grid[ny][nx] === TileType.WALL;
    });
  });
}

/**
 * Get corner tiles within a room (tiles with 2 adjacent walls in L-shape)
 */
function getRoomCornerTiles(grid: Grid, room: Room): Point[] {
  return room.tiles.filter(tile => {
    if (grid[tile.y][tile.x] !== TileType.FLOOR) return false;

    const top = tile.y > 0 && grid[tile.y - 1][tile.x] === TileType.WALL;
    const bottom = tile.y < grid.length - 1 && grid[tile.y + 1][tile.x] === TileType.WALL;
    const left = tile.x > 0 && grid[tile.y][tile.x - 1] === TileType.WALL;
    const right = tile.x < grid[0].length - 1 && grid[tile.y][tile.x + 1] === TileType.WALL;

    return (top && left) || (top && right) || (bottom && left) || (bottom && right);
  });
}

/**
 * Place features with room awareness
 *
 * This function considers room metadata to make smarter placement decisions:
 * - Treasures are placed preferentially in larger rooms and treasure rooms
 * - Traps are placed in corridors and guard rooms
 * - Stairs are placed at room edges
 * - Entrance rooms can be kept safe
 *
 * Note: This function creates a copy of the grid and does not mutate the original.
 */
export function placeFeaturesWithRooms(
  inputGrid: Grid,
  rooms: Room[],
  options: RoomAwareFeatureOptions = {}
): Grid {
  const {
    stairsChance = 0.3,
    treasureChance = 0.2,
    trapChance = 0.15,
    waterChance = 0.1,
    maxTreasures = 3,
    maxTraps = 5,
    guaranteeStairs = true,
    minFeatureDistance = 3,
    minAnyFeatureDistance = 2,
    treasureInLargeRooms = true,
    trapsInCorridors = true,
    stairsAtEdges = true,
    safeEntrance = false,
    autoTreasureRoom = true,
  } = options;

  // Clone the grid to avoid mutating the original
  const grid = cloneGrid(inputGrid);

  if (rooms.length === 0) {
    // Fall back to non-room-aware placement
    return placeFeatures(grid, options);
  }

  // Track placed features by category for distance enforcement
  const placedByCategory: Record<FeatureCategory, Point[]> = {
    stairs: [],
    treasure: [],
    trap: [],
    water: [],
  };

  const getAllPlaced = (): Point[] => [
    ...placedByCategory.stairs,
    ...placedByCategory.treasure,
    ...placedByCategory.trap,
    ...placedByCategory.water,
  ];

  let treasuresPlaced = 0;
  let trapsPlaced = 0;
  let stairsUpPlaced = false;
  let stairsDownPlaced = false;

  // Sort rooms by area for treasure placement (largest first)
  const roomsBySize = [...rooms].sort((a, b) => b.area - a.area);

  // Get treasure rooms
  const treasureRooms = rooms.filter(r => r.type === RoomType.TREASURE);

  // Get rooms that can receive features
  const featureRooms = rooms.filter(r => {
    if (safeEntrance && r.type === RoomType.ENTRANCE) return false;
    return true;
  });

  // === STAIRS PLACEMENT ===
  // Place stairs at edges of rooms, preferably in different rooms
  const stairsRooms = shuffleArray([...featureRooms]);

  for (const room of stairsRooms) {
    if (stairsUpPlaced && stairsDownPlaced) break;

    const edgeTiles = stairsAtEdges
      ? shuffleArray(getRoomEdgeTiles(grid, room))
      : shuffleArray(getRoomFloorTiles(grid, room));
    const cornerTiles = shuffleArray(getRoomCornerTiles(grid, room));
    const candidates = [...cornerTiles, ...edgeTiles];

    for (const loc of candidates) {
      if (stairsUpPlaced && stairsDownPlaced) break;
      if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

      if (!stairsUpPlaced && (guaranteeStairs || Math.random() < stairsChance)) {
        if (grid[loc.y][loc.x] === TileType.FLOOR) {
          grid[loc.y][loc.x] = TileType.STAIRS_UP;
          placedByCategory.stairs.push(loc);
          stairsUpPlaced = true;
          break; // Move to next room for stairs down
        }
      }
    }
  }

  // Place stairs down in a different room if possible
  const stairsDownRooms = stairsRooms.filter(r => {
    // Avoid placing in same room as stairs up
    return !placedByCategory.stairs.some(s =>
      r.tiles.some(t => t.x === s.x && t.y === s.y)
    );
  });

  for (const room of stairsDownRooms.length > 0 ? stairsDownRooms : stairsRooms) {
    if (stairsDownPlaced) break;

    const edgeTiles = stairsAtEdges
      ? shuffleArray(getRoomEdgeTiles(grid, room))
      : shuffleArray(getRoomFloorTiles(grid, room));
    const cornerTiles = shuffleArray(getRoomCornerTiles(grid, room));
    const candidates = [...cornerTiles, ...edgeTiles];

    for (const loc of candidates) {
      if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;
      if (!hasMinDistance(loc, placedByCategory.stairs, minFeatureDistance)) continue;

      if (!stairsDownPlaced && (guaranteeStairs || Math.random() < stairsChance)) {
        if (grid[loc.y][loc.x] === TileType.FLOOR) {
          grid[loc.y][loc.x] = TileType.STAIRS_DOWN;
          placedByCategory.stairs.push(loc);
          stairsDownPlaced = true;
          break;
        }
      }
    }
  }

  // === TREASURE PLACEMENT ===
  // Auto-place treasure in designated treasure rooms
  if (autoTreasureRoom) {
    for (const room of treasureRooms) {
      if (treasuresPlaced >= maxTreasures) break;

      const floorTiles = shuffleArray(getRoomFloorTiles(grid, room));
      for (const loc of floorTiles) {
        if (treasuresPlaced >= maxTreasures) break;
        if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

        grid[loc.y][loc.x] = TileType.CHEST;
        placedByCategory.treasure.push(loc);
        treasuresPlaced++;
        break; // One treasure per treasure room
      }
    }
  }

  // Place remaining treasures in larger rooms if enabled
  if (treasureInLargeRooms) {
    const largeRooms = roomsBySize.filter(r =>
      r.size === RoomSize.LARGE ||
      r.size === RoomSize.HUGE ||
      r.size === RoomSize.MEDIUM
    );

    for (const room of largeRooms) {
      if (treasuresPlaced >= maxTreasures) break;
      if (safeEntrance && room.type === RoomType.ENTRANCE) continue;

      const cornerTiles = shuffleArray(getRoomCornerTiles(grid, room));
      const floorTiles = shuffleArray(getRoomFloorTiles(grid, room));
      const candidates = [...cornerTiles, ...floorTiles];

      for (const loc of candidates) {
        if (treasuresPlaced >= maxTreasures) break;
        if (grid[loc.y][loc.x] !== TileType.FLOOR) continue;
        if (!hasMinDistance(loc, placedByCategory.treasure, minFeatureDistance)) continue;
        if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

        if (Math.random() < treasureChance) {
          grid[loc.y][loc.x] = Math.random() < 0.5 ? TileType.TREASURE : TileType.CHEST;
          placedByCategory.treasure.push(loc);
          treasuresPlaced++;
        }
      }
    }
  }

  // === TRAP PLACEMENT ===
  // Place traps preferentially in guard rooms and smaller rooms
  const trapRooms = trapsInCorridors
    ? rooms.filter(r => r.type === RoomType.GUARD || r.size === RoomSize.TINY || r.size === RoomSize.SMALL)
    : featureRooms;

  const trapCandidateRooms = shuffleArray([...trapRooms, ...featureRooms]);

  for (const room of trapCandidateRooms) {
    if (trapsPlaced >= maxTraps) break;
    if (safeEntrance && room.type === RoomType.ENTRANCE) continue;

    const floorTiles = shuffleArray(getRoomFloorTiles(grid, room));

    for (const loc of floorTiles) {
      if (trapsPlaced >= maxTraps) break;
      if (grid[loc.y][loc.x] !== TileType.FLOOR) continue;
      if (!hasMinDistance(loc, placedByCategory.trap, minFeatureDistance)) continue;
      if (!hasMinDistance(loc, getAllPlaced(), minAnyFeatureDistance)) continue;

      if (Math.random() < trapChance) {
        grid[loc.y][loc.x] = Math.random() < 0.6 ? TileType.TRAP : TileType.TRAP_PIT;
        placedByCategory.trap.push(loc);
        trapsPlaced++;
      }
    }
  }

  // === WATER PLACEMENT ===
  // Place water in larger rooms
  if (Math.random() < waterChance) {
    const waterRooms = roomsBySize.filter(r =>
      (r.size === RoomSize.MEDIUM || r.size === RoomSize.LARGE || r.size === RoomSize.HUGE) &&
      !(safeEntrance && r.type === RoomType.ENTRANCE)
    );

    for (const room of waterRooms) {
      const interiorTiles = room.tiles.filter(tile => {
        if (grid[tile.y][tile.x] !== TileType.FLOOR) return false;

        // Check all 4 neighbors are also floor-like
        const neighbors = [
          grid[tile.y - 1]?.[tile.x],
          grid[tile.y + 1]?.[tile.x],
          grid[tile.y]?.[tile.x - 1],
          grid[tile.y]?.[tile.x + 1],
        ];

        return neighbors.every(n => n !== undefined && n !== TileType.WALL);
      });

      if (interiorTiles.length < 3) continue;

      const shuffledInterior = shuffleArray([...interiorTiles]);
      let waterCenter: Point | null = null;

      for (const loc of shuffledInterior) {
        if (hasMinDistance(loc, getAllPlaced(), minFeatureDistance)) {
          waterCenter = loc;
          break;
        }
      }

      if (waterCenter) {
        const waterType = Math.random() < 0.7 ? TileType.WATER :
                          Math.random() < 0.5 ? TileType.DEEP_WATER : TileType.LAVA;

        grid[waterCenter.y][waterCenter.x] = waterType;
        placedByCategory.water.push(waterCenter);

        // Expand to adjacent floor tiles
        const neighbors = [
          { x: waterCenter.x, y: waterCenter.y - 1 },
          { x: waterCenter.x, y: waterCenter.y + 1 },
          { x: waterCenter.x - 1, y: waterCenter.y },
          { x: waterCenter.x + 1, y: waterCenter.y },
        ];

        for (const n of neighbors) {
          if (
            n.y >= 0 &&
            n.y < grid.length &&
            n.x >= 0 &&
            n.x < grid[0].length &&
            grid[n.y][n.x] === TileType.FLOOR &&
            Math.random() < 0.5
          ) {
            grid[n.y][n.x] = waterType;
            placedByCategory.water.push(n);
          }
        }
        break; // Only one water feature
      }
    }
  }

  return grid;
}
