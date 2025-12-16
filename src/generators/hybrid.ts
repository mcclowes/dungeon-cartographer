import type { Grid, Point } from "../types";
import { TileType } from "../types";
import {
  createGrid,
  placeFeatures,
  withSeededRandom,
  type FeaturePlacementOptions,
} from "../utils";
import { generateBSP } from "./bsp";
import { generateCave } from "./cave";

export type SplitDirection = "horizontal" | "vertical" | "diagonal" | "radial";
export type BlendMode = "hard" | "soft" | "scattered";

export interface HybridOptions {
  /** Random seed for reproducible generation */
  seed?: number;
  /** Direction to split the map (default: "diagonal") */
  splitDirection?: SplitDirection;
  /** Position of split 0-1 (default: 0.5) */
  splitPosition?: number;
  /** How to blend the two regions (default: "soft") */
  blendMode?: BlendMode;
  /** Width of blend zone in tiles (default: 4) */
  blendWidth?: number;
  /** BSP generator options */
  bspOptions?: {
    minPartitionSize?: number;
    maxDepth?: number;
    minRoomSize?: number;
    padding?: number;
    addDoors?: boolean;
  };
  /** Cave generator options */
  caveOptions?: {
    iterations?: number;
    initialFillProbability?: number;
  };
  /** Whether to connect the two regions with corridors (default: true) */
  connectRegions?: boolean;
  /** Whether to add dungeon features (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
}

function getSplitValue(x: number, y: number, size: number, direction: SplitDirection): number {
  // Returns 0-1 where 0 = fully region A, 1 = fully region B
  switch (direction) {
    case "horizontal":
      return y / size;
    case "vertical":
      return x / size;
    case "diagonal":
      // Diagonal from top-left to bottom-right
      return (x + y) / (size * 2);
    case "radial": {
      // Distance from center
      const centerX = size / 2;
      const centerY = size / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return dist / maxDist;
    }
  }
}

function getBlendFactor(
  splitValue: number,
  splitPosition: number,
  blendWidth: number,
  size: number,
  blendMode: BlendMode
): number {
  // Returns 0-1 where 0 = region A, 1 = region B
  const normalizedBlendWidth = blendWidth / size;
  const halfBlend = normalizedBlendWidth / 2;

  if (blendMode === "hard") {
    return splitValue < splitPosition ? 0 : 1;
  }

  if (splitValue < splitPosition - halfBlend) {
    return 0;
  }
  if (splitValue > splitPosition + halfBlend) {
    return 1;
  }

  // In blend zone
  const blendProgress = (splitValue - (splitPosition - halfBlend)) / normalizedBlendWidth;

  if (blendMode === "scattered") {
    // Random threshold for scattered effect
    return Math.random() < blendProgress ? 1 : 0;
  }

  // Soft blend - smooth transition
  return blendProgress;
}

function connectRegions(
  grid: Grid,
  splitDirection: SplitDirection,
  splitPosition: number,
  size: number
): void {
  // Find floor tiles near the boundary in each region
  const regionAFloors: Point[] = [];
  const regionBFloors: Point[] = [];

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      const splitVal = getSplitValue(x, y, size, splitDirection);
      const distFromSplit = Math.abs(splitVal - splitPosition);

      if (distFromSplit < 0.15) {
        if (splitVal < splitPosition) {
          regionAFloors.push({ x, y });
        } else {
          regionBFloors.push({ x, y });
        }
      }
    }
  }

  if (regionAFloors.length === 0 || regionBFloors.length === 0) return;

  // Find closest pair of points between regions
  let minDist = Infinity;
  let bestA: Point | null = null;
  let bestB: Point | null = null;

  // Sample to avoid O(n^2) for large grids
  const sampleA =
    regionAFloors.length > 50
      ? regionAFloors.filter((_, i) => i % Math.ceil(regionAFloors.length / 50) === 0)
      : regionAFloors;
  const sampleB =
    regionBFloors.length > 50
      ? regionBFloors.filter((_, i) => i % Math.ceil(regionBFloors.length / 50) === 0)
      : regionBFloors;

  for (const a of sampleA) {
    for (const b of sampleB) {
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (dist < minDist) {
        minDist = dist;
        bestA = a;
        bestB = b;
      }
    }
  }

  if (!bestA || !bestB) return;

  // Draw corridor between them
  let x = bestA.x;
  let y = bestA.y;

  // Go horizontal first, then vertical
  while (x !== bestB.x) {
    x += x < bestB.x ? 1 : -1;
    if (grid[y][x] === TileType.WALL) {
      grid[y][x] = TileType.CORRIDOR;
    }
  }
  while (y !== bestB.y) {
    y += y < bestB.y ? 1 : -1;
    if (grid[y][x] === TileType.WALL) {
      grid[y][x] = TileType.CORRIDOR;
    }
  }
}

/**
 * Hybrid generator combining two generation approaches
 *
 * Creates maps that blend structured (BSP) and organic (Cave) regions,
 * perfect for environments where civilization meets nature - mine entrances
 * leading to natural caverns, ruined temples overtaken by cave systems, etc.
 */
export function generateHybrid(size: number, options: HybridOptions = {}): Grid {
  const {
    seed,
    splitDirection = "diagonal",
    splitPosition = 0.5,
    blendMode = "soft",
    blendWidth = 4,
    bspOptions = {},
    caveOptions = {},
    connectRegions: shouldConnect = true,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
  } = options;

  return withSeededRandom(seed, () => {
    // Generate both base grids
    const bspGrid = generateBSP(size, {
      ...bspOptions,
      addDoors: bspOptions.addDoors ?? true,
      addFeatures: false,
    });

    const caveGrid = generateCave(size, {
      ...caveOptions,
      addFeatures: false,
    });

    // Combine grids based on split
    const grid = createGrid(size, size, TileType.WALL);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const splitValue = getSplitValue(x, y, size, splitDirection);
        const blendFactor = getBlendFactor(splitValue, splitPosition, blendWidth, size, blendMode);

        if (blendFactor < 0.5) {
          // Use BSP tile
          grid[y][x] = bspGrid[y][x];
        } else {
          // Use Cave tile
          grid[y][x] = caveGrid[y][x];
        }
      }
    }

    // Connect the two regions
    if (shouldConnect) {
      connectRegions(grid, splitDirection, splitPosition, size);
    }

    if (addFeaturesEnabled) {
      return placeFeatures(grid, featureOptions);
    }

    return grid;
  });
}
