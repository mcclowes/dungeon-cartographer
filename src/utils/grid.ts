import type { Grid } from "../types";

/** Create a grid filled with a single value */
export function createGrid(width: number, height: number, fill = 0): Grid {
  return Array(height)
    .fill(0)
    .map(() => Array(width).fill(fill));
}

/** Check if coordinates are within grid bounds */
export function isInBounds(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/** Check if coordinates are within grid bounds (excluding border) */
export function isInBoundsInner(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return x > 0 && x < width - 1 && y > 0 && y < height - 1;
}

/** Count occurrences of a value in the grid */
export function countTiles(grid: Grid, value: number): number {
  let count = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === value) count++;
    }
  }
  return count;
}

/** Sum values in a radius around a point */
export function sumInRadius(
  grid: Grid,
  x: number,
  y: number,
  radius: number
): number {
  let total = 0;
  for (let dx = -radius; dx <= radius; dx++) {
    const checkX = x + dx;
    if (checkX >= 0 && checkX < grid[0].length) {
      for (let dy = -radius; dy <= radius; dy++) {
        const checkY = y + dy;
        if (checkY >= 0 && checkY < grid.length) {
          total += grid[checkY][checkX];
        }
      }
    }
  }
  return total;
}

/** Clone a grid */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
