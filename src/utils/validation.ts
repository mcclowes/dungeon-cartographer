import type { Grid, Point } from "../types";
import { TileType } from "../types";
import { analyzeConnectivity } from "./connectivity";

/**
 * Validation issue severity
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * A single validation issue found in the dungeon
 */
export interface ValidationIssue {
  /** Type of issue */
  type: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable description */
  message: string;
  /** Affected tiles (if applicable) */
  tiles?: Point[];
  /** Affected room IDs (if applicable) */
  roomIds?: number[];
}

/**
 * Result of dungeon validation
 */
export interface DungeonValidationResult {
  /** Whether the dungeon is valid (no errors) */
  valid: boolean;
  /** All issues found */
  issues: ValidationIssue[];
  /** Just errors */
  errors: ValidationIssue[];
  /** Just warnings */
  warnings: ValidationIssue[];
  /** Informational notes */
  info: ValidationIssue[];
  /** Summary statistics */
  stats: ValidationStats;
}

/**
 * Statistics about the dungeon
 */
export interface ValidationStats {
  /** Total walkable tiles */
  walkableTiles: number;
  /** Total wall tiles */
  wallTiles: number;
  /** Number of rooms detected */
  roomCount: number;
  /** Number of isolated rooms (unreachable) */
  isolatedRooms: number;
  /** Number of dead ends */
  deadEnds: number;
  /** Percentage of grid that is walkable */
  walkablePercent: number;
  /** Average room size */
  avgRoomSize: number;
  /** Largest room size */
  maxRoomSize: number;
  /** Smallest room size */
  minRoomSize: number;
}

/**
 * Options for validation
 */
export interface ValidationOptions {
  /** Minimum acceptable walkable percentage (default: 10) */
  minWalkablePercent?: number;
  /** Maximum acceptable walkable percentage (default: 70) */
  maxWalkablePercent?: number;
  /** Minimum room size to be considered valid (default: 4) */
  minRoomSize?: number;
  /** Maximum allowed dead ends (default: unlimited) */
  maxDeadEnds?: number;
  /** Whether isolated rooms are errors (default: true) */
  isolatedRoomsAreErrors?: boolean;
  /** Minimum number of rooms (default: 1) */
  minRooms?: number;
  /** Check for unreachable areas (default: true) */
  checkConnectivity?: boolean;
  /** Check for dead ends (default: true) */
  checkDeadEnds?: boolean;
  /** Check dungeon density (default: true) */
  checkDensity?: boolean;
}

const WALKABLE_TILES = new Set([
  TileType.FLOOR,
  TileType.DOOR,
  TileType.SECRET_DOOR,
  TileType.CORRIDOR,
  TileType.STAIRS_UP,
  TileType.STAIRS_DOWN,
  TileType.TREASURE,
  TileType.CHEST,
  TileType.TRAP,
  TileType.TRAP_PIT,
  TileType.CARPET,
  TileType.ALTAR,
]);

/**
 * Check if a tile is walkable
 */
function isWalkable(tile: number): boolean {
  return WALKABLE_TILES.has(tile);
}

/**
 * Count walkable and wall tiles
 */
function countTiles(grid: Grid): { walkable: number; walls: number; total: number } {
  let walkable = 0;
  let walls = 0;

  for (const row of grid) {
    for (const tile of row) {
      if (isWalkable(tile)) {
        walkable++;
      } else if (tile === TileType.WALL) {
        walls++;
      }
    }
  }

  return { walkable, walls, total: grid.length * (grid[0]?.length ?? 0) };
}

/**
 * Find dead ends (walkable tiles with only one walkable neighbor)
 */
function findDeadEnds(grid: Grid): Point[] {
  const deadEnds: Point[] = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isWalkable(grid[y][x])) continue;

      // Count walkable neighbors
      let walkableNeighbors = 0;
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
          if (isWalkable(grid[n.y][n.x])) {
            walkableNeighbors++;
          }
        }
      }

      if (walkableNeighbors === 1) {
        deadEnds.push({ x, y });
      }
    }
  }

  return deadEnds;
}

/**
 * Find all connected regions of walkable tiles using flood fill
 */
function findWalkableRegions(grid: Grid): Point[][] {
  const regions: Point[][] = [];
  const visited = new Set<string>();
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (!isWalkable(grid[y][x])) continue;

      // Flood fill from this tile
      const region: Point[] = [];
      const queue: Point[] = [{ x, y }];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = `${current.x},${current.y}`;

        if (visited.has(currentKey)) continue;
        if (current.x < 0 || current.x >= width || current.y < 0 || current.y >= height) continue;
        if (!isWalkable(grid[current.y][current.x])) continue;

        visited.add(currentKey);
        region.push(current);

        queue.push({ x: current.x - 1, y: current.y });
        queue.push({ x: current.x + 1, y: current.y });
        queue.push({ x: current.x, y: current.y - 1 });
        queue.push({ x: current.x, y: current.y + 1 });
      }

      if (region.length > 0) {
        regions.push(region);
      }
    }
  }

  return regions;
}

/**
 * Validate a dungeon grid and return detailed results
 *
 * @param grid - The dungeon grid to validate
 * @param options - Validation options
 * @returns Validation result with issues and statistics
 *
 * @example
 * ```ts
 * const dungeon = generateBSP(64);
 * const result = validateDungeon(dungeon);
 *
 * if (!result.valid) {
 *   console.log("Dungeon has errors:");
 *   for (const error of result.errors) {
 *     console.log(`- ${error.message}`);
 *   }
 * }
 *
 * console.log(`Stats: ${result.stats.roomCount} rooms, ${result.stats.deadEnds} dead ends`);
 * ```
 */
export function validateDungeon(
  grid: Grid,
  options: ValidationOptions = {}
): DungeonValidationResult {
  const {
    minWalkablePercent = 10,
    maxWalkablePercent = 70,
    minRoomSize = 4,
    maxDeadEnds,
    isolatedRoomsAreErrors = true,
    minRooms = 1,
    checkConnectivity = true,
    checkDeadEnds = true,
    checkDensity = true,
  } = options;

  const issues: ValidationIssue[] = [];

  // Count tiles
  const { walkable, walls, total } = countTiles(grid);
  const walkablePercent = total > 0 ? (walkable / total) * 100 : 0;

  // Analyze room connectivity
  const connectivity = analyzeConnectivity(grid, minRoomSize);
  const { rooms, adjacency } = connectivity;

  // Find isolated rooms
  const isolatedRooms: number[] = [];
  for (const room of rooms) {
    const neighbors = adjacency.get(room.id) ?? [];
    if (neighbors.length === 0) {
      isolatedRooms.push(room.id);
    }
  }

  // Find walkable regions (for overall connectivity check)
  const walkableRegions = findWalkableRegions(grid);

  // Find dead ends
  const deadEnds = findDeadEnds(grid);

  // Room size stats
  const roomSizes = rooms.map((r) => r.area);
  const avgRoomSize =
    roomSizes.length > 0 ? roomSizes.reduce((a, b) => a + b, 0) / roomSizes.length : 0;
  const maxRoomSize = roomSizes.length > 0 ? Math.max(...roomSizes) : 0;
  const minRoomSizeFound = roomSizes.length > 0 ? Math.min(...roomSizes) : 0;

  // === Validation checks ===

  // Check for empty dungeon
  if (walkable === 0) {
    issues.push({
      type: "empty_dungeon",
      severity: "error",
      message: "Dungeon has no walkable tiles",
    });
  }

  // Check density
  if (checkDensity) {
    if (walkablePercent < minWalkablePercent) {
      issues.push({
        type: "too_sparse",
        severity: "warning",
        message: `Dungeon is too sparse (${walkablePercent.toFixed(1)}% walkable, minimum ${minWalkablePercent}%)`,
      });
    }

    if (walkablePercent > maxWalkablePercent) {
      issues.push({
        type: "too_dense",
        severity: "warning",
        message: `Dungeon is too dense (${walkablePercent.toFixed(1)}% walkable, maximum ${maxWalkablePercent}%)`,
      });
    }
  }

  // Check room count
  if (rooms.length < minRooms) {
    issues.push({
      type: "insufficient_rooms",
      severity: "error",
      message: `Not enough rooms (found ${rooms.length}, minimum ${minRooms})`,
    });
  }

  // Check connectivity - multiple disconnected regions
  if (checkConnectivity && walkableRegions.length > 1) {
    const regionSizes = walkableRegions.map((r) => r.length).sort((a, b) => b - a);
    issues.push({
      type: "disconnected_regions",
      severity: "error",
      message: `Dungeon has ${walkableRegions.length} disconnected regions (sizes: ${regionSizes.join(", ")})`,
      tiles: walkableRegions.slice(1).flat(), // All tiles not in main region
    });
  }

  // Check isolated rooms
  if (checkConnectivity && isolatedRooms.length > 0) {
    const severity = isolatedRoomsAreErrors ? "error" : "warning";
    const isolatedTiles = isolatedRooms.flatMap((id) => {
      const room = rooms.find((r) => r.id === id);
      return room?.tiles ?? [];
    });

    issues.push({
      type: "isolated_rooms",
      severity,
      message: `${isolatedRooms.length} room(s) have no corridor connections`,
      roomIds: isolatedRooms,
      tiles: isolatedTiles,
    });
  }

  // Check dead ends
  if (checkDeadEnds && deadEnds.length > 0) {
    const severity =
      maxDeadEnds !== undefined && deadEnds.length > maxDeadEnds ? "warning" : "info";
    issues.push({
      type: "dead_ends",
      severity,
      message: `Found ${deadEnds.length} dead end(s)`,
      tiles: deadEnds,
    });
  }

  // Check for small rooms
  const tinyRooms = rooms.filter((r) => r.area < minRoomSize);
  if (tinyRooms.length > 0) {
    issues.push({
      type: "tiny_rooms",
      severity: "info",
      message: `${tinyRooms.length} room(s) smaller than minimum size (${minRoomSize} tiles)`,
      roomIds: tinyRooms.map((r) => r.id),
    });
  }

  // Categorize issues
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const info = issues.filter((i) => i.severity === "info");

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    info,
    stats: {
      walkableTiles: walkable,
      wallTiles: walls,
      roomCount: rooms.length,
      isolatedRooms: isolatedRooms.length,
      deadEnds: deadEnds.length,
      walkablePercent,
      avgRoomSize,
      maxRoomSize,
      minRoomSize: minRoomSizeFound,
    },
  };
}

/**
 * Quick check if a dungeon is valid (has no errors)
 */
export function isValidDungeon(grid: Grid, options?: ValidationOptions): boolean {
  return validateDungeon(grid, options).valid;
}

/**
 * Get just the statistics for a dungeon without full validation
 */
export function getDungeonStats(grid: Grid, minRoomSize: number = 4): ValidationStats {
  const { walkable, walls, total } = countTiles(grid);
  const connectivity = analyzeConnectivity(grid, minRoomSize);
  const deadEnds = findDeadEnds(grid);

  const isolatedCount = connectivity.rooms.filter((r) => {
    const neighbors = connectivity.adjacency.get(r.id) ?? [];
    return neighbors.length === 0;
  }).length;

  const roomSizes = connectivity.rooms.map((r) => r.area);

  return {
    walkableTiles: walkable,
    wallTiles: walls,
    roomCount: connectivity.rooms.length,
    isolatedRooms: isolatedCount,
    deadEnds: deadEnds.length,
    walkablePercent: total > 0 ? (walkable / total) * 100 : 0,
    avgRoomSize: roomSizes.length > 0 ? roomSizes.reduce((a, b) => a + b, 0) / roomSizes.length : 0,
    maxRoomSize: roomSizes.length > 0 ? Math.max(...roomSizes) : 0,
    minRoomSize: roomSizes.length > 0 ? Math.min(...roomSizes) : 0,
  };
}
