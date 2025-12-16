import type { Grid, Point, Rect } from "../types";

/**
 * A prefab room is a hand-designed room layout that can be
 * injected into procedurally generated dungeons.
 */
export interface Prefab {
  /** Unique identifier for this prefab */
  id: string;
  /** Display name */
  name: string;
  /** Category for filtering (e.g., "entrance", "boss", "treasure") */
  category: PrefabCategory;
  /** The tile data for this room */
  grid: Grid;
  /** Width of the prefab */
  width: number;
  /** Height of the prefab */
  height: number;
  /** Entry/exit points where corridors can connect */
  connections: PrefabConnection[];
  /** Optional tags for filtering */
  tags?: string[];
  /** Whether this prefab can be rotated (default: true) */
  allowRotation?: boolean;
  /** Whether this prefab can be mirrored (default: true) */
  allowMirror?: boolean;
  /** Minimum dungeon level for this prefab to appear */
  minLevel?: number;
  /** Maximum dungeon level for this prefab to appear */
  maxLevel?: number;
  /** Weight for random selection (higher = more likely, default: 1) */
  weight?: number;
}

/**
 * Connection point on a prefab where corridors can attach
 */
export interface PrefabConnection {
  /** Position relative to prefab origin (top-left) */
  position: Point;
  /** Direction the connection faces (outward from room) */
  direction: "north" | "south" | "east" | "west";
  /** Whether this connection is required (must be connected) */
  required?: boolean;
}

/**
 * Prefab categories
 */
export type PrefabCategory =
  | "entrance"
  | "exit"
  | "boss"
  | "treasure"
  | "trap"
  | "puzzle"
  | "shrine"
  | "library"
  | "armory"
  | "prison"
  | "throne"
  | "generic";

/**
 * A placed prefab in the dungeon
 */
export interface PlacedPrefab {
  /** The prefab that was placed */
  prefab: Prefab;
  /** Top-left position in the dungeon grid */
  position: Point;
  /** Rotation applied (0, 90, 180, 270 degrees) */
  rotation: 0 | 90 | 180 | 270;
  /** Whether the prefab was mirrored */
  mirrored: boolean;
  /** Bounding box in dungeon coordinates */
  bounds: Rect;
}

/**
 * Options for prefab placement
 */
export interface PrefabPlacementOptions {
  /** Prefabs to consider for placement */
  prefabs: Prefab[];
  /** Maximum number of prefabs to place (default: based on dungeon size) */
  maxPrefabs?: number;
  /** Minimum distance between prefabs (default: 5) */
  minDistance?: number;
  /** Categories to include (default: all) */
  categories?: PrefabCategory[];
  /** Tags to filter by (prefab must have at least one) */
  tags?: string[];
  /** Current dungeon level for filtering (default: 1) */
  level?: number;
  /** Whether to ensure all prefabs are connected to main dungeon (default: true) */
  ensureConnectivity?: boolean;
  /** Padding around prefabs (default: 1) */
  padding?: number;
}

/**
 * Result of prefab placement
 */
export interface PrefabPlacementResult {
  /** The modified grid with prefabs placed */
  grid: Grid;
  /** List of placed prefabs */
  placedPrefabs: PlacedPrefab[];
  /** Prefabs that couldn't be placed */
  failedPrefabs: Prefab[];
}
