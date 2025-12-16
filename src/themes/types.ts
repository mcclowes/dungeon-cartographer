import type { Grid } from "../types";
import type { PrefabCategory } from "../prefabs/types";

/**
 * Available dungeon themes
 */
export type ThemeName =
  | "crypt"
  | "castle"
  | "cave"
  | "temple"
  | "prison"
  | "sewer"
  | "mine"
  | "library";

/**
 * Generator type to use as base
 */
export type GeneratorType = "bsp" | "cave" | "voronoi" | "poisson" | "agent" | "dla";

/**
 * Post-processing options for themes
 */
export interface ThemePostProcess {
  /** Add doors between rooms */
  addDoors?: boolean;
  /** Door probability (0-1) */
  doorProbability?: number;
  /** Add secret doors */
  addSecretDoors?: boolean;
  /** Secret door probability (0-1) */
  secretDoorProbability?: number;
  /** Add water features */
  addWater?: boolean;
  /** Water coverage (0-1) */
  waterCoverage?: number;
  /** Add rubble/debris */
  addRubble?: boolean;
  /** Rubble density (0-1) */
  rubbleDensity?: number;
  /** Erode walls for organic look */
  erodeWalls?: boolean;
  /** Erosion iterations */
  erosionIterations?: number;
}

/**
 * Prefab configuration for themes
 */
export interface ThemePrefabConfig {
  /** Enable prefab injection */
  enabled: boolean;
  /** Categories to include */
  categories?: PrefabCategory[];
  /** Maximum prefabs to place */
  maxPrefabs?: number;
  /** Minimum distance between prefabs */
  minDistance?: number;
}

/**
 * Feature decoration probabilities
 */
export interface ThemeFeatures {
  /** Probability of treasure in rooms (0-1) */
  treasure?: number;
  /** Probability of traps (0-1) */
  traps?: number;
  /** Probability of furniture (0-1) */
  furniture?: number;
  /** Probability of statues/pillars (0-1) */
  statues?: number;
  /** Probability of altars (0-1) */
  altars?: number;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  /** Theme identifier */
  name: ThemeName;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Base generator to use */
  generator: GeneratorType;
  /** Generator-specific options */
  generatorOptions?: Record<string, unknown>;
  /** Post-processing settings */
  postProcess: ThemePostProcess;
  /** Prefab configuration */
  prefabs: ThemePrefabConfig;
  /** Feature probabilities */
  features: ThemeFeatures;
}

/**
 * Options for generating a themed dungeon
 */
export interface ThemedDungeonOptions {
  /** Grid size */
  size: number;
  /** Theme to use */
  theme: ThemeName;
  /** Random seed for reproducibility */
  seed?: number;
  /** Override theme's generator options */
  generatorOptions?: Record<string, unknown>;
  /** Override theme's post-process options */
  postProcess?: Partial<ThemePostProcess>;
  /** Override theme's prefab options */
  prefabs?: Partial<ThemePrefabConfig>;
  /** Override theme's feature options */
  features?: Partial<ThemeFeatures>;
  /** Dungeon level (affects prefab selection) */
  level?: number;
}

/**
 * Result of themed dungeon generation
 */
export interface ThemedDungeonResult {
  /** The generated grid */
  grid: Grid;
  /** Theme that was used */
  theme: ThemeName;
  /** Seed used for generation */
  seed: number;
  /** Metadata about generation */
  metadata: {
    generator: GeneratorType;
    prefabsPlaced: number;
    featuresAdded: number;
  };
}
