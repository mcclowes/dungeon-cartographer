/**
 * AI Map Generation Schema
 * Defines the vocabulary and structure for AI-generated maps
 */

import type { Grid } from "dungeon-cartographer";

/** Tile types for AI generation (compatible with dungeon renderer) */
export const AI_TILE_TYPES = {
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  SECRET_DOOR: 3,
  CORRIDOR: 4,
  STAIRS_UP: 5,
  STAIRS_DOWN: 6,
} as const;

export type AITileType = (typeof AI_TILE_TYPES)[keyof typeof AI_TILE_TYPES];

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

/** Feature primitives for map generation */
export interface RoomFeature {
  type: "room";
  name?: string;
  position?: Position;
  size?: Size;
  shape?: Shape;
}

export interface CorridorFeature {
  type: "corridor";
  from?: Position;
  to?: Position;
  width?: 1 | 2 | 3;
}

export interface DoorFeature {
  type: "door" | "secret_door";
  position?: { x: number; y: number };
}

export interface SpecialFeature {
  type: "stairs_up" | "stairs_down" | "pillar" | "altar" | "throne";
  position?: Position | { x: number; y: number };
}

export type MapFeature =
  | RoomFeature
  | CorridorFeature
  | DoorFeature
  | SpecialFeature;

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
      if (cell < 0 || cell > 6) return false;
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
