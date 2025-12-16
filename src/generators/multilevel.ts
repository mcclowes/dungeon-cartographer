import type { Grid, Point } from "../types";
import { TileType } from "../types";
import { createGrid, randomInt, validateGridSize, cloneGrid } from "../utils";
import { generateBSP, type BSPOptions } from "./bsp";
import { generateCave, type CaveOptions } from "./cave";
import { generateVoronoi, type VoronoiOptions } from "./voronoi";
import { generatePoisson, type PoissonOptions } from "./poisson";
import { isFullyConnected } from "../utils/pathfinding";

export type LevelGenerator = "bsp" | "cave" | "voronoi" | "poisson";

export interface LevelConfig {
  /** Generator to use for this level */
  generator: LevelGenerator;
  /** Generator-specific options */
  options?: BSPOptions | CaveOptions | VoronoiOptions | PoissonOptions;
  /** Name/label for this level */
  name?: string;
}

export interface MultiLevelOptions {
  /** Configuration for each level (default: 3 BSP levels) */
  levels?: LevelConfig[];
  /** Number of levels if not specifying individual configs (default: 3) */
  numLevels?: number;
  /** Number of stair connections between each level pair (default: 2) */
  stairsPerConnection?: number;
  /** Minimum distance between stairs on the same level (default: 8) */
  minStairDistance?: number;
  /** Ensure all levels are fully connected (default: true) */
  ensureConnectivity?: boolean;
}

export interface MultiLevelResult {
  /** Array of level grids, index 0 is top level */
  levels: Grid[];
  /** Stair connections between levels */
  connections: StairConnection[];
  /** Level names/labels */
  levelNames: string[];
}

export interface StairConnection {
  /** Level index for the upper floor */
  upperLevel: number;
  /** Level index for the lower floor */
  lowerLevel: number;
  /** Position of stairs going down on upper level */
  upperPosition: Point;
  /** Position of stairs going up on lower level */
  lowerPosition: Point;
}

function generateLevel(size: number, config: LevelConfig): Grid {
  switch (config.generator) {
    case "cave":
      return generateCave(size, config.options as CaveOptions);
    case "voronoi":
      return generateVoronoi(size, config.options as VoronoiOptions);
    case "poisson":
      return generatePoisson(size, config.options as PoissonOptions);
    case "bsp":
    default:
      return generateBSP(size, config.options as BSPOptions);
  }
}

function findStairCandidates(grid: Grid, minDistance: number, existingStairs: Point[]): Point[] {
  const candidates: Point[] = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const tile = grid[y][x];

      // Must be a floor tile (not corridor, door, or existing feature)
      if (tile !== TileType.FLOOR) continue;

      // Check we have floor neighbors (not at edge of room)
      const hasFloorNeighbors =
        grid[y - 1]?.[x] === TileType.FLOOR &&
        grid[y + 1]?.[x] === TileType.FLOOR &&
        grid[y]?.[x - 1] === TileType.FLOOR &&
        grid[y]?.[x + 1] === TileType.FLOOR;

      if (!hasFloorNeighbors) continue;

      // Check distance from existing stairs
      const tooClose = existingStairs.some(
        (s) => Math.abs(s.x - x) + Math.abs(s.y - y) < minDistance
      );

      if (!tooClose) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}

function placeStairs(
  upperLevel: Grid,
  lowerLevel: Grid,
  numStairs: number,
  minDistance: number
): StairConnection[] {
  const connections: StairConnection[] = [];
  const upperStairs: Point[] = [];
  const lowerStairs: Point[] = [];

  for (let i = 0; i < numStairs; i++) {
    // Find candidates on upper level
    const upperCandidates = findStairCandidates(upperLevel, minDistance, upperStairs);
    if (upperCandidates.length === 0) continue;

    // Find candidates on lower level
    const lowerCandidates = findStairCandidates(lowerLevel, minDistance, lowerStairs);
    if (lowerCandidates.length === 0) continue;

    // Try to place stairs at similar positions if possible
    const upperPos = upperCandidates[randomInt(upperCandidates.length - 1, 0)];

    // Find closest candidate on lower level
    let bestLower = lowerCandidates[0];
    let bestDist = Infinity;

    for (const candidate of lowerCandidates) {
      const dist = Math.abs(candidate.x - upperPos.x) + Math.abs(candidate.y - upperPos.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestLower = candidate;
      }
    }

    // If no close match, pick a random one
    const lowerPos =
      bestDist < 15 ? bestLower : lowerCandidates[randomInt(lowerCandidates.length - 1, 0)];

    // Place the stairs
    upperLevel[upperPos.y][upperPos.x] = TileType.STAIRS_DOWN;
    lowerLevel[lowerPos.y][lowerPos.x] = TileType.STAIRS_UP;

    upperStairs.push(upperPos);
    lowerStairs.push(lowerPos);

    connections.push({
      upperLevel: 0, // Will be set correctly by caller
      lowerLevel: 0,
      upperPosition: upperPos,
      lowerPosition: lowerPos,
    });
  }

  return connections;
}

/**
 * Generate a multi-level dungeon with connected floors
 *
 * Creates multiple dungeon levels with stairs connecting them.
 * Each level can use a different generator algorithm.
 *
 * @param size - Grid size for each level (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Multi-level dungeon result with grids and stair connections
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const result = generateMultiLevel(50, {
 *   levels: [
 *     { generator: "bsp", name: "Surface Level" },
 *     { generator: "cave", name: "Natural Caverns" },
 *     { generator: "voronoi", name: "Ancient Ruins" },
 *   ],
 *   stairsPerConnection: 2,
 * });
 * ```
 */
export function generateMultiLevel(
  size: number,
  options: MultiLevelOptions = {}
): MultiLevelResult {
  validateGridSize(size, "generateMultiLevel");

  const {
    numLevels = 3,
    stairsPerConnection = 2,
    minStairDistance = 8,
    ensureConnectivity = true,
  } = options;

  // Build level configurations
  const levelConfigs: LevelConfig[] = options.levels ?? [];

  if (levelConfigs.length === 0) {
    // Default: BSP for first level, mix of others for deeper levels
    const generators: LevelGenerator[] = ["bsp", "cave", "voronoi", "poisson"];
    for (let i = 0; i < numLevels; i++) {
      levelConfigs.push({
        generator: generators[i % generators.length],
        name: `Level ${i + 1}`,
        options: { addFeatures: true },
      });
    }
  }

  // Generate each level
  const levels: Grid[] = [];
  const levelNames: string[] = [];
  const maxAttempts = 5;

  for (let i = 0; i < levelConfigs.length; i++) {
    const config = levelConfigs[i];
    let grid: Grid | null = null;

    // Try to generate a connected level
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      grid = generateLevel(size, config);

      if (!ensureConnectivity || isFullyConnected(grid)) {
        break;
      }
    }

    if (!grid) {
      grid = createGrid(size, size, TileType.WALL);
    }

    levels.push(grid);
    levelNames.push(config.name ?? `Level ${i + 1}`);
  }

  // Connect levels with stairs
  const allConnections: StairConnection[] = [];

  for (let i = 0; i < levels.length - 1; i++) {
    const connections = placeStairs(
      levels[i],
      levels[i + 1],
      stairsPerConnection,
      minStairDistance
    );

    // Set correct level indices
    for (const conn of connections) {
      conn.upperLevel = i;
      conn.lowerLevel = i + 1;
      allConnections.push(conn);
    }
  }

  return {
    levels,
    connections: allConnections,
    levelNames,
  };
}

/**
 * Get a specific level from a multi-level result
 */
export function getLevel(result: MultiLevelResult, index: number): Grid | null {
  if (index < 0 || index >= result.levels.length) return null;
  return cloneGrid(result.levels[index]);
}

/**
 * Find stairs on a specific level
 */
export function findStairsOnLevel(
  result: MultiLevelResult,
  levelIndex: number
): { up: Point[]; down: Point[] } {
  const up: Point[] = [];
  const down: Point[] = [];

  for (const conn of result.connections) {
    if (conn.upperLevel === levelIndex) {
      down.push(conn.upperPosition);
    }
    if (conn.lowerLevel === levelIndex) {
      up.push(conn.lowerPosition);
    }
  }

  return { up, down };
}
