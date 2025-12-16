import type { Grid } from "dungeon-cartographer";
import type { RenderStyle } from "dungeon-cartographer/render";

export type GeneratorType =
  | "ai"
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

  // Room Shapes (BSP)
  useRectangle?: boolean;
  useComposite?: boolean;
  useTemplate?: boolean;
  useCellular?: boolean;
  usePolygon?: boolean;
  useNibbleCorners?: boolean;
  useAddAlcoves?: boolean;
  useRoundCorners?: boolean;
  useAddPillars?: boolean;

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

  // Furniture
  addFurniture?: boolean;
  furnitureDensity?: number;
}
