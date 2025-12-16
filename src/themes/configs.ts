import type { ThemeConfig, ThemeName } from "./types";

/**
 * Crypt theme - underground burial chambers
 * Tight corridors, lots of doors, treasure rooms
 */
export const cryptTheme: ThemeConfig = {
  name: "crypt",
  displayName: "Crypt",
  description: "Underground burial chambers with tight corridors and hidden treasures",
  generator: "bsp",
  generatorOptions: {
    minRoomSize: 4,
    maxRoomSize: 8,
    addDoors: false, // We'll add them in post-process
  },
  postProcess: {
    addDoors: true,
    doorProbability: 0.8,
    addSecretDoors: true,
    secretDoorProbability: 0.15,
    addRubble: true,
    rubbleDensity: 0.05,
  },
  prefabs: {
    enabled: true,
    categories: ["treasure", "shrine", "trap"],
    maxPrefabs: 3,
    minDistance: 8,
  },
  features: {
    treasure: 0.15,
    traps: 0.1,
    statues: 0.05,
    altars: 0.08,
  },
};

/**
 * Castle theme - grand halls and throne rooms
 * Large rooms, symmetrical layouts
 */
export const castleTheme: ThemeConfig = {
  name: "castle",
  displayName: "Castle",
  description: "Grand halls, throne rooms, and fortified chambers",
  generator: "bsp",
  generatorOptions: {
    minRoomSize: 6,
    maxRoomSize: 14,
    addDoors: false,
  },
  postProcess: {
    addDoors: true,
    doorProbability: 0.9,
    addSecretDoors: true,
    secretDoorProbability: 0.1,
  },
  prefabs: {
    enabled: true,
    categories: ["entrance", "throne", "armory", "library"],
    maxPrefabs: 4,
    minDistance: 10,
  },
  features: {
    treasure: 0.08,
    furniture: 0.2,
    statues: 0.12,
  },
};

/**
 * Cave theme - natural caverns
 * Organic shapes, water features
 */
export const caveTheme: ThemeConfig = {
  name: "cave",
  displayName: "Cave",
  description: "Natural caverns with winding passages and underground pools",
  generator: "cave",
  generatorOptions: {
    initialFillProbability: 0.45,
    iterations: 5,
  },
  postProcess: {
    addWater: true,
    waterCoverage: 0.08,
    erodeWalls: true,
    erosionIterations: 2,
  },
  prefabs: {
    enabled: false, // Caves are more organic, fewer prefabs
  },
  features: {
    treasure: 0.05,
    traps: 0.03,
  },
};

/**
 * Temple theme - sacred spaces
 * Symmetrical, lots of altars and statues
 */
export const templeTheme: ThemeConfig = {
  name: "temple",
  displayName: "Temple",
  description: "Sacred chambers with altars, statues, and ritual spaces",
  generator: "bsp",
  generatorOptions: {
    minRoomSize: 5,
    maxRoomSize: 12,
    addDoors: false,
  },
  postProcess: {
    addDoors: true,
    doorProbability: 0.7,
    addSecretDoors: true,
    secretDoorProbability: 0.2,
  },
  prefabs: {
    enabled: true,
    categories: ["shrine", "boss", "treasure", "puzzle"],
    maxPrefabs: 4,
    minDistance: 8,
  },
  features: {
    treasure: 0.1,
    traps: 0.12,
    statues: 0.2,
    altars: 0.15,
  },
};

/**
 * Prison theme - cells and guard rooms
 * Grid-like layout, many small rooms
 */
export const prisonTheme: ThemeConfig = {
  name: "prison",
  displayName: "Prison",
  description: "Cells, guard rooms, and interrogation chambers",
  generator: "bsp",
  generatorOptions: {
    minRoomSize: 3,
    maxRoomSize: 6,
    addDoors: false,
  },
  postProcess: {
    addDoors: true,
    doorProbability: 0.95,
    addSecretDoors: true,
    secretDoorProbability: 0.08,
    addRubble: true,
    rubbleDensity: 0.03,
  },
  prefabs: {
    enabled: true,
    categories: ["prison", "trap"],
    maxPrefabs: 2,
    minDistance: 6,
  },
  features: {
    traps: 0.08,
    furniture: 0.1,
  },
};

/**
 * Sewer theme - underground waterways
 * Lots of water, winding passages
 */
export const sewerTheme: ThemeConfig = {
  name: "sewer",
  displayName: "Sewer",
  description: "Underground waterways with bridges and maintenance tunnels",
  generator: "agent",
  generatorOptions: {
    numAgents: 4,
    stepsPerAgent: 150,
  },
  postProcess: {
    addWater: true,
    waterCoverage: 0.25,
    addRubble: true,
    rubbleDensity: 0.08,
    erodeWalls: true,
    erosionIterations: 1,
  },
  prefabs: {
    enabled: false,
  },
  features: {
    treasure: 0.03,
    traps: 0.05,
  },
};

/**
 * Mine theme - excavated tunnels
 * Long corridors, support structures
 */
export const mineTheme: ThemeConfig = {
  name: "mine",
  displayName: "Mine",
  description: "Excavated tunnels with support beams and ore deposits",
  generator: "dla",
  generatorOptions: {
    particles: 800,
    stickiness: 0.4,
  },
  postProcess: {
    addRubble: true,
    rubbleDensity: 0.1,
    erodeWalls: true,
    erosionIterations: 1,
  },
  prefabs: {
    enabled: false,
  },
  features: {
    treasure: 0.08,
    traps: 0.06,
  },
};

/**
 * Library theme - halls of knowledge
 * Medium rooms, lots of furniture
 */
export const libraryTheme: ThemeConfig = {
  name: "library",
  displayName: "Library",
  description: "Halls of ancient knowledge with towering bookshelves",
  generator: "voronoi",
  generatorOptions: {
    numRooms: 8,
  },
  postProcess: {
    addDoors: true,
    doorProbability: 0.85,
    addSecretDoors: true,
    secretDoorProbability: 0.25,
  },
  prefabs: {
    enabled: true,
    categories: ["library", "puzzle", "treasure"],
    maxPrefabs: 3,
    minDistance: 8,
  },
  features: {
    treasure: 0.12,
    traps: 0.15,
    furniture: 0.3,
    statues: 0.08,
  },
};

/**
 * All theme configurations
 */
export const themes: Record<ThemeName, ThemeConfig> = {
  crypt: cryptTheme,
  castle: castleTheme,
  cave: caveTheme,
  temple: templeTheme,
  prison: prisonTheme,
  sewer: sewerTheme,
  mine: mineTheme,
  library: libraryTheme,
};

/**
 * Get a theme configuration by name
 */
export function getTheme(name: ThemeName): ThemeConfig {
  return themes[name];
}

/**
 * Get all available theme names
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}
