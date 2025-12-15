import type { Grid } from "../types";
import { TerrainTile } from "../types";

export interface PerlinOptions {
  /** Noise scale - smaller = larger features (default: 0.08) */
  scale?: number;
  /** Number of noise octaves (default: 4) */
  octaves?: number;
  /** Amplitude decrease per octave (default: 0.5) */
  persistence?: number;
  /** Frequency increase per octave (default: 2) */
  lacunarity?: number;
  /** Water threshold (default: 0.35) */
  waterLevel?: number;
  /** Sand threshold (default: 0.4) */
  sandLevel?: number;
  /** Grass threshold (default: 0.6) */
  grassLevel?: number;
  /** Forest threshold (default: 0.75) */
  forestLevel?: number;
  /** Apply island mask (default: true) */
  islandMode?: boolean;
  /** Island mask falloff (default: 1.8) */
  islandFalloff?: number;
  /** Erosion simulation passes (default: 2) */
  erosionIterations?: number;
}

function createPermutationTable(): number[] {
  const p: number[] = [];
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }

  // Duplicate the table
  const perm = new Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }

  return perm;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  switch (h) {
    case 0:
      return x + y;
    case 1:
      return -x + y;
    case 2:
      return x - y;
    case 3:
      return -x - y;
    default:
      return 0;
  }
}

function perlin2D(x: number, y: number, perm: number[]): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

  return lerp(x1, x2, v);
}

interface FractalNoiseOptions {
  octaves: number;
  persistence: number;
  lacunarity: number;
  scale: number;
}

function fractalNoise(
  x: number,
  y: number,
  perm: number[],
  options: FractalNoiseOptions
): number {
  const { octaves, persistence, lacunarity, scale } = options;

  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlin2D(x * frequency, y * frequency, perm) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return (total / maxValue + 1) / 2;
}

function islandMask(
  x: number,
  y: number,
  width: number,
  height: number,
  falloff: number
): number {
  const centerX = width / 2;
  const centerY = height / 2;

  const dx = (x - centerX) / centerX;
  const dy = (y - centerY) / centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return Math.max(0, 1 - Math.pow(dist, falloff));
}

interface TerrainThresholds {
  waterLevel: number;
  sandLevel: number;
  grassLevel: number;
  forestLevel: number;
}

function noiseToTerrain(value: number, thresholds: TerrainThresholds): number {
  const { waterLevel, sandLevel, grassLevel, forestLevel } = thresholds;

  if (value < waterLevel - 0.1) return TerrainTile.DEEP_WATER;
  if (value < waterLevel) return TerrainTile.WATER;
  if (value < sandLevel) return TerrainTile.SAND;
  if (value < grassLevel) return TerrainTile.GRASS;
  if (value < forestLevel) return TerrainTile.FOREST;
  return TerrainTile.MOUNTAIN;
}

function applyErosion(heightmap: number[][], iterations: number): number[][] {
  const height = heightmap.length;
  const width = heightmap[0].length;

  for (let iter = 0; iter < iterations; iter++) {
    const newMap = heightmap.map((row) => [...row]);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = [
          heightmap[y - 1][x],
          heightmap[y + 1][x],
          heightmap[y][x - 1],
          heightmap[y][x + 1],
        ];
        const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
        newMap[y][x] = heightmap[y][x] * 0.8 + avg * 0.2;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        heightmap[y][x] = newMap[y][x];
      }
    }
  }

  return heightmap;
}

/**
 * Perlin noise terrain generator
 *
 * Creates natural-looking terrain with smooth elevation transitions.
 * Supports island mode for bounded landmasses.
 */
export function generatePerlin(size: number, options: PerlinOptions = {}): Grid {
  const {
    scale = 0.08,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2,
    waterLevel = 0.35,
    sandLevel = 0.4,
    grassLevel = 0.6,
    forestLevel = 0.75,
    islandMode = true,
    islandFalloff = 1.8,
    erosionIterations = 2,
  } = options;

  const perm = createPermutationTable();

  // Generate heightmap
  let heightmap: number[][] = [];
  for (let y = 0; y < size; y++) {
    heightmap[y] = [];
    for (let x = 0; x < size; x++) {
      let noise = fractalNoise(x, y, perm, {
        scale,
        octaves,
        persistence,
        lacunarity,
      });

      if (islandMode) {
        const mask = islandMask(x, y, size, size, islandFalloff);
        noise = noise * mask;
      }

      heightmap[y][x] = noise;
    }
  }

  // Apply erosion
  if (erosionIterations > 0) {
    heightmap = applyErosion(heightmap, erosionIterations);
  }

  // Convert to terrain tiles
  const terrain: Grid = heightmap.map((row) =>
    row.map((value) =>
      noiseToTerrain(value, { waterLevel, sandLevel, grassLevel, forestLevel })
    )
  );

  return terrain;
}

/** Export terrain tile enum for consumers */
export { TerrainTile };
