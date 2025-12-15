import type { Grid } from "../types";
import { TileType } from "../types";
import { randomItem, weightedRandom } from "../utils";

export interface WFCOptions {
  /** Seed radius for initial floor tiles (default: size/6) */
  seedRadius?: number;
}

interface WFCCell {
  collapsed: boolean;
  options: number[];
  tile: number | null;
}

type DirectionName = "north" | "south" | "east" | "west";

interface DirectionInfo {
  dx: number;
  dy: number;
  opposite: DirectionName;
}

const DIRECTIONS: Record<DirectionName, DirectionInfo> = {
  north: { dx: 0, dy: -1, opposite: "south" },
  south: { dx: 0, dy: 1, opposite: "north" },
  east: { dx: 1, dy: 0, opposite: "west" },
  west: { dx: -1, dy: 0, opposite: "east" },
};

// Adjacency rules: which tiles can be next to which
const ADJACENCY_RULES: Record<number, Record<DirectionName, number[]>> = {
  [TileType.WALL]: {
    north: [TileType.WALL, TileType.FLOOR],
    south: [TileType.WALL, TileType.FLOOR],
    east: [TileType.WALL, TileType.FLOOR],
    west: [TileType.WALL, TileType.FLOOR],
  },
  [TileType.FLOOR]: {
    north: [TileType.FLOOR, TileType.WALL, TileType.DOOR, TileType.CORRIDOR],
    south: [TileType.FLOOR, TileType.WALL, TileType.DOOR, TileType.CORRIDOR],
    east: [TileType.FLOOR, TileType.WALL, TileType.DOOR, TileType.CORRIDOR],
    west: [TileType.FLOOR, TileType.WALL, TileType.DOOR, TileType.CORRIDOR],
  },
  [TileType.DOOR]: {
    north: [TileType.FLOOR, TileType.CORRIDOR],
    south: [TileType.FLOOR, TileType.CORRIDOR],
    east: [TileType.FLOOR, TileType.CORRIDOR],
    west: [TileType.FLOOR, TileType.CORRIDOR],
  },
  [TileType.CORRIDOR]: {
    north: [TileType.CORRIDOR, TileType.FLOOR, TileType.DOOR, TileType.WALL],
    south: [TileType.CORRIDOR, TileType.FLOOR, TileType.DOOR, TileType.WALL],
    east: [TileType.CORRIDOR, TileType.FLOOR, TileType.DOOR, TileType.WALL],
    west: [TileType.CORRIDOR, TileType.FLOOR, TileType.DOOR, TileType.WALL],
  },
};

const TILE_WEIGHTS: Record<number, number> = {
  [TileType.WALL]: 3,
  [TileType.FLOOR]: 5,
  [TileType.DOOR]: 1,
  [TileType.CORRIDOR]: 3,
};

const ALL_TILES = [
  TileType.WALL,
  TileType.FLOOR,
  TileType.DOOR,
  TileType.CORRIDOR,
];

function createSuperposition(width: number, height: number): WFCCell[][] {
  const grid: WFCCell[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Border tiles forced to WALL
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        grid[y][x] = {
          collapsed: true,
          options: [TileType.WALL],
          tile: TileType.WALL,
        };
      } else {
        grid[y][x] = {
          collapsed: false,
          options: [...ALL_TILES],
          tile: null,
        };
      }
    }
  }

  return grid;
}

function getEntropy(cell: WFCCell): number {
  if (cell.collapsed) return Infinity;
  return cell.options.length;
}

function findLowestEntropyCell(
  grid: WFCCell[][]
): { x: number; y: number } | null {
  let minEntropy = Infinity;
  let candidates: { x: number; y: number }[] = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const entropy = getEntropy(grid[y][x]);
      if (entropy < minEntropy && entropy > 0) {
        minEntropy = entropy;
        candidates = [{ x, y }];
      } else if (entropy === minEntropy) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates.length > 0 ? randomItem(candidates) : null;
}

function collapseCell(cell: WFCCell): void {
  if (cell.options.length === 0) {
    cell.tile = TileType.WALL;
    cell.collapsed = true;
    return;
  }

  const weights = cell.options.map((tile) => TILE_WEIGHTS[tile] || 1);
  cell.tile = weightedRandom(cell.options, weights);
  cell.collapsed = true;
  cell.options = [cell.tile];
}

function getValidNeighborTiles(tile: number, direction: DirectionName): number[] {
  const rules = ADJACENCY_RULES[tile];
  return rules ? rules[direction] || [] : [];
}

function propagate(grid: WFCCell[][], startX: number, startY: number): void {
  const stack = [{ x: startX, y: startY }];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[current.y][current.x];

    for (const [dirName, dir] of Object.entries(DIRECTIONS)) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) {
        continue;
      }

      const neighbor = grid[ny][nx];
      if (neighbor.collapsed) continue;

      // Calculate valid tiles for neighbor
      const validTiles = new Set<number>();
      for (const option of cell.options) {
        const allowed = getValidNeighborTiles(option, dirName as DirectionName);
        allowed.forEach((t) => validTiles.add(t));
      }

      // Check reverse validity
      const reverseValid = new Set<number>();
      for (const option of neighbor.options) {
        const allowed = getValidNeighborTiles(option, dir.opposite);
        if (cell.options.some((t) => allowed.includes(t))) {
          reverseValid.add(option);
        }
      }

      // Intersect
      const newOptions = neighbor.options.filter(
        (t) => validTiles.has(t) && reverseValid.has(t)
      );

      if (newOptions.length < neighbor.options.length) {
        neighbor.options = newOptions;
        if (newOptions.length === 0) {
          neighbor.options = [TileType.WALL];
          neighbor.tile = TileType.WALL;
          neighbor.collapsed = true;
        } else if (newOptions.length === 1) {
          neighbor.tile = newOptions[0];
          neighbor.collapsed = true;
        }
        stack.push({ x: nx, y: ny });
      }
    }
  }
}

/**
 * Wave Function Collapse dungeon generator
 *
 * A constraint-satisfaction algorithm that generates maps
 * based on adjacency rules.
 */
export function generateWFC(size: number, options: WFCOptions = {}): Grid {
  const { seedRadius = Math.floor(size / 6) } = options;

  const grid = createSuperposition(size, size);
  let iterations = 0;
  const maxIterations = size * size * 2;

  // Seed center area with floor tiles
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);

  for (let dy = -seedRadius; dy <= seedRadius; dy++) {
    for (let dx = -seedRadius; dx <= seedRadius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
        if (Math.abs(dx) + Math.abs(dy) <= seedRadius) {
          grid[y][x].options = [TileType.FLOOR, TileType.CORRIDOR];
        }
      }
    }
  }

  while (iterations < maxIterations) {
    iterations++;

    const cell = findLowestEntropyCell(grid);
    if (!cell) break;

    collapseCell(grid[cell.y][cell.x]);
    propagate(grid, cell.x, cell.y);
  }

  // Convert to simple number grid
  return grid.map((row) =>
    row.map((cell) => {
      if (!cell.collapsed) {
        return cell.options.length > 0 ? cell.options[0] : TileType.WALL;
      }
      return cell.tile ?? TileType.WALL;
    })
  );
}
