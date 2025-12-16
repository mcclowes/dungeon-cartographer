import type { Grid, Point } from "../types";
import { TileType } from "../types";
import {
  createGrid,
  randomInt,
  placeFeatures,
  validateGridSize,
  type FeaturePlacementOptions,
} from "../utils";

export interface VoronoiOptions {
  /** Number of room seeds to place (default: based on size) */
  numRooms?: number;
  /** Minimum distance between room centers (default: 4) */
  minRoomDistance?: number;
  /** How much to relax/round room edges 0-5 (default: 2) */
  relaxation?: number;
  /** Whether to add doors at room connections (default: true) */
  addDoors?: boolean;
  /** Whether to add dungeon features (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
}

interface VoronoiCell {
  center: Point;
  tiles: Point[];
}

function distance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance for more angular rooms
}

function euclideanDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function generateSeeds(size: number, numRooms: number, minDistance: number): Point[] {
  const seeds: Point[] = [];
  const maxAttempts = numRooms * 50;
  let attempts = 0;

  while (seeds.length < numRooms && attempts < maxAttempts) {
    const candidate: Point = {
      x: randomInt(size - 4, 2),
      y: randomInt(size - 4, 2),
    };

    const tooClose = seeds.some((seed) => euclideanDistance(seed, candidate) < minDistance);
    if (!tooClose) {
      seeds.push(candidate);
    }
    attempts++;
  }

  return seeds;
}

function assignCells(size: number, seeds: Point[]): VoronoiCell[] {
  const cells: VoronoiCell[] = seeds.map((center) => ({ center, tiles: [] }));

  // Assign each tile to its nearest seed
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const point: Point = { x, y };
      let minDist = Infinity;
      let nearestIdx = 0;

      for (let i = 0; i < seeds.length; i++) {
        const dist = distance(point, seeds[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }

      cells[nearestIdx].tiles.push(point);
    }
  }

  return cells;
}

function shrinkCell(cell: VoronoiCell): Point[] {
  // Remove edge tiles to create walls between rooms
  const tileSet = new Set(cell.tiles.map((t) => `${t.x},${t.y}`));

  return cell.tiles.filter((tile) => {
    // Keep only tiles where all cardinal neighbors are also in this cell
    const neighbors = [
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
    ];

    // Keep if at least 3 neighbors are in the cell (allows some edge tiles to remain)
    const neighborCount = neighbors.filter((n) => tileSet.has(`${n.x},${n.y}`)).length;
    return neighborCount >= 3;
  });
}

function relaxCells(cells: VoronoiCell[], iterations: number): VoronoiCell[] {
  let currentCells = cells;

  for (let i = 0; i < iterations; i++) {
    currentCells = currentCells.map((cell) => ({
      ...cell,
      tiles: shrinkCell(cell),
    }));
  }

  return currentCells;
}

function findNeighboringCells(cells: VoronoiCell[]): [number, number][] {
  const neighbors: [number, number][] = [];
  const checked = new Set<string>();

  // Create lookup for which cell owns each tile
  const tileOwner = new Map<string, number>();
  cells.forEach((cell, idx) => {
    cell.tiles.forEach((tile) => {
      tileOwner.set(`${tile.x},${tile.y}`, idx);
    });
  });

  // Find cells that are adjacent (have tiles next to each other)
  cells.forEach((cell, cellIdx) => {
    cell.tiles.forEach((tile) => {
      const adjacentPoints = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 },
      ];

      adjacentPoints.forEach((adj) => {
        const adjKey = `${adj.x},${adj.y}`;
        const adjOwner = tileOwner.get(adjKey);

        if (adjOwner !== undefined && adjOwner !== cellIdx) {
          const pairKey = [Math.min(cellIdx, adjOwner), Math.max(cellIdx, adjOwner)].join("-");
          if (!checked.has(pairKey)) {
            checked.add(pairKey);
            neighbors.push([cellIdx, adjOwner]);
          }
        }
      });
    });
  });

  return neighbors;
}

function connectCells(grid: Grid, cells: VoronoiCell[], neighborPairs: [number, number][]): void {
  for (const [aIdx, bIdx] of neighborPairs) {
    const a = cells[aIdx];
    const b = cells[bIdx];

    // Find the two closest tiles between the cells
    let minDist = Infinity;
    let closestA: Point | null = null;
    let closestB: Point | null = null;

    for (const tileA of a.tiles) {
      for (const tileB of b.tiles) {
        const dist = euclideanDistance(tileA, tileB);
        if (dist < minDist) {
          minDist = dist;
          closestA = tileA;
          closestB = tileB;
        }
      }
    }

    if (closestA && closestB) {
      // Draw L-shaped corridor: go horizontal first, then vertical
      // Horizontal from A to B's x
      const startX = Math.min(closestA.x, closestB.x);
      const endX = Math.max(closestA.x, closestB.x);
      for (let x = startX; x <= endX; x++) {
        if (grid[closestA.y][x] === TileType.WALL) {
          grid[closestA.y][x] = TileType.CORRIDOR;
        }
      }

      // Vertical from A's row to B's row at B's x
      const startY = Math.min(closestA.y, closestB.y);
      const endY = Math.max(closestA.y, closestB.y);
      for (let y = startY; y <= endY; y++) {
        if (grid[y][closestB.x] === TileType.WALL) {
          grid[y][closestB.x] = TileType.CORRIDOR;
        }
      }
    }
  }
}

function addDoors(grid: Grid): void {
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] !== TileType.CORRIDOR) continue;

      // Check if this is a doorway (corridor between floor and more corridor/floor)
      const hasFloorNorth = grid[y - 1][x] === TileType.FLOOR;
      const hasFloorSouth = grid[y + 1][x] === TileType.FLOOR;
      const hasFloorEast = grid[y][x + 1] === TileType.FLOOR;
      const hasFloorWest = grid[y][x - 1] === TileType.FLOOR;

      const isVerticalDoorway =
        (hasFloorNorth || hasFloorSouth) &&
        grid[y][x - 1] === TileType.WALL &&
        grid[y][x + 1] === TileType.WALL;
      const isHorizontalDoorway =
        (hasFloorEast || hasFloorWest) &&
        grid[y - 1][x] === TileType.WALL &&
        grid[y + 1][x] === TileType.WALL;

      if ((isVerticalDoorway || isHorizontalDoorway) && Math.random() < 0.4) {
        grid[y][x] = TileType.DOOR;
      }
    }
  }
}

/**
 * Voronoi-based room generator
 *
 * Creates organic, irregular room shapes using Voronoi tessellation.
 * Rooms are connected via corridors between neighboring cells.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated Voronoi dungeon grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const grid = generateVoronoi(50, { numRooms: 8, relaxation: 3 });
 * ```
 */
export function generateVoronoi(size: number, options: VoronoiOptions = {}): Grid {
  validateGridSize(size, "generateVoronoi");

  const {
    numRooms = Math.floor(size / 6),
    minRoomDistance = 4,
    relaxation = 2,
    addDoors: addDoorsEnabled = true,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
  } = options;

  const grid = createGrid(size, size, TileType.WALL);

  // Generate room seeds
  const seeds = generateSeeds(size, numRooms, minRoomDistance);

  if (seeds.length < 2) {
    console.warn(
      "generateVoronoi: Grid too small for requested number of rooms, returning empty dungeon"
    );
    return grid;
  }

  // Create Voronoi cells
  let cells = assignCells(size, seeds);

  // Relax/shrink cells to create walls
  cells = relaxCells(cells, relaxation);

  // Draw rooms
  for (const cell of cells) {
    for (const tile of cell.tiles) {
      grid[tile.y][tile.x] = TileType.FLOOR;
    }
  }

  // Find neighboring cells and connect them
  const neighborPairs = findNeighboringCells(cells);
  connectCells(grid, cells, neighborPairs);

  if (addDoorsEnabled) {
    addDoors(grid);
  }

  if (addFeaturesEnabled) {
    return placeFeatures(grid, featureOptions);
  }

  return grid;
}
