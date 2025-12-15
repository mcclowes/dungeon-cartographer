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

/** Room purpose/type for thematic placement */
export enum RoomType {
  GENERIC = "generic",
  ENTRANCE = "entrance",
  TREASURE = "treasure",
  GUARD = "guard",
  STORAGE = "storage",
  THRONE = "throne",
  BARRACKS = "barracks",
  CHAPEL = "chapel",
}

/** Room size classification */
export enum RoomSize {
  TINY = "tiny",       // < 9 tiles (closets, alcoves)
  SMALL = "small",     // 9-25 tiles (chambers)
  MEDIUM = "medium",   // 25-64 tiles (halls)
  LARGE = "large",     // 64-144 tiles (great halls)
  HUGE = "huge",       // > 144 tiles (throne rooms, arenas)
}

/** Room metadata for room-aware features */
export interface Room {
  /** Unique identifier for the room */
  id: number;
  /** Bounding rectangle of the room */
  bounds: Rect;
  /** Center point of the room */
  center: Point;
  /** All tiles belonging to this room */
  tiles: Point[];
  /** Room size classification */
  size: RoomSize;
  /** Room type/purpose (can be assigned) */
  type: RoomType;
  /** Area in tiles */
  area: number;
  /** Whether this room has been connected to the dungeon */
  connected: boolean;
}

/** Generator result with metadata */
export interface GeneratorResult<T = Grid> {
  grid: T;
  metadata?: Record<string, unknown>;
}

/** Extended generator result with room information */
export interface DungeonResult extends GeneratorResult<Grid> {
  /** List of rooms in the dungeon */
  rooms: Room[];
}
