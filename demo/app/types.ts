import type { Grid } from "dungeon-cartographer";
import type { RenderStyle } from "dungeon-cartographer/render";

export type GeneratorType =
  | "bsp"
  | "cave"
  | "drunkard"
  | "drunkard-weighted"
  | "drunkard-multi"
  | "maze"
  | "maze-prims"
  | "maze-division"
  | "perlin"
  | "perlin-continent"
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
}

export interface RenderParams {
  showGrid: boolean;
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
  },
  cave: {
    iterations: 3,
    initialFillProbability: 0.5,
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
};
