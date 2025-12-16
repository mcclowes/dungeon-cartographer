import { describe, it, expect } from "vitest";
import { validateDungeon, isValidDungeon, getDungeonStats } from "../validation";
import { generateBSP } from "../../generators/bsp";
import { TileType } from "../../types";
import type { Grid } from "../../types";

// Helper to create a simple connected dungeon
function createConnectedDungeon(): Grid {
  const grid: Grid = Array(20)
    .fill(0)
    .map(() => Array(20).fill(TileType.WALL));

  // Room 1: 4x4 at (2,2)
  for (let y = 2; y <= 5; y++) {
    for (let x = 2; x <= 5; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Room 2: 4x4 at (12,12)
  for (let y = 12; y <= 15; y++) {
    for (let x = 12; x <= 15; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Corridor connecting them
  for (let x = 6; x <= 12; x++) {
    grid[3][x] = TileType.CORRIDOR;
  }
  for (let y = 3; y <= 12; y++) {
    grid[y][12] = TileType.CORRIDOR;
  }

  return grid;
}

// Helper to create disconnected dungeon
function createDisconnectedDungeon(): Grid {
  const grid: Grid = Array(20)
    .fill(0)
    .map(() => Array(20).fill(TileType.WALL));

  // Room 1 (no connection)
  for (let y = 2; y <= 5; y++) {
    for (let x = 2; x <= 5; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Room 2 (no connection)
  for (let y = 14; y <= 17; y++) {
    for (let x = 14; x <= 17; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  return grid;
}

// Helper to create dungeon with dead ends
function createDungeonWithDeadEnds(): Grid {
  const grid: Grid = Array(15)
    .fill(0)
    .map(() => Array(15).fill(TileType.WALL));

  // Main room
  for (let y = 5; y <= 9; y++) {
    for (let x = 5; x <= 9; x++) {
      grid[y][x] = TileType.FLOOR;
    }
  }

  // Dead end corridors
  grid[7][4] = TileType.CORRIDOR; // West dead end
  grid[7][10] = TileType.CORRIDOR; // East dead end
  grid[4][7] = TileType.CORRIDOR; // North dead end
  grid[10][7] = TileType.CORRIDOR; // South dead end

  return grid;
}

describe("Dungeon Validation", () => {
  describe("validateDungeon", () => {
    it("validates a connected dungeon as valid", () => {
      const grid = createConnectedDungeon();
      const result = validateDungeon(grid);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("detects disconnected regions", () => {
      const grid = createDisconnectedDungeon();
      const result = validateDungeon(grid);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "disconnected_regions")).toBe(true);
    });

    it("detects empty dungeon", () => {
      const grid: Grid = Array(10)
        .fill(0)
        .map(() => Array(10).fill(TileType.WALL));
      const result = validateDungeon(grid);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "empty_dungeon")).toBe(true);
    });

    it("detects dead ends", () => {
      const grid = createDungeonWithDeadEnds();
      const result = validateDungeon(grid);

      expect(result.info.some((i) => i.type === "dead_ends")).toBe(true);
      expect(result.stats.deadEnds).toBe(4);
    });

    it("calculates correct statistics", () => {
      const grid = createConnectedDungeon();
      const result = validateDungeon(grid);

      expect(result.stats.roomCount).toBe(2);
      expect(result.stats.walkableTiles).toBeGreaterThan(0);
      expect(result.stats.wallTiles).toBeGreaterThan(0);
      expect(result.stats.walkablePercent).toBeGreaterThan(0);
      expect(result.stats.walkablePercent).toBeLessThan(100);
    });

    it("respects minRooms option", () => {
      const grid = createConnectedDungeon();

      const result1 = validateDungeon(grid, { minRooms: 2 });
      expect(result1.valid).toBe(true);

      const result2 = validateDungeon(grid, { minRooms: 5 });
      expect(result2.valid).toBe(false);
      expect(result2.errors.some((e) => e.type === "insufficient_rooms")).toBe(true);
    });

    it("respects density options", () => {
      const grid = createConnectedDungeon();

      // Very strict density requirements
      const result = validateDungeon(grid, {
        minWalkablePercent: 50,
        maxWalkablePercent: 60,
      });

      // Should have density warnings (grid is ~15% walkable)
      expect(result.warnings.some((w) => w.type === "too_sparse")).toBe(true);
    });

    it("can disable connectivity checks", () => {
      const grid = createDisconnectedDungeon();

      const result = validateDungeon(grid, { checkConnectivity: false });

      // Should not have connectivity errors
      expect(result.errors.some((e) => e.type === "disconnected_regions")).toBe(false);
    });

    it("can treat isolated rooms as warnings", () => {
      const grid = createDisconnectedDungeon();

      const result = validateDungeon(grid, { isolatedRoomsAreErrors: false });

      // isolated_rooms should be warning, not error
      const isolatedIssue = result.issues.find((i) => i.type === "isolated_rooms");
      expect(isolatedIssue?.severity).toBe("warning");
    });

    it("works with BSP-generated dungeons", () => {
      const grid = generateBSP(64);
      const result = validateDungeon(grid);

      // BSP dungeons should generally be valid
      expect(result.stats.roomCount).toBeGreaterThan(0);
      expect(result.stats.walkableTiles).toBeGreaterThan(0);
    });
  });

  describe("isValidDungeon", () => {
    it("returns true for valid dungeon", () => {
      const grid = createConnectedDungeon();
      expect(isValidDungeon(grid)).toBe(true);
    });

    it("returns false for invalid dungeon", () => {
      const grid = createDisconnectedDungeon();
      expect(isValidDungeon(grid)).toBe(false);
    });

    it("passes options through", () => {
      const grid = createDisconnectedDungeon();
      expect(isValidDungeon(grid, { checkConnectivity: false })).toBe(true);
    });
  });

  describe("getDungeonStats", () => {
    it("returns statistics without validation", () => {
      const grid = createConnectedDungeon();
      const stats = getDungeonStats(grid);

      expect(stats.roomCount).toBe(2);
      expect(stats.walkableTiles).toBeGreaterThan(0);
      expect(stats.wallTiles).toBeGreaterThan(0);
      expect(stats.deadEnds).toBeGreaterThanOrEqual(0);
    });

    it("calculates room size stats", () => {
      const grid = createConnectedDungeon();
      const stats = getDungeonStats(grid);

      expect(stats.avgRoomSize).toBeGreaterThan(0);
      expect(stats.maxRoomSize).toBeGreaterThanOrEqual(stats.minRoomSize);
    });

    it("respects minRoomSize parameter", () => {
      const grid = createConnectedDungeon();

      const stats1 = getDungeonStats(grid, 4);
      const stats2 = getDungeonStats(grid, 100);

      expect(stats1.roomCount).toBeGreaterThan(stats2.roomCount);
    });
  });

  describe("Edge Cases", () => {
    it("handles 1x1 grid", () => {
      const grid: Grid = [[TileType.FLOOR]];
      const result = validateDungeon(grid);

      expect(result.stats.walkableTiles).toBe(1);
      expect(result.stats.walkablePercent).toBe(100);
    });

    it("handles grid with only corridors", () => {
      const grid: Grid = Array(5)
        .fill(0)
        .map(() => Array(5).fill(TileType.CORRIDOR));
      const result = validateDungeon(grid);

      expect(result.stats.walkableTiles).toBe(25);
      // No "rooms" since corridors aren't counted as rooms
      expect(result.stats.roomCount).toBe(0);
    });

    it("handles mixed tile types", () => {
      const grid: Grid = [
        [TileType.WALL, TileType.DOOR, TileType.WALL],
        [TileType.FLOOR, TileType.FLOOR, TileType.FLOOR],
        [TileType.WALL, TileType.STAIRS_DOWN, TileType.WALL],
      ];
      const result = validateDungeon(grid);

      // Door, floor, stairs are all walkable
      expect(result.stats.walkableTiles).toBe(5);
    });

    it("identifies correct number of disconnected regions", () => {
      const grid: Grid = Array(20)
        .fill(0)
        .map(() => Array(20).fill(TileType.WALL));

      // Three separate floor tiles
      grid[2][2] = TileType.FLOOR;
      grid[10][10] = TileType.FLOOR;
      grid[17][17] = TileType.FLOOR;

      const result = validateDungeon(grid);

      const disconnectedError = result.errors.find((e) => e.type === "disconnected_regions");
      expect(disconnectedError?.message).toContain("3 disconnected regions");
    });
  });
});
