import type { Preset } from "../types";

export const PRESETS: Preset[] = [
  {
    name: "Classic Dungeon",
    description: "Traditional room-and-corridor layout",
    generator: "bsp",
    size: 48,
    params: { minPartitionSize: 8, maxDepth: 4, addDoors: true, addFeatures: true },
  },
  {
    name: "Furnished Dungeon",
    description: "Lived-in dungeon with furniture",
    generator: "bsp",
    size: 48,
    params: { minPartitionSize: 8, maxDepth: 4, addDoors: true, addFeatures: true, addFurniture: true, furnitureDensity: 0.2 },
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
