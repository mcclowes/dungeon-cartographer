"use client";

import styles from "./ParameterControls.module.scss";
import type { GeneratorType, GeneratorParams } from "../types";

interface ParamConfig {
  label: string;
  type: "number" | "range" | "boolean" | "select";
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
}

const PARAM_CONFIGS: Record<string, ParamConfig> = {
  // BSP
  minPartitionSize: { label: "Min Partition", type: "range", min: 4, max: 12, step: 1 },
  maxDepth: { label: "Max Depth", type: "range", min: 2, max: 6, step: 1 },
  minRoomSize: { label: "Min Room Size", type: "range", min: 2, max: 6, step: 1 },
  padding: { label: "Padding", type: "range", min: 0, max: 3, step: 1 },
  addDoors: { label: "Add Doors", type: "boolean" },
  addFeatures: { label: "Add Features (stairs, treasure, traps)", type: "boolean" },

  // Room Shapes
  useRectangle: { label: "Rectangle", type: "boolean" },
  useComposite: { label: "Composite (L, T, +)", type: "boolean" },
  useTemplate: { label: "Templates", type: "boolean" },
  useCellular: { label: "Cellular (organic)", type: "boolean" },
  usePolygon: { label: "Polygon (hex, oct)", type: "boolean" },

  // Shape Modifiers
  useNibbleCorners: { label: "Nibble Corners", type: "boolean" },
  useAddAlcoves: { label: "Add Alcoves", type: "boolean" },
  useRoundCorners: { label: "Round Corners", type: "boolean" },
  useAddPillars: { label: "Add Pillars", type: "boolean" },

  // Debris features
  rubbleChance: { label: "Rubble Chance", type: "range", min: 0, max: 0.5, step: 0.05 },
  collapsedChance: { label: "Cave-in Chance", type: "range", min: 0, max: 0.3, step: 0.05 },
  fallenColumnChance: { label: "Fallen Columns", type: "range", min: 0, max: 0.3, step: 0.05 },

  // Cave
  iterations: { label: "Iterations", type: "range", min: 1, max: 10, step: 1 },
  initialFillProbability: { label: "Fill Density", type: "range", min: 0.3, max: 0.7, step: 0.05 },

  // Drunkard Walk
  fillPercentage: { label: "Fill %", type: "range", min: 0.2, max: 0.7, step: 0.05 },
  numWalkers: { label: "Walkers", type: "range", min: 2, max: 10, step: 1 },

  // Maze
  addStartEnd: { label: "Start/End Markers", type: "boolean" },
  loopChance: { label: "Loop Chance", type: "range", min: 0, max: 0.3, step: 0.05 },
  openness: { label: "Openness", type: "range", min: 0, max: 0.3, step: 0.05 },

  // Perlin
  scale: { label: "Scale", type: "range", min: 0.02, max: 0.15, step: 0.01 },
  octaves: { label: "Octaves", type: "range", min: 1, max: 8, step: 1 },
  persistence: { label: "Persistence", type: "range", min: 0.3, max: 0.7, step: 0.05 },
  lacunarity: { label: "Lacunarity", type: "range", min: 1.5, max: 3, step: 0.1 },
  waterLevel: { label: "Water Level", type: "range", min: 0.2, max: 0.5, step: 0.05 },
  sandLevel: { label: "Sand Level", type: "range", min: 0.3, max: 0.5, step: 0.05 },
  grassLevel: { label: "Grass Level", type: "range", min: 0.4, max: 0.7, step: 0.05 },
  forestLevel: { label: "Forest Level", type: "range", min: 0.6, max: 0.85, step: 0.05 },
  islandMode: { label: "Island Mode", type: "boolean" },
  islandFalloff: { label: "Island Falloff", type: "range", min: 1, max: 3, step: 0.1 },
  erosionIterations: { label: "Erosion", type: "range", min: 0, max: 5, step: 1 },

  // WFC
  seedRadius: { label: "Seed Radius", type: "range", min: 2, max: 10, step: 1 },

  // Voronoi
  numRooms: { label: "Rooms", type: "range", min: 3, max: 20, step: 1 },
  minRoomDistance: { label: "Min Distance", type: "range", min: 2, max: 8, step: 1 },
  relaxation: { label: "Relaxation", type: "range", min: 0, max: 5, step: 1 },

  // DLA
  stickiness: { label: "Stickiness", type: "range", min: 0.3, max: 1, step: 0.1 },
  spawnMode: {
    label: "Spawn Mode",
    type: "select",
    options: [
      { value: "edge", label: "Edge" },
      { value: "random", label: "Random" },
    ],
  },

  // Hybrid
  splitDirection: {
    label: "Split",
    type: "select",
    options: [
      { value: "diagonal", label: "Diagonal" },
      { value: "horizontal", label: "Horizontal" },
      { value: "vertical", label: "Vertical" },
      { value: "radial", label: "Radial" },
    ],
  },
  blendMode: {
    label: "Blend",
    type: "select",
    options: [
      { value: "soft", label: "Soft" },
      { value: "hard", label: "Hard" },
      { value: "scattered", label: "Scattered" },
    ],
  },
  blendWidth: { label: "Blend Width", type: "range", min: 0, max: 12, step: 1 },
  connectRegions: { label: "Connect Regions", type: "boolean" },

  // Furniture
  addFurniture: { label: "Add Furniture (crates, beds, tables)", type: "boolean" },
  furnitureDensity: { label: "Furniture Density", type: "range", min: 0.05, max: 0.4, step: 0.05 },
};

const GENERATOR_PARAMS: Record<GeneratorType, string[]> = {
  bsp: ["minPartitionSize", "maxDepth", "minRoomSize", "padding", "addDoors", "useRectangle", "useComposite", "useTemplate", "useCellular", "usePolygon",
    "useNibbleCorners", "useAddAlcoves", "useRoundCorners", "useAddPillars", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
  cave: ["iterations", "initialFillProbability", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
  dla: ["fillPercentage", "stickiness", "spawnMode", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
  wfc: ["seedRadius"],
  hybrid: ["splitDirection", "blendMode", "blendWidth", "connectRegions", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
  "hybrid-radial": ["blendMode", "blendWidth", "connectRegions", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
  drunkard: ["fillPercentage"],
  "drunkard-weighted": ["fillPercentage"],
  "drunkard-multi": ["fillPercentage", "numWalkers"],
  maze: ["addStartEnd", "loopChance", "openness"],
  "maze-prims": ["addStartEnd", "loopChance", "openness"],
  "maze-division": ["addStartEnd", "loopChance", "openness"],
  perlin: ["scale", "octaves", "persistence", "lacunarity", "waterLevel", "sandLevel", "grassLevel", "forestLevel", "islandMode", "islandFalloff", "erosionIterations"],
  "perlin-continent": ["scale", "octaves", "persistence", "lacunarity", "waterLevel", "sandLevel", "grassLevel", "forestLevel", "islandMode", "islandFalloff", "erosionIterations"],
  voronoi: ["numRooms", "minRoomDistance", "relaxation", "addDoors", "addFeatures", "addFurniture", "furnitureDensity", "rubbleChance", "collapsedChance", "fallenColumnChance"],
};

interface Props {
  generatorType: GeneratorType;
  params: GeneratorParams;
  onChange: (params: GeneratorParams) => void;
}

export function ParameterControls({ generatorType, params, onChange }: Props) {
  const paramKeys = GENERATOR_PARAMS[generatorType] || [];

  if (paramKeys.length === 0) {
    return null;
  }

  const handleChange = (key: string, value: number | boolean | string) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Parameters</h3>
      <div className={styles.grid}>
        {paramKeys.map((key) => {
          const config = PARAM_CONFIGS[key];
          if (!config) return null;

          const value = params[key as keyof GeneratorParams];

          if (config.type === "boolean") {
            return (
              <label key={key} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => handleChange(key, e.target.checked)}
                />
                <span>{config.label}</span>
              </label>
            );
          }

          if (config.type === "select" && config.options) {
            return (
              <div key={key} className={styles.param}>
                <label className={styles.label}>{config.label}</label>
                <select
                  value={value as string}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={styles.select}
                >
                  {config.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={key} className={styles.param}>
              <label className={styles.label}>
                {config.label}
                <span className={styles.value}>
                  {typeof value === "number" ? value.toFixed(config.step && config.step < 1 ? 2 : 0) : value}
                </span>
              </label>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value as number}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className={styles.range}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
