import type { Grid } from "../types";
import { TileType } from "../types";

/**
 * Remove orphaned doors - doors that don't have at least one adjacent wall.
 * A valid door should be in a doorway (walls on opposite sides).
 */
export function removeOrphanedDoors(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TileType.DOOR || grid[y][x] === TileType.SECRET_DOOR) {
        const hasWallAbove = y > 0 && grid[y - 1][x] === TileType.WALL;
        const hasWallBelow = y < height - 1 && grid[y + 1][x] === TileType.WALL;
        const hasWallLeft = x > 0 && grid[y][x - 1] === TileType.WALL;
        const hasWallRight = x < width - 1 && grid[y][x + 1] === TileType.WALL;

        // A door needs at least one adjacent wall to be valid
        const hasAnyWall = hasWallAbove || hasWallBelow || hasWallLeft || hasWallRight;

        if (!hasAnyWall) {
          // No adjacent walls - convert to floor
          grid[y][x] = TileType.FLOOR;
        }
      }
    }
  }

  return grid;
}

/**
 * Remove isolated floor tiles - floors completely surrounded by walls.
 */
export function removeIsolatedFloors(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === TileType.FLOOR) {
        const neighbors = [
          grid[y - 1][x],
          grid[y + 1][x],
          grid[y][x - 1],
          grid[y][x + 1],
        ];

        const allWalls = neighbors.every((n) => n === TileType.WALL);
        if (allWalls) {
          grid[y][x] = TileType.WALL;
        }
      }
    }
  }

  return grid;
}

/**
 * Clean up corridors that are only 1 tile and surrounded by walls on 3 sides.
 */
export function removeDeadEndCorridors(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0].length;
  let changed = true;

  // Keep iterating until no more changes (removes chains of dead ends)
  while (changed) {
    changed = false;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === TileType.CORRIDOR) {
          const neighbors = [
            grid[y - 1][x],
            grid[y + 1][x],
            grid[y][x - 1],
            grid[y][x + 1],
          ];

          const wallCount = neighbors.filter((n) => n === TileType.WALL).length;

          // Dead end: 3 walls surrounding
          if (wallCount >= 3) {
            grid[y][x] = TileType.WALL;
            changed = true;
          }
        }
      }
    }
  }

  return grid;
}

export interface PostProcessOptions {
  /** Remove doors not adjacent to walls (default: true) */
  removeOrphanedDoors?: boolean;
  /** Remove single floor tiles surrounded by walls (default: false) */
  removeIsolatedFloors?: boolean;
  /** Remove dead-end corridor tiles (default: false) */
  removeDeadEndCorridors?: boolean;
}

/**
 * Apply post-processing cleanup to a generated grid.
 */
export function postProcess(grid: Grid, options: PostProcessOptions = {}): Grid {
  const {
    removeOrphanedDoors: cleanDoors = true,
    removeIsolatedFloors: cleanFloors = false,
    removeDeadEndCorridors: cleanCorridors = false,
  } = options;

  if (cleanDoors) {
    removeOrphanedDoors(grid);
  }

  if (cleanFloors) {
    removeIsolatedFloors(grid);
  }

  if (cleanCorridors) {
    removeDeadEndCorridors(grid);
  }

  return grid;
}
