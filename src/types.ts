/** A 2D grid of tile values */
export type Grid = number[][];

/** Common tile types used across generators */
export enum TileType {
  WALL = 0,
  FLOOR = 1,
  DOOR = 2,
  SECRET_DOOR = 3,
  CORRIDOR = 4,
  // Stairs/elevation
  STAIRS_UP = 5,
  STAIRS_DOWN = 6,
  PIT = 7,
  // Treasure/loot
  TREASURE = 8,
  CHEST = 9,
  // Traps
  TRAP = 10,
  TRAP_PIT = 11,
  // Water/environmental
  WATER = 12,
  DEEP_WATER = 13,
  LAVA = 14,
  // Debris/destruction
  RUBBLE = 15,
  COLLAPSED = 16,
  FALLEN_COLUMN = 17,
}

/** Terrain-specific tile types for Perlin generator */
export enum TerrainTile {
  DEEP_WATER = 0,
  WATER = 1,
  SAND = 2,
  GRASS = 3,
  FOREST = 4,
  MOUNTAIN = 5,
}

/** Maze-specific tile types */
export enum MazeTile {
  WALL = 0,
  PASSAGE = 1,
  START = 2,
  END = 3,
}

/** Coordinate position */
export interface Point {
  x: number;
  y: number;
}

/** Rectangle bounds */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Direction with offset */
export interface Direction {
  dx: number;
  dy: number;
}

/** Cardinal directions */
export const CARDINAL_DIRECTIONS: Direction[] = [
  { dx: 0, dy: -1 }, // North
  { dx: 0, dy: 1 }, // South
  { dx: 1, dy: 0 }, // East
  { dx: -1, dy: 0 }, // West
];

/** Generator result with metadata */
export interface GeneratorResult<T = Grid> {
  grid: T;
  metadata?: Record<string, unknown>;
}
