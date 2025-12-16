import { describe, it, expect } from "vitest";
import { analyzeConnectivity, findRoomPath, getConnectivityStats } from "../connectivity";
import { generateBSP } from "../../generators/bsp";
import { TileType } from "../../types";
import type { Grid } from "../../types";

// Helper to create a simple test grid with two rooms connected by a corridor
function createTestGrid(): Grid {
  // Create a 20x20 grid with two rooms connected by a corridor
  const grid: Grid = Array(20)
    .fill(0)
    .map(() => Array(20).fill(TileType.WALL));

  // Room 1: 3x3 room at (2,2) to (4,4)
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Room 2: 3x3 room at (12,12) to (14,14)
  for (let y = 12; y <= 14; y++) {
    for (let x = 12; x <= 14; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Corridor connecting them in an L-shape
  // First, horizontal corridor from room 1's right edge (x=5) to x=13
  // At y=3 (middle of room 1)
  for (let x = 5; x <= 13; x++) {
    grid[3][x] = TileType.CORRIDOR;
  }
  // Then vertical corridor down to room 2's top edge (y=11)
  // At x=13 (adjacent to room 2's left side x=12)
  for (let y = 3; y <= 11; y++) {
    grid[y][13] = TileType.CORRIDOR;
  }

  return grid;
}

describe("Connectivity Analysis", () => {
  describe("analyzeConnectivity", () => {
    it("detects rooms in a simple grid", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      expect(graph.rooms.length).toBe(2);
    });

    it("calculates room properties correctly", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      // Each room is 3x3 = 9 tiles
      for (const room of graph.rooms) {
        expect(room.area).toBe(9);
        expect(room.bounds.width).toBe(3);
        expect(room.bounds.height).toBe(3);
      }
    });

    it("detects connections between rooms", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      expect(graph.connections.length).toBe(1);
      expect(graph.connections[0].roomA).not.toBe(graph.connections[0].roomB);
    });

    it("builds correct adjacency list", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      // Both rooms should be connected to each other
      const room0Neighbors = graph.adjacency.get(0) ?? [];
      const room1Neighbors = graph.adjacency.get(1) ?? [];

      expect(room0Neighbors).toContain(1);
      expect(room1Neighbors).toContain(0);
    });

    it("works with BSP-generated dungeons", () => {
      const grid = generateBSP(32);
      const graph = analyzeConnectivity(grid);

      // Should find at least one room
      expect(graph.rooms.length).toBeGreaterThan(0);
    });

    it("respects minRoomSize parameter", () => {
      const grid = createTestGrid();

      // With minRoomSize of 4, should find rooms (each is 9 tiles)
      const graph1 = analyzeConnectivity(grid, 4);
      expect(graph1.rooms.length).toBe(2);

      // With minRoomSize of 10, should find no rooms (each is 9 tiles)
      const graph2 = analyzeConnectivity(grid, 10);
      expect(graph2.rooms.length).toBe(0);
    });
  });

  describe("findRoomPath", () => {
    it("finds path between connected rooms", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      const path = findRoomPath(graph, 0, 1);

      expect(path).not.toBeNull();
      expect(path?.length).toBe(2);
      expect(path?.[0]).toBe(0);
      expect(path?.[1]).toBe(1);
    });

    it("returns single room for same start and end", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);

      const path = findRoomPath(graph, 0, 0);

      expect(path).toEqual([0]);
    });

    it("returns null for disconnected rooms", () => {
      // Create grid with two isolated rooms
      const grid: Grid = Array(20)
        .fill(0)
        .map(() => Array(20).fill(TileType.WALL));

      // Room 1 (no connection)
      for (let y = 2; y <= 4; y++) {
        for (let x = 2; x <= 4; x++) {
          grid[y][x] = TileType.FLOOR;
        }
      }

      // Room 2 (no connection)
      for (let y = 15; y <= 17; y++) {
        for (let x = 15; x <= 17; x++) {
          grid[y][x] = TileType.FLOOR;
        }
      }

      const graph = analyzeConnectivity(grid);
      const path = findRoomPath(graph, 0, 1);

      expect(path).toBeNull();
    });
  });

  describe("getConnectivityStats", () => {
    it("calculates correct statistics", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);
      const stats = getConnectivityStats(graph);

      expect(stats.numRooms).toBe(2);
      expect(stats.numConnections).toBe(1);
      expect(stats.avgConnections).toBe(1); // Each room has 1 connection
      expect(stats.maxConnections).toBe(1);
      expect(stats.isolatedRooms).toBe(0);
    });

    it("identifies largest and smallest rooms", () => {
      const grid = createTestGrid();
      const graph = analyzeConnectivity(grid);
      const stats = getConnectivityStats(graph);

      expect(stats.largestRoom).not.toBeNull();
      expect(stats.smallestRoom).not.toBeNull();
      expect(stats.largestRoom?.area).toBe(9);
      expect(stats.smallestRoom?.area).toBe(9);
    });

    it("counts isolated rooms", () => {
      // Create grid with isolated room
      const grid: Grid = Array(15)
        .fill(0)
        .map(() => Array(15).fill(TileType.WALL));

      // Single isolated room
      for (let y = 2; y <= 5; y++) {
        for (let x = 2; x <= 5; x++) {
          grid[y][x] = TileType.FLOOR;
        }
      }

      const graph = analyzeConnectivity(grid);
      const stats = getConnectivityStats(graph);

      expect(stats.isolatedRooms).toBe(1);
    });
  });
});
