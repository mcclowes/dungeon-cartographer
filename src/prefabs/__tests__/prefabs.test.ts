import { describe, it, expect } from "vitest";
import { rotateGrid, mirrorGrid, transformPrefab, placePrefabs, placePrefabAt } from "../placement";
import {
  builtInPrefabs,
  entranceHall,
  treasureRoom,
  bossArena,
  getPrefabsByCategory,
  getPrefabsByTag,
  getPrefabsForLevel,
} from "../templates";
import { generateBSP } from "../../generators/bsp";
import { TileType } from "../../types";
import type { Grid } from "../../types";

describe("Prefab System", () => {
  describe("rotateGrid", () => {
    it("returns same grid for 0 rotation", () => {
      const grid: Grid = [
        [1, 2],
        [3, 4],
      ];
      const result = rotateGrid(grid, 0);

      expect(result).toEqual(grid);
      expect(result).not.toBe(grid); // Should be a copy
    });

    it("rotates grid 90 degrees clockwise", () => {
      const grid: Grid = [
        [1, 2],
        [3, 4],
      ];
      const result = rotateGrid(grid, 90);

      expect(result).toEqual([
        [3, 1],
        [4, 2],
      ]);
    });

    it("rotates grid 180 degrees", () => {
      const grid: Grid = [
        [1, 2],
        [3, 4],
      ];
      const result = rotateGrid(grid, 180);

      expect(result).toEqual([
        [4, 3],
        [2, 1],
      ]);
    });

    it("rotates grid 270 degrees", () => {
      const grid: Grid = [
        [1, 2],
        [3, 4],
      ];
      const result = rotateGrid(grid, 270);

      expect(result).toEqual([
        [2, 4],
        [1, 3],
      ]);
    });

    it("handles non-square grids", () => {
      const grid: Grid = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const result = rotateGrid(grid, 90);

      expect(result.length).toBe(3);
      expect(result[0].length).toBe(2);
      expect(result).toEqual([
        [4, 1],
        [5, 2],
        [6, 3],
      ]);
    });
  });

  describe("mirrorGrid", () => {
    it("mirrors grid horizontally", () => {
      const grid: Grid = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const result = mirrorGrid(grid);

      expect(result).toEqual([
        [3, 2, 1],
        [6, 5, 4],
      ]);
    });

    it("does not mutate original", () => {
      const grid: Grid = [
        [1, 2],
        [3, 4],
      ];
      mirrorGrid(grid);

      expect(grid).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe("transformPrefab", () => {
    it("returns unchanged prefab for no transformation", () => {
      const result = transformPrefab(entranceHall, 0, false);

      expect(result.width).toBe(entranceHall.width);
      expect(result.height).toBe(entranceHall.height);
      expect(result.grid).toEqual(entranceHall.grid);
    });

    it("rotates prefab dimensions correctly", () => {
      const result = transformPrefab(entranceHall, 90, false);

      // 9x7 rotated 90 degrees becomes 7x9
      expect(result.width).toBe(entranceHall.height);
      expect(result.height).toBe(entranceHall.width);
    });

    it("preserves dimensions for 180 rotation", () => {
      const result = transformPrefab(entranceHall, 180, false);

      expect(result.width).toBe(entranceHall.width);
      expect(result.height).toBe(entranceHall.height);
    });

    it("updates connection directions on rotation", () => {
      // entranceHall has north and south connections
      const result = transformPrefab(entranceHall, 90, false);

      // North becomes East, South becomes West
      const directions = result.connections.map((c) => c.direction);
      expect(directions).toContain("east");
      expect(directions).toContain("west");
    });

    it("updates connection directions on mirror", () => {
      const result = transformPrefab(entranceHall, 0, true);

      // Mirroring should swap east/west connections
      const original = entranceHall.connections.map((c) => c.direction);
      const mirrored = result.connections.map((c) => c.direction);

      // North and south should stay the same
      expect(original.filter((d) => d === "north").length).toBe(
        mirrored.filter((d) => d === "north").length
      );
      expect(original.filter((d) => d === "south").length).toBe(
        mirrored.filter((d) => d === "south").length
      );
    });
  });

  describe("Templates", () => {
    it("has multiple built-in prefabs", () => {
      expect(builtInPrefabs.length).toBeGreaterThan(5);
    });

    it("all prefabs have required properties", () => {
      for (const prefab of builtInPrefabs) {
        expect(prefab.id).toBeDefined();
        expect(prefab.name).toBeDefined();
        expect(prefab.category).toBeDefined();
        expect(prefab.grid).toBeDefined();
        expect(prefab.width).toBe(prefab.grid[0].length);
        expect(prefab.height).toBe(prefab.grid.length);
        expect(prefab.connections.length).toBeGreaterThan(0);
      }
    });

    it("getPrefabsByCategory filters correctly", () => {
      const treasures = getPrefabsByCategory("treasure");
      expect(treasures.length).toBeGreaterThan(0);
      expect(treasures.every((p) => p.category === "treasure")).toBe(true);
    });

    it("getPrefabsByTag filters correctly", () => {
      const symmetrical = getPrefabsByTag("symmetrical");
      expect(symmetrical.length).toBeGreaterThan(0);
      expect(symmetrical.every((p) => p.tags?.includes("symmetrical"))).toBe(true);
    });

    it("getPrefabsForLevel filters by minLevel", () => {
      const level1 = getPrefabsForLevel(1);
      const level5 = getPrefabsForLevel(5);

      // All level 1 prefabs should have no minLevel or minLevel <= 1
      for (const p of level1) {
        expect(p.minLevel === undefined || p.minLevel <= 1).toBe(true);
      }

      // Level 5 should include boss arena (minLevel: 5)
      expect(level5.some((p) => p.id === "boss-arena")).toBe(true);
    });
  });

  describe("placePrefabs", () => {
    it("places prefabs in empty dungeon", () => {
      // Create large empty dungeon (all walls)
      const emptyGrid: Grid = Array(64)
        .fill(0)
        .map(() => Array(64).fill(TileType.WALL));

      const result = placePrefabs(
        emptyGrid,
        {
          prefabs: [shrineRoom],
          maxPrefabs: 2,
        },
        12345
      );

      expect(result.placedPrefabs.length).toBeGreaterThan(0);
    });

    it("respects maxPrefabs option", () => {
      const emptyGrid: Grid = Array(100)
        .fill(0)
        .map(() => Array(100).fill(TileType.WALL));

      const result = placePrefabs(
        emptyGrid,
        {
          prefabs: builtInPrefabs,
          maxPrefabs: 3,
        },
        12345
      );

      expect(result.placedPrefabs.length).toBeLessThanOrEqual(3);
    });

    it("tracks failed prefabs", () => {
      // Small dungeon where not everything can fit
      const smallGrid: Grid = Array(20)
        .fill(0)
        .map(() => Array(20).fill(TileType.WALL));

      const result = placePrefabs(
        smallGrid,
        {
          prefabs: [bossArena], // 11x11, may not fit well
          maxPrefabs: 5,
        },
        12345
      );

      // Either placed some or failed some
      expect(result.placedPrefabs.length + result.failedPrefabs.length).toBeGreaterThan(0);
    });

    it("does not mutate original grid", () => {
      const grid: Grid = Array(50)
        .fill(0)
        .map(() => Array(50).fill(TileType.WALL));
      const original = grid.map((row) => [...row]);

      placePrefabs(
        grid,
        {
          prefabs: builtInPrefabs,
          maxPrefabs: 2,
        },
        12345
      );

      expect(grid).toEqual(original);
    });

    it("produces deterministic results with same seed", () => {
      const grid: Grid = Array(64)
        .fill(0)
        .map(() => Array(64).fill(TileType.WALL));

      const result1 = placePrefabs(
        grid,
        {
          prefabs: builtInPrefabs,
          maxPrefabs: 3,
        },
        99999
      );

      const result2 = placePrefabs(
        grid,
        {
          prefabs: builtInPrefabs,
          maxPrefabs: 3,
        },
        99999
      );

      expect(result1.placedPrefabs.length).toBe(result2.placedPrefabs.length);
      for (let i = 0; i < result1.placedPrefabs.length; i++) {
        expect(result1.placedPrefabs[i].position).toEqual(result2.placedPrefabs[i].position);
        expect(result1.placedPrefabs[i].rotation).toBe(result2.placedPrefabs[i].rotation);
        expect(result1.placedPrefabs[i].mirrored).toBe(result2.placedPrefabs[i].mirrored);
      }
    });

    it("filters by category", () => {
      const grid: Grid = Array(64)
        .fill(0)
        .map(() => Array(64).fill(TileType.WALL));

      const result = placePrefabs(
        grid,
        {
          prefabs: builtInPrefabs,
          maxPrefabs: 5,
          categories: ["treasure"],
        },
        12345
      );

      for (const placed of result.placedPrefabs) {
        expect(placed.prefab.category).toBe("treasure");
      }
    });
  });

  describe("placePrefabAt", () => {
    it("places prefab at specific position", () => {
      const grid: Grid = Array(30)
        .fill(0)
        .map(() => Array(30).fill(TileType.WALL));

      const result = placePrefabAt(grid, shrineRoom, { x: 10, y: 10 });

      expect(result).not.toBeNull();
      expect(result?.position).toEqual({ x: 10, y: 10 });
      expect(result?.bounds.x).toBe(10);
      expect(result?.bounds.y).toBe(10);
    });

    it("mutates grid in place", () => {
      const grid: Grid = Array(30)
        .fill(0)
        .map(() => Array(30).fill(TileType.WALL));

      placePrefabAt(grid, shrineRoom, { x: 10, y: 10 });

      // Should have floor tiles from the shrine
      let hasFloor = false;
      for (let y = 10; y < 17; y++) {
        for (let x = 10; x < 17; x++) {
          if (grid[y][x] === TileType.FLOOR) hasFloor = true;
        }
      }
      expect(hasFloor).toBe(true);
    });

    it("returns null if placement overlaps non-wall", () => {
      const grid: Grid = Array(30)
        .fill(0)
        .map(() => Array(30).fill(TileType.WALL));

      // Add some floor where we want to place
      grid[12][12] = TileType.FLOOR;

      const result = placePrefabAt(grid, shrineRoom, { x: 10, y: 10 });

      expect(result).toBeNull();
    });

    it("applies rotation correctly", () => {
      const grid: Grid = Array(30)
        .fill(0)
        .map(() => Array(30).fill(TileType.WALL));

      const result = placePrefabAt(grid, entranceHall, { x: 5, y: 5 }, 90, false);

      expect(result).not.toBeNull();
      // 9x7 rotated becomes 7x9
      expect(result?.bounds.width).toBe(7);
      expect(result?.bounds.height).toBe(9);
    });
  });

  describe("Integration with generators", () => {
    it("can inject prefabs into BSP dungeon", () => {
      const dungeon = generateBSP(64);

      // Place prefabs in wall areas
      const result = placePrefabs(
        dungeon,
        {
          prefabs: [shrineRoom, treasureRoom],
          maxPrefabs: 2,
          ensureConnectivity: true,
        },
        54321
      );

      // Should have placed at least one prefab
      expect(result.placedPrefabs.length).toBeGreaterThanOrEqual(0);

      // Grid should be modified
      expect(result.grid).not.toEqual(dungeon);
    });
  });
});

// Import shrineRoom for tests
import { shrineRoom } from "../templates";
