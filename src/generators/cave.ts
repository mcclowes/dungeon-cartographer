import type { Grid } from "../types";
import { TileType } from "../types";
import { sumInRadius, placeFeatures, validateGridSize, type FeaturePlacementOptions } from "../utils";

export interface CaveOptions {
  /** Number of cellular automata iterations (default: 3) */
  iterations?: number;
  /** Initial fill probability 0-1 (default: 0.5) */
  initialFillProbability?: number;
  /** Threshold for cell survival (default: 5) */
  survivalThreshold?: number;
  /** Whether to add dungeon features like stairs, treasures, traps (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
}

function applyCellularAutomata(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0].length;

  return grid.map((row, y) =>
    row.map((_, x) => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        return TileType.WALL;
      }

      const neighbors = sumInRadius(grid, x, y, 1);
      const isolated = sumInRadius(grid, x, y, 2) === 0;

      if (isolated) {
        return TileType.FLOOR;
      }

      // 4-5 rule: survive if 5+ neighbors, die otherwise
      return neighbors >= 5 ? TileType.FLOOR : TileType.WALL;
    })
  );
}

/**
 * Cellular Automata cave generator
 *
 * Creates organic cave-like structures by starting with random noise
 * and applying cellular automata rules iteratively.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated cave grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const grid = generateCave(50, { iterations: 5, initialFillProbability: 0.45 });
 * ```
 *
 * @see http://roguebasin.roguelikedevelopment.org/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels
 */
export function generateCave(size: number, options: CaveOptions = {}): Grid {
  validateGridSize(size, "generateCave");

  const {
    iterations = 3,
    initialFillProbability = 0.5,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
  } = options;

  // Create initial random grid
  let grid: Grid = Array(size)
    .fill(0)
    .map(() =>
      Array(size)
        .fill(0)
        .map(() =>
          Math.random() < initialFillProbability
            ? TileType.FLOOR
            : TileType.WALL
        )
    );

  // Apply cellular automata rules
  for (let i = 0; i < iterations; i++) {
    grid = applyCellularAutomata(grid);
  }

  if (addFeaturesEnabled) {
    placeFeatures(grid, featureOptions);
  }

  return grid;
}
