import {
  generateBSP,
  generateCave,
  generateDLA,
  generateDrunkardWalk,
  generateHybrid,
  generateMaze,
  generatePerlin,
  generateVoronoi,
  generateWFC,
  generatePoisson,
  generateAgent,
} from "dungeon-cartographer";
import type { GeneratorType, GeneratorConfig } from "../types";
import { buildRoomShapeOptions, buildFeatureOptions } from "../utils";

export const CATEGORIES = ["AI", "Dungeon", "Hybrid", "Random Walk", "Maze", "Terrain"];

export const GENERATORS: Record<GeneratorType, GeneratorConfig> = {
  ai: {
    name: "AI Generator",
    description: "Describe your map in natural language",
    category: "AI",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size) => {
      // AI generator uses async API, this is a placeholder
      // Actual generation is handled by AIMapGenerator component
      return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => 0)
      );
    },
  },
  bsp: {
    name: "BSP Dungeon",
    description: "Binary Space Partitioning rooms & corridors",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateBSP(size, {
        minPartitionSize: params.minPartitionSize,
        maxDepth: params.maxDepth,
        minRoomSize: params.minRoomSize,
        padding: params.padding,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
        roomShapeOptions: buildRoomShapeOptions(params),
      }),
  },
  cave: {
    name: "Cellular Automata",
    description: "Organic cave-like structures",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateCave(size, {
        iterations: params.iterations,
        initialFillProbability: params.initialFillProbability,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  dla: {
    name: "DLA Growth",
    description: "Diffusion-limited aggregation patterns",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDLA(size, {
        fillPercentage: params.fillPercentage,
        stickiness: params.stickiness,
        spawnMode: params.spawnMode,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  voronoi: {
    name: "Voronoi Rooms",
    description: "Organic room shapes via tessellation",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateVoronoi(size, {
        numRooms: params.numRooms,
        minRoomDistance: params.minRoomDistance,
        relaxation: params.relaxation,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  wfc: {
    name: "Wave Function Collapse",
    description: "Constraint-based procedural generation",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateWFC(size, {
        seedRadius: params.seedRadius,
      }),
  },
  poisson: {
    name: "Poisson Disk",
    description: "Well-distributed rooms via Poisson sampling",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generatePoisson(size, {
        minDistance: params.minDistance,
        minRoomSize: params.minRoomSize,
        maxRoomSize: params.maxRoomSize,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
        roomShapeOptions: buildRoomShapeOptions(params),
      }),
  },
  agent: {
    name: "Agent-Based",
    description: "Digger agents carve organic dungeons",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateAgent(size, {
        numAgents: params.numAgents,
        stepsPerAgent: params.stepsPerAgent,
        roomChance: params.roomChance,
        minRoomSize: params.minRoomSize,
        maxRoomSize: params.maxRoomSize,
        turnChance: params.turnChance,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  hybrid: {
    name: "Hybrid (Diagonal)",
    description: "BSP dungeon meets organic cave",
    category: "Hybrid",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateHybrid(size, {
        splitDirection: params.splitDirection ?? "diagonal",
        blendMode: params.blendMode ?? "soft",
        blendWidth: params.blendWidth ?? 4,
        connectRegions: params.connectRegions ?? true,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  "hybrid-radial": {
    name: "Hybrid (Radial)",
    description: "Dungeon core with cave perimeter",
    category: "Hybrid",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateHybrid(size, {
        splitDirection: "radial",
        splitPosition: 0.4,
        blendMode: params.blendMode ?? "soft",
        blendWidth: params.blendWidth ?? 6,
        connectRegions: params.connectRegions ?? true,
        addFeatures: params.addFeatures,
        featureOptions: buildFeatureOptions(params),
      }),
  },
  drunkard: {
    name: "Drunkard's Walk",
    description: "Simple random walk",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "simple",
        fillPercentage: params.fillPercentage,
      }),
  },
  "drunkard-weighted": {
    name: "Weighted Walk",
    description: "Biased towards unexplored areas",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "weighted",
        fillPercentage: params.fillPercentage,
      }),
  },
  "drunkard-multi": {
    name: "Multi Walker",
    description: "Multiple simultaneous walkers",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "multiple",
        fillPercentage: params.fillPercentage,
        numWalkers: params.numWalkers,
      }),
  },
  maze: {
    name: "Maze (Backtracking)",
    description: "Deep, winding passages",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "backtracking",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  "maze-prims": {
    name: "Maze (Prim's)",
    description: "Shorter dead ends",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "prims",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  "maze-division": {
    name: "Maze (Division)",
    description: "Grid-like recursive division",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "division",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  perlin: {
    name: "Perlin Island",
    description: "Island terrain with Perlin noise",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size, params) =>
      generatePerlin(size, {
        scale: params.scale,
        octaves: params.octaves,
        persistence: params.persistence,
        lacunarity: params.lacunarity,
        waterLevel: params.waterLevel,
        sandLevel: params.sandLevel,
        grassLevel: params.grassLevel,
        forestLevel: params.forestLevel,
        islandMode: params.islandMode,
        islandFalloff: params.islandFalloff,
        erosionIterations: params.erosionIterations,
      }),
  },
  "perlin-continent": {
    name: "Perlin Continent",
    description: "Large-scale terrain",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size, params) =>
      generatePerlin(size, {
        scale: params.scale,
        octaves: params.octaves,
        persistence: params.persistence,
        lacunarity: params.lacunarity,
        waterLevel: params.waterLevel,
        sandLevel: params.sandLevel,
        grassLevel: params.grassLevel,
        forestLevel: params.forestLevel,
        islandMode: params.islandMode,
        islandFalloff: params.islandFalloff,
        erosionIterations: params.erosionIterations,
      }),
  },
};
