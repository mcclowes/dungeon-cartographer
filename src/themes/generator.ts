import type { Grid, Point } from "../types";
import { TileType } from "../types";
import { generateBSP } from "../generators/bsp";
import { generateCave } from "../generators/cave";
import { generateVoronoi } from "../generators/voronoi";
import { generatePoisson } from "../generators/poisson";
import { generateAgent } from "../generators/agent";
import { generateDLA } from "../generators/dla";
import { placePrefabs } from "../prefabs/placement";
import { builtInPrefabs } from "../prefabs/templates";
import { createSeededRandom } from "../utils/random";
import { themes } from "./configs";
import type {
  ThemeName,
  GeneratorType,
  ThemedDungeonOptions,
  ThemedDungeonResult,
  ThemePostProcess,
  ThemeFeatures,
} from "./types";

/**
 * Generate the base grid using the specified generator
 */
function generateBaseGrid(
  size: number,
  generator: GeneratorType,
  options: Record<string, unknown>
): Grid {
  switch (generator) {
    case "bsp":
      return generateBSP(size, options);
    case "cave":
      return generateCave(size, options);
    case "voronoi":
      return generateVoronoi(size, options);
    case "poisson":
      return generatePoisson(size, options);
    case "agent":
      return generateAgent(size, options);
    case "dla":
      return generateDLA(size, options);
    default:
      return generateBSP(size, options);
  }
}

/**
 * Find floor tiles adjacent to walls (room edges)
 */
function findRoomEdgeTiles(grid: Grid): Point[] {
  const edges: Point[] = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      // Check if adjacent to a wall
      const hasAdjacentWall =
        grid[y - 1][x] === TileType.WALL ||
        grid[y + 1][x] === TileType.WALL ||
        grid[y][x - 1] === TileType.WALL ||
        grid[y][x + 1] === TileType.WALL;

      if (hasAdjacentWall) {
        edges.push({ x, y });
      }
    }
  }

  return edges;
}

/**
 * Find tiles that connect two floor areas (doorway candidates)
 */
function findDoorwayCandidates(grid: Grid): Point[] {
  const candidates: Point[] = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tile = grid[y][x];
      if (tile !== TileType.FLOOR && tile !== TileType.CORRIDOR) continue;

      // Check for horizontal doorway pattern: wall-floor-wall vertically, floor-X-floor horizontally
      const isHorizontalDoorway =
        grid[y - 1][x] === TileType.WALL &&
        grid[y + 1][x] === TileType.WALL &&
        (grid[y][x - 1] === TileType.FLOOR || grid[y][x - 1] === TileType.CORRIDOR) &&
        (grid[y][x + 1] === TileType.FLOOR || grid[y][x + 1] === TileType.CORRIDOR);

      // Check for vertical doorway pattern
      const isVerticalDoorway =
        grid[y][x - 1] === TileType.WALL &&
        grid[y][x + 1] === TileType.WALL &&
        (grid[y - 1][x] === TileType.FLOOR || grid[y - 1][x] === TileType.CORRIDOR) &&
        (grid[y + 1][x] === TileType.FLOOR || grid[y + 1][x] === TileType.CORRIDOR);

      if (isHorizontalDoorway || isVerticalDoorway) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}

/**
 * Find floor tiles in room interiors (not on edges)
 */
function findInteriorTiles(grid: Grid): Point[] {
  const interior: Point[] = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      // Check all 8 neighbors are floor
      let allFloor = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (grid[y + dy][x + dx] !== TileType.FLOOR) {
            allFloor = false;
            break;
          }
        }
        if (!allFloor) break;
      }

      if (allFloor) {
        interior.push({ x, y });
      }
    }
  }

  return interior;
}

/**
 * Apply post-processing to the grid
 */
function applyPostProcess(grid: Grid, config: ThemePostProcess, random: () => number): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Add doors
  if (config.addDoors) {
    const doorwayCandidates = findDoorwayCandidates(grid);
    const doorProb = config.doorProbability ?? 0.5;

    for (const pos of doorwayCandidates) {
      if (random() < doorProb) {
        grid[pos.y][pos.x] = TileType.DOOR;
      }
    }
  }

  // Add secret doors
  if (config.addSecretDoors) {
    const edgeTiles = findRoomEdgeTiles(grid);
    const secretProb = config.secretDoorProbability ?? 0.05;

    for (const pos of edgeTiles) {
      if (grid[pos.y][pos.x] === TileType.FLOOR && random() < secretProb) {
        // Check if replacing with secret door makes sense
        // (adjacent to wall that could lead somewhere)
        const neighbors = [
          { x: pos.x - 1, y: pos.y },
          { x: pos.x + 1, y: pos.y },
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x, y: pos.y + 1 },
        ];

        for (const n of neighbors) {
          if (n.x > 0 && n.x < width - 1 && n.y > 0 && n.y < height - 1) {
            if (grid[n.y][n.x] === TileType.WALL) {
              grid[pos.y][pos.x] = TileType.SECRET_DOOR;
              break;
            }
          }
        }
      }
    }
  }

  // Add water
  if (config.addWater) {
    const coverage = config.waterCoverage ?? 0.1;
    const interiorTiles = findInteriorTiles(grid);

    // Use cellular automata style for natural water pools
    const waterSeeds = Math.floor(interiorTiles.length * coverage * 0.3);
    const shuffled = [...interiorTiles].sort(() => random() - 0.5);

    for (let i = 0; i < Math.min(waterSeeds, shuffled.length); i++) {
      const seed = shuffled[i];
      grid[seed.y][seed.x] = TileType.WATER;

      // Spread water to some neighbors
      const spreadChance = 0.6;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = seed.y + dy;
          const nx = seed.x + dx;
          if (ny > 0 && ny < height - 1 && nx > 0 && nx < width - 1) {
            if (grid[ny][nx] === TileType.FLOOR && random() < spreadChance) {
              grid[ny][nx] = TileType.WATER;
            }
          }
        }
      }
    }
  }

  // Add rubble
  if (config.addRubble) {
    const density = config.rubbleDensity ?? 0.05;
    const edgeTiles = findRoomEdgeTiles(grid);

    for (const pos of edgeTiles) {
      if (grid[pos.y][pos.x] === TileType.FLOOR && random() < density) {
        grid[pos.y][pos.x] = TileType.RUBBLE;
      }
    }
  }

  // Erode walls
  if (config.erodeWalls) {
    const iterations = config.erosionIterations ?? 1;

    for (let iter = 0; iter < iterations; iter++) {
      const toErode: Point[] = [];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (grid[y][x] !== TileType.WALL) continue;

          // Count floor neighbors
          let floorCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const tile = grid[y + dy][x + dx];
              if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
                floorCount++;
              }
            }
          }

          // Erode walls with many floor neighbors
          if (floorCount >= 5 && random() < 0.3) {
            toErode.push({ x, y });
          }
        }
      }

      for (const pos of toErode) {
        grid[pos.y][pos.x] = TileType.FLOOR;
      }
    }
  }
}

/**
 * Add decorative features to the grid
 */
function addFeatures(grid: Grid, config: ThemeFeatures, random: () => number): number {
  let featuresAdded = 0;
  const interiorTiles = findInteriorTiles(grid);
  const shuffled = [...interiorTiles].sort(() => random() - 0.5);

  let index = 0;

  // Add treasures
  if (config.treasure && index < shuffled.length) {
    const count = Math.floor(shuffled.length * config.treasure);
    for (let i = 0; i < count && index < shuffled.length; i++) {
      const pos = shuffled[index++];
      if (grid[pos.y][pos.x] === TileType.FLOOR) {
        grid[pos.y][pos.x] = random() < 0.3 ? TileType.CHEST : TileType.TREASURE;
        featuresAdded++;
      }
    }
  }

  // Add traps
  if (config.traps && index < shuffled.length) {
    const count = Math.floor(shuffled.length * config.traps);
    for (let i = 0; i < count && index < shuffled.length; i++) {
      const pos = shuffled[index++];
      if (grid[pos.y][pos.x] === TileType.FLOOR) {
        grid[pos.y][pos.x] = TileType.TRAP;
        featuresAdded++;
      }
    }
  }

  // Add statues
  if (config.statues && index < shuffled.length) {
    const count = Math.floor(shuffled.length * config.statues);
    for (let i = 0; i < count && index < shuffled.length; i++) {
      const pos = shuffled[index++];
      if (grid[pos.y][pos.x] === TileType.FLOOR) {
        grid[pos.y][pos.x] = TileType.STATUE;
        featuresAdded++;
      }
    }
  }

  // Add altars
  if (config.altars && index < shuffled.length) {
    const count = Math.floor(shuffled.length * config.altars);
    for (let i = 0; i < count && index < shuffled.length; i++) {
      const pos = shuffled[index++];
      if (grid[pos.y][pos.x] === TileType.FLOOR) {
        grid[pos.y][pos.x] = TileType.ALTAR;
        featuresAdded++;
      }
    }
  }

  // Add furniture (tables, chairs, etc.)
  if (config.furniture && index < shuffled.length) {
    const count = Math.floor(shuffled.length * config.furniture);
    const furnitureTypes = [
      TileType.TABLE,
      TileType.CHAIR,
      TileType.BOOKSHELF,
      TileType.CRATE,
      TileType.BARREL,
    ];

    for (let i = 0; i < count && index < shuffled.length; i++) {
      const pos = shuffled[index++];
      if (grid[pos.y][pos.x] === TileType.FLOOR) {
        grid[pos.y][pos.x] = furnitureTypes[Math.floor(random() * furnitureTypes.length)];
        featuresAdded++;
      }
    }
  }

  return featuresAdded;
}

/**
 * Generate a themed dungeon
 *
 * @param options - Generation options
 * @returns The generated dungeon with metadata
 *
 * @example
 * ```ts
 * // Generate a crypt dungeon
 * const result = generateThemedDungeon({
 *   size: 64,
 *   theme: "crypt"
 * });
 *
 * // Generate a castle with custom options
 * const castle = generateThemedDungeon({
 *   size: 80,
 *   theme: "castle",
 *   seed: 12345,
 *   prefabs: { maxPrefabs: 5 }
 * });
 * ```
 */
export function generateThemedDungeon(options: ThemedDungeonOptions): ThemedDungeonResult {
  const { size, theme, seed, level = 1 } = options;

  // Get theme config
  const themeConfig = themes[theme];
  if (!themeConfig) {
    throw new Error(`Unknown theme: ${theme}`);
  }

  // Create seeded random
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const random = createSeededRandom(actualSeed);

  // Merge options with theme defaults
  const generatorOptions = {
    ...themeConfig.generatorOptions,
    ...options.generatorOptions,
  };

  const postProcessConfig = {
    ...themeConfig.postProcess,
    ...options.postProcess,
  };

  const prefabConfig = {
    ...themeConfig.prefabs,
    ...options.prefabs,
  };

  const featureConfig = {
    ...themeConfig.features,
    ...options.features,
  };

  // Generate base grid
  // Temporarily override Math.random for generators that use it
  const originalRandom = Math.random;
  Math.random = random;

  let grid = generateBaseGrid(size, themeConfig.generator, generatorOptions);

  Math.random = originalRandom;

  // Apply post-processing
  applyPostProcess(grid, postProcessConfig, random);

  // Place prefabs
  let prefabsPlaced = 0;
  if (prefabConfig.enabled) {
    const prefabResult = placePrefabs(
      grid,
      {
        prefabs: builtInPrefabs,
        maxPrefabs: prefabConfig.maxPrefabs ?? 3,
        minDistance: prefabConfig.minDistance ?? 5,
        categories: prefabConfig.categories,
        level,
      },
      Math.floor(random() * 2147483647)
    );
    grid = prefabResult.grid;
    prefabsPlaced = prefabResult.placedPrefabs.length;
  }

  // Add features
  const featuresAdded = addFeatures(grid, featureConfig, random);

  return {
    grid,
    theme,
    seed: actualSeed,
    metadata: {
      generator: themeConfig.generator,
      prefabsPlaced,
      featuresAdded,
    },
  };
}

/**
 * Get display info for all themes
 */
export function getThemeInfo(): Array<{
  name: ThemeName;
  displayName: string;
  description: string;
}> {
  return Object.values(themes).map((t) => ({
    name: t.name,
    displayName: t.displayName,
    description: t.description,
  }));
}
