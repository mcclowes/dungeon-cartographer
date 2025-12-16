import type { Grid } from "../types";
import { TileType } from "../types";
import { createSeededRandom } from "../utils/random";

export interface ParchmentColors {
  /** Parchment/floor color */
  parchment: string;
  /** Wall/background color */
  wall: string;
  /** Hatching stroke color */
  hatching: string;
  /** Grid line color */
  gridLine: string;
  /** Border/shadow color */
  border: string;
}

export const DEFAULT_PARCHMENT_COLORS: ParchmentColors = {
  parchment: "#e8d9b5",
  wall: "#ba9c63",
  hatching: "#8a7045",
  gridLine: "rgba(165, 90, 60, 0.6)",
  border: "rgba(70, 45, 20, 0.85)",
};

export type Edges = [boolean, boolean, boolean, boolean]; // top, right, bottom, left

export function getNeighbor(grid: Grid, x: number, y: number): number {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return TileType.WALL;
  }
  return grid[y][x];
}

export function isFloorLike(tile: number): boolean {
  return (
    tile === TileType.FLOOR ||
    tile === TileType.DOOR ||
    tile === TileType.CORRIDOR ||
    tile === TileType.STAIRS_UP ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.PIT ||
    tile === TileType.TREASURE ||
    tile === TileType.CHEST ||
    tile === TileType.TRAP ||
    tile === TileType.TRAP_PIT ||
    tile === TileType.WATER ||
    tile === TileType.DEEP_WATER ||
    tile === TileType.LAVA ||
    tile === TileType.CRATE ||
    tile === TileType.BARREL ||
    tile === TileType.BED ||
    tile === TileType.TABLE ||
    tile === TileType.CHAIR ||
    tile === TileType.BOOKSHELF ||
    tile === TileType.CARPET ||
    tile === TileType.FIREPLACE ||
    tile === TileType.STATUE ||
    tile === TileType.ALTAR ||
    tile === TileType.RUBBLE ||
    tile === TileType.COLLAPSED ||
    tile === TileType.FALLEN_COLUMN
  );
}

export function findEdges(grid: Grid, x: number, y: number): Edges {
  return [
    !isFloorLike(getNeighbor(grid, x, y - 1)), // top borders wall
    !isFloorLike(getNeighbor(grid, x + 1, y)), // right borders wall
    !isFloorLike(getNeighbor(grid, x, y + 1)), // bottom borders wall
    !isFloorLike(getNeighbor(grid, x - 1, y)), // left borders wall
  ];
}

/**
 * Simple seeded random for consistent hatching per tile
 * @deprecated Use createSeededRandom from utils/random instead
 */
export const seededRandom = createSeededRandom;
