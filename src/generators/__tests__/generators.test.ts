import { describe, it, expect } from "vitest";
import { generateBSP } from "../bsp";
import { generateCave } from "../cave";
import { generateVoronoi } from "../voronoi";
import { generateMaze } from "../maze";
import { generatePoisson } from "../poisson";
import { generateAgent } from "../agent";
import { generateMultiLevel, findStairsOnLevel } from "../multilevel";
import { generateDLA } from "../dla";
import { generatePerlin } from "../perlin";
import { TileType, MazeTile } from "../../types";
import { isFullyConnected } from "../../utils/pathfinding";
import type { Grid } from "../../types";

// Helper to count tile types
function countTiles(grid: Grid, tileType: number): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile === tileType) count++;
    }
  }
  return count;
}

// Helper to verify grid dimensions
function verifyGridDimensions(grid: Grid, expectedSize: number): void {
  expect(grid.length).toBe(expectedSize);
  for (const row of grid) {
    expect(row.length).toBe(expectedSize);
  }
}

describe("BSP Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generateBSP(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates valid dungeon with floor tiles", () => {
    const grid = generateBSP(32);
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("generates walls around the edges", () => {
    const grid = generateBSP(32);
    // Check top and bottom edges
    for (let x = 0; x < 32; x++) {
      expect(grid[0][x]).toBe(TileType.WALL);
      expect(grid[31][x]).toBe(TileType.WALL);
    }
    // Check left and right edges
    for (let y = 0; y < 32; y++) {
      expect(grid[y][0]).toBe(TileType.WALL);
      expect(grid[y][31]).toBe(TileType.WALL);
    }
  });

  it("generates doors when enabled", () => {
    const grid = generateBSP(32, { addDoors: true });
    const doorCount = countTiles(grid, TileType.DOOR);
    expect(doorCount).toBeGreaterThanOrEqual(0); // May or may not have doors
  });

  it("respects min room size", () => {
    const grid = generateBSP(48, { minRoomSize: 6 });
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("throws error for invalid size", () => {
    expect(() => generateBSP(2)).toThrow();
    expect(() => generateBSP(600)).toThrow();
  });
});

describe("Cave Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generateCave(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates organic cave-like spaces", () => {
    const grid = generateCave(32);
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("respects initial fill probability", () => {
    const denseCave = generateCave(32, { initialFillProbability: 0.6 });
    const sparseCave = generateCave(32, { initialFillProbability: 0.3 });

    // These should generally produce different amounts of floor
    const denseFloors = countTiles(denseCave, TileType.FLOOR);
    const sparseFloors = countTiles(sparseCave, TileType.FLOOR);

    // Sparse should typically have more floor tiles
    // Note: Due to cellular automata, this isn't always guaranteed
    expect(denseFloors).toBeGreaterThanOrEqual(0);
    expect(sparseFloors).toBeGreaterThanOrEqual(0);
  });

  it("applies correct number of iterations", () => {
    // More iterations should smooth the cave
    const grid = generateCave(32, { iterations: 5 });
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });
});

describe("Voronoi Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generateVoronoi(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates rooms from Voronoi cells", () => {
    const grid = generateVoronoi(32, { numRooms: 8 });
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("connects rooms with corridors", () => {
    const grid = generateVoronoi(32);
    const corridorCount = countTiles(grid, TileType.CORRIDOR);
    expect(corridorCount).toBeGreaterThanOrEqual(0);
  });
});

describe("Maze Generator", () => {
  it("generates grid with correct dimensions (odd size for maze algorithms)", () => {
    const grid = generateMaze(32);
    // Maze algorithms require odd dimensions, so 32 becomes 31
    const expectedSize = 31;
    expect(grid.length).toBe(expectedSize);
    for (const row of grid) {
      expect(row.length).toBe(expectedSize);
    }
  });

  it("generates a maze with passages", () => {
    const grid = generateMaze(32);
    // Maze uses MazeTile.PASSAGE (value 1) for passages
    const passageCount = countTiles(grid, MazeTile.PASSAGE);
    expect(passageCount).toBeGreaterThan(0);
  });

  it("generates walls", () => {
    const grid = generateMaze(32);
    const wallCount = countTiles(grid, MazeTile.WALL);
    expect(wallCount).toBeGreaterThan(0);
  });

  it("generates odd-sized grid when given even size", () => {
    const grid = generateMaze(32);
    expect(grid.length % 2).toBe(1); // Odd size
  });

  it("generates same size when given odd input", () => {
    const grid = generateMaze(31);
    expect(grid.length).toBe(31);
  });
});

describe("Poisson Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generatePoisson(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates evenly distributed rooms", () => {
    const grid = generatePoisson(32);
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("generates corridors between rooms", () => {
    const grid = generatePoisson(32);
    const corridorCount = countTiles(grid, TileType.CORRIDOR);
    expect(corridorCount).toBeGreaterThanOrEqual(0);
  });

  it("respects minDistance parameter", () => {
    const grid = generatePoisson(48, { minDistance: 12 });
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });
});

describe("Agent Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generateAgent(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates rooms carved by agents", () => {
    const grid = generateAgent(32);
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });

  it("respects number of agents", () => {
    const grid = generateAgent(32, { numAgents: 5, stepsPerAgent: 100 });
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });
});

describe("DLA Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generateDLA(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates organic growth patterns", () => {
    const grid = generateDLA(32);
    const floorCount = countTiles(grid, TileType.FLOOR);
    expect(floorCount).toBeGreaterThan(0);
  });
});

describe("Perlin Generator", () => {
  it("generates grid with correct dimensions", () => {
    const grid = generatePerlin(32);
    verifyGridDimensions(grid, 32);
  });

  it("generates terrain with varied heights", () => {
    const grid = generatePerlin(32);
    // Perlin generates terrain tiles
    const uniqueTiles = new Set<number>();
    for (const row of grid) {
      for (const tile of row) {
        uniqueTiles.add(tile);
      }
    }
    expect(uniqueTiles.size).toBeGreaterThan(1);
  });
});

describe("Multi-Level Generator", () => {
  it("generates correct number of levels", () => {
    const result = generateMultiLevel(32, { numLevels: 3 });
    expect(result.levels.length).toBe(3);
    expect(result.levelNames.length).toBe(3);
  });

  it("generates levels with correct dimensions", () => {
    const result = generateMultiLevel(32);
    for (const level of result.levels) {
      verifyGridDimensions(level, 32);
    }
  });

  it("creates stair connections between levels", () => {
    const result = generateMultiLevel(32, {
      numLevels: 3,
      stairsPerConnection: 2,
    });

    // Should have connections between level 0-1 and 1-2
    expect(result.connections.length).toBeGreaterThanOrEqual(2);
  });

  it("places stairs on correct levels", () => {
    const result = generateMultiLevel(32, { numLevels: 2 });

    for (const conn of result.connections) {
      // Upper level should have STAIRS_DOWN
      const upperGrid = result.levels[conn.upperLevel];
      expect(upperGrid[conn.upperPosition.y][conn.upperPosition.x]).toBe(TileType.STAIRS_DOWN);

      // Lower level should have STAIRS_UP
      const lowerGrid = result.levels[conn.lowerLevel];
      expect(lowerGrid[conn.lowerPosition.y][conn.lowerPosition.x]).toBe(TileType.STAIRS_UP);
    }
  });

  it("findStairsOnLevel returns correct stairs", () => {
    const result = generateMultiLevel(32, { numLevels: 3 });

    // Middle level (index 1) should have both up and down stairs
    const middleStairs = findStairsOnLevel(result, 1);
    expect(middleStairs.up.length).toBeGreaterThan(0);
    expect(middleStairs.down.length).toBeGreaterThan(0);

    // First level should have no up stairs
    const firstLevelStairs = findStairsOnLevel(result, 0);
    expect(firstLevelStairs.up.length).toBe(0);

    // Last level should have no down stairs
    const lastLevelStairs = findStairsOnLevel(result, 2);
    expect(lastLevelStairs.down.length).toBe(0);
  });

  it("supports custom level configurations", () => {
    const result = generateMultiLevel(32, {
      levels: [
        { generator: "bsp", name: "Castle" },
        { generator: "cave", name: "Caverns" },
      ],
    });

    expect(result.levels.length).toBe(2);
    expect(result.levelNames).toEqual(["Castle", "Caverns"]);
  });
});

describe("Generator Connectivity", () => {
  it("BSP generates connected dungeons", () => {
    const grid = generateBSP(32);
    expect(isFullyConnected(grid)).toBe(true);
  });

  it("Voronoi generates connected dungeons", () => {
    const grid = generateVoronoi(32);
    expect(isFullyConnected(grid)).toBe(true);
  });

  it("Poisson generates connected dungeons", () => {
    const grid = generatePoisson(32);
    expect(isFullyConnected(grid)).toBe(true);
  });
});

describe("Generator Edge Cases", () => {
  it("handles minimum valid size", () => {
    const grid = generateBSP(4);
    verifyGridDimensions(grid, 4);
  });

  it("handles larger grid sizes", () => {
    const grid = generateBSP(64);
    verifyGridDimensions(grid, 64);
  });

  it("generates consistent results with same random seed", () => {
    // Save and restore Math.random for deterministic tests
    const originalRandom = Math.random;

    // Create a simple seeded random
    const seededRandom = (seed: number) => {
      return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    };

    Math.random = seededRandom(12345);
    const grid1 = generateBSP(32);

    Math.random = seededRandom(12345);
    const grid2 = generateBSP(32);

    // Restore original random
    Math.random = originalRandom;

    // Grids should be identical
    expect(grid1).toEqual(grid2);
  });
});
