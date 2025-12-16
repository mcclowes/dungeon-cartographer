import type { Point, Rect } from "../types";
import type { CellularShape } from "./types";
import { RoomShapeType } from "./types";

/**
 * Generate a cellular automata-based organic room shape
 */
export function generateCellularShape(
  bounds: Rect,
  options: {
    fillProbability?: number;
    iterations?: number;
    birthLimit?: number;
    deathLimit?: number;
  } = {}
): CellularShape {
  const { fillProbability = 0.45, iterations = 4, birthLimit = 4, deathLimit = 3 } = options;

  // Initialize cells with random values
  let cells = initializeCells(bounds.width, bounds.height, fillProbability);

  // Run cellular automata iterations
  for (let i = 0; i < iterations; i++) {
    cells = iterateCellular(cells, birthLimit, deathLimit);
  }

  // Extract the largest connected region
  const region = extractLargestRegion(cells);

  // If no valid region, fall back to a simple filled rectangle
  if (region.length === 0) {
    const fallbackTiles: Point[] = [];
    const padding = 1;
    for (let y = padding; y < bounds.height - padding; y++) {
      for (let x = padding; x < bounds.width - padding; x++) {
        fallbackTiles.push({ x, y });
      }
    }
    return {
      type: RoomShapeType.CELLULAR,
      tiles: fallbackTiles,
      boundingBox: bounds,
    };
  }

  return {
    type: RoomShapeType.CELLULAR,
    tiles: region,
    boundingBox: bounds,
  };
}

/**
 * Initialize a 2D boolean grid with random values
 */
export function initializeCells(
  width: number,
  height: number,
  fillProbability: number
): boolean[][] {
  const cells: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      // Always make edges empty to create a border
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(false);
      } else {
        row.push(Math.random() < fillProbability);
      }
    }
    cells.push(row);
  }

  return cells;
}

/**
 * Run one iteration of cellular automata rules
 */
export function iterateCellular(
  cells: boolean[][],
  birthLimit: number,
  deathLimit: number
): boolean[][] {
  const height = cells.length;
  const width = cells[0]?.length ?? 0;
  const newCells: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      // Keep edges as walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(false);
        continue;
      }

      const neighbors = countAliveNeighbors(cells, x, y);
      const isAlive = cells[y][x];

      if (isAlive) {
        // Survival rule: cell stays alive if it has enough neighbors
        row.push(neighbors >= deathLimit);
      } else {
        // Birth rule: cell becomes alive if it has enough neighbors
        row.push(neighbors > birthLimit);
      }
    }
    newCells.push(row);
  }

  return newCells;
}

/**
 * Count alive neighbors in a 3x3 area around a cell
 */
function countAliveNeighbors(cells: boolean[][], x: number, y: number): number {
  let count = 0;
  const height = cells.length;
  const width = cells[0]?.length ?? 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;

      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (cells[ny][nx]) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Extract the largest connected region of alive cells using flood fill
 */
export function extractLargestRegion(cells: boolean[][]): Point[] {
  const height = cells.length;
  const width = cells[0]?.length ?? 0;
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  let largestRegion: Point[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y][x] && !visited[y][x]) {
        const region = floodFill(cells, visited, x, y);
        if (region.length > largestRegion.length) {
          largestRegion = region;
        }
      }
    }
  }

  return largestRegion;
}

/**
 * Flood fill to find all connected cells starting from a point
 */
function floodFill(
  cells: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number
): Point[] {
  const height = cells.length;
  const width = cells[0]?.length ?? 0;
  const region: Point[] = [];
  const stack: Point[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || !cells[y][x]) continue;

    visited[y][x] = true;
    region.push({ x, y });

    // Add cardinal neighbors
    stack.push({ x: x - 1, y });
    stack.push({ x: x + 1, y });
    stack.push({ x, y: y - 1 });
    stack.push({ x, y: y + 1 });
  }

  return region;
}

/**
 * Smooth the edges of a cellular region by removing isolated tiles
 */
export function smoothCellularRegion(tiles: Point[]): Point[] {
  const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));

  return tiles.filter((tile) => {
    // Count cardinal neighbors
    const neighbors = [
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
    ];

    const neighborCount = neighbors.filter((n) => tileSet.has(`${n.x},${n.y}`)).length;

    // Keep tiles with at least 2 neighbors
    return neighborCount >= 2;
  });
}

/**
 * Ensure the cellular region has a minimum size
 */
export function ensureMinimumSize(tiles: Point[], minTiles: number, bounds: Rect): Point[] {
  if (tiles.length >= minTiles) {
    return tiles;
  }

  // If too small, expand by adding adjacent tiles
  const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));
  const result = [...tiles];

  while (result.length < minTiles) {
    // Find tiles adjacent to the region that could be added
    const candidates: Point[] = [];

    for (const tile of result) {
      const neighbors = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 },
      ];

      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (!tileSet.has(key)) {
          // Check bounds (excluding border)
          if (n.x > 0 && n.x < bounds.width - 1 && n.y > 0 && n.y < bounds.height - 1) {
            candidates.push(n);
            tileSet.add(key);
          }
        }
      }
    }

    if (candidates.length === 0) break;

    // Add some candidates
    const toAdd = Math.min(candidates.length, minTiles - result.length);
    for (let i = 0; i < toAdd; i++) {
      result.push(candidates[i]);
    }
  }

  return result;
}

/**
 * Check if bounds are large enough for cellular shapes
 */
export function canFitCellularShape(bounds: Rect, minSize: number = 5): boolean {
  return bounds.width >= minSize && bounds.height >= minSize;
}
