import type { Grid, Point } from "../types";
import { TileType, CARDINAL_DIRECTIONS } from "../types";
import { createGrid, isInBoundsInner, randomItem, placeFeatures, validateGridSize, type FeaturePlacementOptions } from "../utils";

export interface DLAOptions {
  /** Target percentage of floor tiles (default: 0.35) */
  fillPercentage?: number;
  /** Number of seed points to start from (default: 1) */
  numSeeds?: number;
  /** Whether particles stick on first contact or have a chance to continue (default: 0.8) */
  stickiness?: number;
  /** Spawn particles from edges vs random (default: "edge") */
  spawnMode?: "edge" | "random";
  /** Whether to add dungeon features (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
}

function getEdgeSpawnPoint(size: number): Point {
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: // Top
      return { x: Math.floor(Math.random() * (size - 2)) + 1, y: 1 };
    case 1: // Bottom
      return { x: Math.floor(Math.random() * (size - 2)) + 1, y: size - 2 };
    case 2: // Left
      return { x: 1, y: Math.floor(Math.random() * (size - 2)) + 1 };
    default: // Right
      return { x: size - 2, y: Math.floor(Math.random() * (size - 2)) + 1 };
  }
}

function getRandomSpawnPoint(size: number): Point {
  return {
    x: Math.floor(Math.random() * (size - 2)) + 1,
    y: Math.floor(Math.random() * (size - 2)) + 1,
  };
}

function hasFloorNeighbor(grid: Grid, x: number, y: number): boolean {
  for (const dir of CARDINAL_DIRECTIONS) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
      if (grid[ny][nx] === TileType.FLOOR) {
        return true;
      }
    }
  }
  return false;
}

function randomWalk(point: Point, size: number): Point {
  const dir = randomItem(CARDINAL_DIRECTIONS);
  const newX = point.x + dir.dx;
  const newY = point.y + dir.dy;

  // Clamp to bounds
  return {
    x: Math.max(1, Math.min(size - 2, newX)),
    y: Math.max(1, Math.min(size - 2, newY)),
  };
}

/**
 * Diffusion-Limited Aggregation generator
 *
 * Creates organic, coral-like structures by releasing particles that
 * random walk until they stick to the existing structure.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated DLA grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const grid = generateDLA(50, { fillPercentage: 0.4, numSeeds: 3 });
 * ```
 */
export function generateDLA(size: number, options: DLAOptions = {}): Grid {
  validateGridSize(size, "generateDLA");

  const {
    fillPercentage = 0.35,
    numSeeds = 1,
    stickiness = 0.8,
    spawnMode = "edge",
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
  } = options;

  const grid = createGrid(size, size, TileType.WALL);
  const totalTiles = (size - 2) * (size - 2);
  const targetFloors = Math.floor(totalTiles * fillPercentage);
  let currentFloors = 0;

  // Place initial seeds
  const seedSpacing = Math.floor(size / (numSeeds + 1));
  for (let i = 0; i < numSeeds; i++) {
    const seedX = numSeeds === 1
      ? Math.floor(size / 2)
      : seedSpacing * (i + 1);
    const seedY = Math.floor(size / 2);

    if (isInBoundsInner(seedX, seedY, size, size)) {
      grid[seedY][seedX] = TileType.FLOOR;
      currentFloors++;
    }
  }

  const maxIterations = targetFloors * 1000; // Safety limit
  let iterations = 0;

  while (currentFloors < targetFloors && iterations < maxIterations) {
    // Spawn a new particle
    let particle = spawnMode === "edge"
      ? getEdgeSpawnPoint(size)
      : getRandomSpawnPoint(size);

    // Walk until it sticks or escapes
    let stuck = false;
    let walkSteps = 0;
    const maxWalkSteps = size * size;

    while (!stuck && walkSteps < maxWalkSteps) {
      walkSteps++;

      // Check if adjacent to existing structure
      if (hasFloorNeighbor(grid, particle.x, particle.y)) {
        // Chance to stick
        if (Math.random() < stickiness) {
          if (grid[particle.y][particle.x] === TileType.WALL) {
            grid[particle.y][particle.x] = TileType.FLOOR;
            currentFloors++;
            stuck = true;
          }
        }
      }

      if (!stuck) {
        particle = randomWalk(particle, size);

        // If particle is on a floor tile, push it away
        if (grid[particle.y][particle.x] === TileType.FLOOR) {
          particle = randomWalk(particle, size);
        }
      }
    }

    iterations++;
  }

  if (addFeaturesEnabled) {
    return placeFeatures(grid, featureOptions);
  }

  return grid;
}
