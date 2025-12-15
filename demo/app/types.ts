import type { Grid } from "dungeon-cartographer";
import type { RenderStyle } from "dungeon-cartographer/render";

export type GeneratorType =
  | "bsp"
  | "cave"
  | "dla"
  | "drunkard"
  | "drunkard-weighted"
  | "drunkard-multi"
  | "hybrid"
  | "hybrid-radial"
  | "maze"
  | "maze-prims"
  | "maze-division"
  | "perlin"
  | "perlin-continent"
  | "voronoi"
  | "wfc";

export interface GeneratorConfig {
  name: string;
  description: string;
  category: string;
  defaultStyle: RenderStyle;
  availableStyles: RenderStyle[];
  generate: (size: number, params: GeneratorParams) => Grid;
}

export interface GeneratorParams {
  // BSP
  minPartitionSize?: number;
  maxDepth?: number;
  minRoomSize?: number;
  padding?: number;
  addDoors?: boolean;
  addFeatures?: boolean;

  // Debris features
  rubbleChance?: number;
  collapsedChance?: number;
  fallenColumnChance?: number;

  // Cave
  iterations?: number;
  initialFillProbability?: number;

  // Drunkard Walk
  fillPercentage?: number;
  numWalkers?: number;

  // Maze
  addStartEnd?: boolean;
  loopChance?: number;
  openness?: number;

  // Perlin
  scale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  waterLevel?: number;
  sandLevel?: number;
  grassLevel?: number;
  forestLevel?: number;
  islandMode?: boolean;
  islandFalloff?: number;
  erosionIterations?: number;

  // WFC
  seedRadius?: number;

  // Voronoi
  numRooms?: number;
  minRoomDistance?: number;
  relaxation?: number;

  // DLA
  stickiness?: number;
  spawnMode?: "edge" | "random";

  // Hybrid
  splitDirection?: "horizontal" | "vertical" | "diagonal" | "radial";
  blendMode?: "hard" | "soft" | "scattered";
  blendWidth?: number;
  connectRegions?: boolean;
}

export interface RenderParams {
  showGrid: boolean;
  animateReveal: boolean;
  showTitle: boolean;
  mapTitle: string;
}

// Mulberry32 seeded PRNG
export function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export const DEFAULT_PARAMS: Record<GeneratorType, GeneratorParams> = {
  bsp: {
    minPartitionSize: 6,
    maxDepth: 4,
    minRoomSize: 3,
    padding: 1,
    addDoors: true,
    addFeatures: true,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
  cave: {
    iterations: 3,
    initialFillProbability: 0.5,
    addFeatures: true,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
  dla: {
    fillPercentage: 0.35,
    stickiness: 0.8,
    spawnMode: "edge",
    addFeatures: false,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
  wfc: {
    seedRadius: 5,
  },
  drunkard: {
    fillPercentage: 0.45,
  },
  "drunkard-weighted": {
    fillPercentage: 0.45,
  },
  "drunkard-multi": {
    fillPercentage: 0.45,
    numWalkers: 6,
  },
  maze: {
    addStartEnd: true,
    loopChance: 0,
    openness: 0,
  },
  "maze-prims": {
    addStartEnd: true,
    loopChance: 0,
    openness: 0,
  },
  "maze-division": {
    addStartEnd: true,
    loopChance: 0,
    openness: 0,
  },
  perlin: {
    scale: 0.08,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    waterLevel: 0.35,
    sandLevel: 0.4,
    grassLevel: 0.6,
    forestLevel: 0.75,
    islandMode: true,
    islandFalloff: 1.8,
    erosionIterations: 2,
  },
  "perlin-continent": {
    scale: 0.04,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    waterLevel: 0.35,
    sandLevel: 0.4,
    grassLevel: 0.6,
    forestLevel: 0.75,
    islandMode: false,
    islandFalloff: 1.8,
    erosionIterations: 2,
  },
  voronoi: {
    numRooms: 8,
    minRoomDistance: 4,
    relaxation: 2,
    addDoors: true,
    addFeatures: false,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
  hybrid: {
    splitDirection: "diagonal",
    blendMode: "soft",
    blendWidth: 4,
    connectRegions: true,
    addFeatures: false,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
  "hybrid-radial": {
    splitDirection: "radial",
    blendMode: "soft",
    blendWidth: 6,
    connectRegions: true,
    addFeatures: false,
    rubbleChance: 0,
    collapsedChance: 0,
    fallenColumnChance: 0,
  },
};

// Preset configurations for quick selection
export interface Preset {
  name: string;
  description: string;
  generator: GeneratorType;
  size: number;
  params: GeneratorParams;
}

export const PRESETS: Preset[] = [
  {
    name: "Classic Dungeon",
    description: "Traditional room-and-corridor layout",
    generator: "bsp",
    size: 48,
    params: { minPartitionSize: 8, maxDepth: 4, addDoors: true, addFeatures: true },
  },
  {
    name: "Cavern System",
    description: "Organic cave network",
    generator: "cave",
    size: 48,
    params: { iterations: 4, initialFillProbability: 0.45, addFeatures: true },
  },
  {
    name: "Coral Growth",
    description: "Organic DLA pattern",
    generator: "dla",
    size: 48,
    params: { fillPercentage: 0.4, stickiness: 0.7, spawnMode: "edge" },
  },
  {
    name: "Organic Rooms",
    description: "Irregular Voronoi chambers",
    generator: "voronoi",
    size: 48,
    params: { numRooms: 10, relaxation: 2, addDoors: true },
  },
  {
    name: "Labyrinth",
    description: "Dense winding maze",
    generator: "maze",
    size: 32,
    params: { addStartEnd: true, loopChance: 0, openness: 0 },
  },
  {
    name: "Open Maze",
    description: "Maze with shortcuts",
    generator: "maze-prims",
    size: 32,
    params: { addStartEnd: true, loopChance: 0.15, openness: 0.1 },
  },
  {
    name: "Tropical Island",
    description: "Island surrounded by water",
    generator: "perlin",
    size: 64,
    params: { scale: 0.06, islandMode: true, islandFalloff: 2.0, erosionIterations: 3 },
  },
  {
    name: "Mine Entrance",
    description: "Dungeon meets cavern",
    generator: "hybrid",
    size: 48,
    params: { splitDirection: "diagonal", blendMode: "soft", blendWidth: 5 },
  },
  {
    name: "Continental",
    description: "Large landmass terrain",
    generator: "perlin-continent",
    size: 64,
    params: { scale: 0.03, islandMode: false, erosionIterations: 2 },
  },
];
