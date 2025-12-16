import type { Grid, Point } from "../types";
import { TileType, CARDINAL_DIRECTIONS } from "../types";
import { createGrid, countTiles, isInBoundsInner, randomItem, withSeededRandom } from "../utils";

export type DrunkardWalkVariant = "simple" | "weighted" | "multiple";

export interface DrunkardWalkOptions {
  /** Random seed for reproducible generation */
  seed?: number;
  /** Target percentage of floor tiles (default: 0.45) */
  fillPercentage?: number;
  /** Algorithm variant (default: "weighted") */
  variant?: DrunkardWalkVariant;
  /** Number of walkers for "multiple" variant (default: 4) */
  numWalkers?: number;
}

function walkSimple(
  grid: Grid,
  startX: number,
  startY: number,
  targetFloors: number,
  width: number,
  height: number
): void {
  let x = startX;
  let y = startY;
  let stepsWithoutCarving = 0;
  const maxStepsWithoutCarving = width * height;

  while (
    countTiles(grid, TileType.FLOOR) < targetFloors &&
    stepsWithoutCarving < maxStepsWithoutCarving
  ) {
    if (grid[y][x] === TileType.WALL) {
      grid[y][x] = TileType.FLOOR;
      stepsWithoutCarving = 0;
    } else {
      stepsWithoutCarving++;
    }

    const dir = randomItem(CARDINAL_DIRECTIONS);
    const newX = x + dir.dx;
    const newY = y + dir.dy;

    if (isInBoundsInner(newX, newY, width, height)) {
      x = newX;
      y = newY;
    }
  }
}

function walkWeighted(
  grid: Grid,
  startX: number,
  startY: number,
  targetFloors: number,
  width: number,
  height: number
): void {
  let x = startX;
  let y = startY;
  let steps = 0;
  const maxSteps = width * height * 4;

  while (countTiles(grid, TileType.FLOOR) < targetFloors && steps < maxSteps) {
    steps++;
    grid[y][x] = TileType.FLOOR;

    // Calculate weights based on wall neighbors
    const weights = CARDINAL_DIRECTIONS.map((dir) => {
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (!isInBoundsInner(newX, newY, width, height)) return 0;

      // Count walls in 3x3 area around target
      let wallCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = newX + dx;
          const checkY = newY + dy;
          if (
            checkX >= 0 &&
            checkX < width &&
            checkY >= 0 &&
            checkY < height &&
            grid[checkY][checkX] === TileType.WALL
          ) {
            wallCount++;
          }
        }
      }

      return wallCount + 1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) break;

    let random = Math.random() * totalWeight;
    let selectedDir = CARDINAL_DIRECTIONS[0];

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedDir = CARDINAL_DIRECTIONS[i];
        break;
      }
    }

    const newX = x + selectedDir.dx;
    const newY = y + selectedDir.dy;

    if (isInBoundsInner(newX, newY, width, height)) {
      x = newX;
      y = newY;
    }
  }
}

function walkMultiple(
  grid: Grid,
  numWalkers: number,
  targetFloors: number,
  width: number,
  height: number
): void {
  const walkerSteps = Math.ceil(targetFloors / numWalkers);

  for (let i = 0; i < numWalkers; i++) {
    let startX: number;
    let startY: number;

    if (countTiles(grid, TileType.FLOOR) === 0) {
      startX = Math.floor(width / 2);
      startY = Math.floor(height / 2);
    } else {
      // Find a random floor tile to start from
      const floorTiles: Point[] = [];
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (grid[y][x] === TileType.FLOOR) {
            floorTiles.push({ x, y });
          }
        }
      }
      const start = randomItem(floorTiles);
      startX = start.x;
      startY = start.y;
    }

    walkSimple(grid, startX, startY, countTiles(grid, TileType.FLOOR) + walkerSteps, width, height);
  }
}

/**
 * Drunkard's Walk cave generator
 *
 * Creates organic cave-like spaces by having random walkers
 * carve through a solid grid.
 *
 * Variants:
 * - "simple": Pure random walk
 * - "weighted": Biased towards unexplored areas
 * - "multiple": Multiple simultaneous walkers
 */
export function generateDrunkardWalk(size: number, options: DrunkardWalkOptions = {}): Grid {
  const { seed, fillPercentage = 0.45, variant = "weighted", numWalkers = 4 } = options;

  return withSeededRandom(seed, () => {
    const grid = createGrid(size, size, TileType.WALL);
    const targetFloors = Math.floor(size * size * fillPercentage);
    const startX = Math.floor(size / 2);
    const startY = Math.floor(size / 2);

    switch (variant) {
      case "simple":
        walkSimple(grid, startX, startY, targetFloors, size, size);
        break;
      case "multiple":
        walkMultiple(grid, numWalkers, targetFloors, size, size);
        break;
      case "weighted":
      default:
        walkWeighted(grid, startX, startY, targetFloors, size, size);
        break;
    }

    return grid;
  });
}
