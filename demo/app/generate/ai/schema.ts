/**
 * AI Map Generation Schema
 * Defines the vocabulary and structure for AI-generated maps
 */

import type { Grid } from "dungeon-cartographer";

/** Tile types for AI generation (matches TileType enum from dungeon-cartographer) */
export const AI_TILE_TYPES = {
  // Structure
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  SECRET_DOOR: 3,
  CORRIDOR: 4,
  // Stairs/elevation
  STAIRS_UP: 5,
  STAIRS_DOWN: 6,
  PIT: 7,
  // Treasure/loot
  TREASURE: 8,
  CHEST: 9,
  // Traps
  TRAP: 10,
  TRAP_PIT: 11,
  // Water/environmental
  WATER: 12,
  DEEP_WATER: 13,
  LAVA: 14,
  // Furniture/objects
  CRATE: 15,
  BARREL: 16,
  BED: 17,
  TABLE: 18,
  CHAIR: 19,
  BOOKSHELF: 20,
  CARPET: 21,
  FIREPLACE: 22,
  STATUE: 23,
  ALTAR: 24,
  // Debris/destruction
  RUBBLE: 25,
  COLLAPSED: 26,
  FALLEN_COLUMN: 27,
} as const;

export type AITileType = (typeof AI_TILE_TYPES)[keyof typeof AI_TILE_TYPES];

export const MAX_TILE_VALUE = 27;

/** Spatial positions for placement guidance */
export const POSITIONS = [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
  "center",
] as const;

export type Position = (typeof POSITIONS)[number];

/** Size descriptors for rooms/areas */
export const SIZES = ["tiny", "small", "medium", "large", "huge"] as const;

export type Size = (typeof SIZES)[number];

/** Shape descriptors */
export const SHAPES = [
  "square",
  "rectangular",
  "circular",
  "irregular",
  "L-shaped",
  "T-shaped",
] as const;

export type Shape = (typeof SHAPES)[number];

/** Location archetypes with thematic guidance */
export const LOCATION_ARCHETYPES = {
  dungeon: {
    description: "Underground complex with rooms, corridors, and hazards",
    commonFeatures: ["cells", "torture chamber", "guard room", "storage"],
    atmosphere: "dark, damp, oppressive",
  },
  castle: {
    description: "Fortified structure with defensive features",
    commonFeatures: ["throne room", "great hall", "armory", "barracks"],
    atmosphere: "imposing, regal, defensive",
  },
  cave: {
    description: "Natural cavern system with organic shapes",
    commonFeatures: ["stalactites", "underground pool", "narrow passages"],
    atmosphere: "natural, echoing, mysterious",
  },
  temple: {
    description: "Sacred place of worship",
    commonFeatures: ["altar", "sanctuary", "meditation chambers", "crypt"],
    atmosphere: "sacred, quiet, reverent",
  },
  tavern: {
    description: "Public house for food and drink",
    commonFeatures: ["common room", "bar", "kitchen", "private rooms"],
    atmosphere: "warm, noisy, welcoming",
  },
  prison: {
    description: "Facility for holding captives",
    commonFeatures: ["cells", "interrogation room", "warden office", "yard"],
    atmosphere: "oppressive, confined, desperate",
  },
  maze: {
    description: "Labyrinthine passages designed to confuse",
    commonFeatures: ["dead ends", "false paths", "hidden doors"],
    atmosphere: "confusing, disorienting, claustrophobic",
  },
  mansion: {
    description: "Large private residence",
    commonFeatures: ["foyer", "ballroom", "library", "bedrooms"],
    atmosphere: "opulent, grand, secretive",
  },
  library: {
    description: "Repository of knowledge",
    commonFeatures: ["reading rooms", "stacks", "archives", "study"],
    atmosphere: "quiet, dusty, scholarly",
  },
  arena: {
    description: "Combat or performance venue",
    commonFeatures: ["fighting pit", "spectator seating", "champion quarters"],
    atmosphere: "violent, exciting, competitive",
  },
} as const;

export type LocationArchetype = keyof typeof LOCATION_ARCHETYPES;

/** Furniture types that can be placed in rooms */
export const FURNITURE_TYPES = [
  "crate",
  "barrel",
  "bed",
  "table",
  "chair",
  "bookshelf",
  "carpet",
  "fireplace",
  "statue",
  "altar",
] as const;

export type FurnitureType = (typeof FURNITURE_TYPES)[number];

/** Hazard types for dangerous areas */
export const HAZARD_TYPES = ["trap", "trap_pit", "pit", "water", "deep_water", "lava"] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];

/** Treasure/loot types */
export const LOOT_TYPES = ["treasure", "chest"] as const;

export type LootType = (typeof LOOT_TYPES)[number];

/** Debris/destruction types */
export const DEBRIS_TYPES = ["rubble", "collapsed", "fallen_column"] as const;

export type DebrisType = (typeof DEBRIS_TYPES)[number];

/** Feature primitives for map generation */
export interface RoomFeature {
  type: "room";
  name?: string;
  position?: Position;
  size?: Size;
  shape?: Shape;
  /** Furniture to place in this room */
  furniture?: FurnitureType[];
  /** Whether this room has been damaged/destroyed */
  ruined?: boolean;
}

export interface CorridorFeature {
  type: "corridor";
  from?: Position;
  to?: Position;
  width?: 1 | 2 | 3;
  /** Whether corridor contains hazards */
  trapped?: boolean;
}

export interface DoorFeature {
  type: "door" | "secret_door";
  position?: { x: number; y: number };
}

export interface StairsFeature {
  type: "stairs_up" | "stairs_down";
  position?: Position | { x: number; y: number };
}

export interface HazardFeature {
  type: "hazard";
  hazardType: HazardType;
  position?: Position | { x: number; y: number };
  /** Size of hazard area */
  size?: Size;
}

export interface LootFeature {
  type: "loot";
  lootType: LootType;
  position?: Position | { x: number; y: number };
}

export interface FurnitureFeature {
  type: "furniture";
  furnitureType: FurnitureType;
  position?: Position | { x: number; y: number };
}

export interface DebrisFeature {
  type: "debris";
  debrisType: DebrisType;
  position?: Position | { x: number; y: number };
}

export type MapFeature =
  | RoomFeature
  | CorridorFeature
  | DoorFeature
  | StairsFeature
  | HazardFeature
  | LootFeature
  | FurnitureFeature
  | DebrisFeature;

/** AI generation response structure */
export interface AIMapResponse {
  grid: Grid;
  metadata: {
    interpretation: string;
    archetype?: LocationArchetype;
    features: string[];
    roomCount?: number;
    corridorCount?: number;
  };
}

/** AI generation options */
export interface AIGenerationOptions {
  width?: number;
  height?: number;
  archetype?: LocationArchetype;
  onProgress?: (status: string) => void;
}

/** Validation utilities */
export function validateGrid(grid: unknown): grid is Grid {
  if (!Array.isArray(grid)) return false;
  if (grid.length === 0) return false;

  const width = grid[0]?.length;
  if (typeof width !== "number" || width === 0) return false;

  for (const row of grid) {
    if (!Array.isArray(row)) return false;
    if (row.length !== width) return false;
    for (const cell of row) {
      if (typeof cell !== "number") return false;
      if (cell < 0 || cell > MAX_TILE_VALUE) return false;
    }
  }

  return true;
}

export function enforceGridBoundaries(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      // Force walls on boundary
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return AI_TILE_TYPES.WALL;
      }
      return cell;
    })
  );
}

export function createEmptyGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => AI_TILE_TYPES.WALL)
  );
}

/** Get tile type name for debugging/display */
export function getTileTypeName(value: number): string {
  const entries = Object.entries(AI_TILE_TYPES);
  const found = entries.find(([_, v]) => v === value);
  return found ? found[0] : "UNKNOWN";
}
