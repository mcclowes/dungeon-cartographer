import { describe, it, expect } from "vitest";
import { generateBSP, type Grid } from "../index";
import {
  createSimulation,
  simulateTurn,
  runSimulation,
  spawnUnits,
  findPath,
  isWalkable,
  distance,
  Faction,
  UnitType,
  createUnit,
  canAttack,
  executeAttack,
  isInRange,
} from "./index";
import { TileType } from "../types";

describe("simulation", () => {
  // Create a simple test grid
  const createTestGrid = (): Grid => {
    // 10x10 grid with floor in the middle
    const grid: Grid = [];
    for (let y = 0; y < 10; y++) {
      grid[y] = [];
      for (let x = 0; x < 10; x++) {
        // Border walls, floor inside
        if (x === 0 || x === 9 || y === 0 || y === 9) {
          grid[y][x] = TileType.WALL;
        } else {
          grid[y][x] = TileType.FLOOR;
        }
      }
    }
    return grid;
  };

  describe("pathfinding", () => {
    it("should find a straight path", () => {
      const grid = createTestGrid();
      const path = findPath(grid, { x: 1, y: 1 }, { x: 5, y: 1 });
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual({ x: 5, y: 1 });
    });

    it("should return empty path when no path exists", () => {
      const grid = createTestGrid();
      // Block off the entire row
      for (let x = 0; x < 10; x++) {
        grid[5][x] = TileType.WALL;
      }
      const path = findPath(grid, { x: 1, y: 1 }, { x: 1, y: 8 });
      expect(path).toEqual([]);
    });

    it("should correctly identify walkable tiles", () => {
      const grid = createTestGrid();
      expect(isWalkable(grid, 1, 1)).toBe(true);
      expect(isWalkable(grid, 0, 0)).toBe(false);
    });

    it("should calculate distance correctly", () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe("unit creation", () => {
    it("should create a unit with correct stats", () => {
      const unit = createUnit(UnitType.WARRIOR, Faction.RED, { x: 5, y: 5 });
      expect(unit.type).toBe(UnitType.WARRIOR);
      expect(unit.faction).toBe(Faction.RED);
      expect(unit.position).toEqual({ x: 5, y: 5 });
      expect(unit.hp).toBe(unit.maxHp);
      expect(unit.isDead).toBe(false);
    });

    it("should give archers range > 1", () => {
      const archer = createUnit(UnitType.ARCHER, Faction.BLUE, { x: 0, y: 0 });
      expect(archer.range).toBeGreaterThan(1);
    });
  });

  describe("spawning", () => {
    it("should spawn units on a grid", () => {
      const grid = createTestGrid();
      const units = spawnUnits(grid, { unitsPerFaction: 2 });
      expect(units.size).toBe(4); // 2 per faction
    });

    it("should spawn units from both factions", () => {
      const grid = createTestGrid();
      const units = spawnUnits(grid, { unitsPerFaction: 2 });
      const redCount = Array.from(units.values()).filter(
        (u) => u.faction === Faction.RED
      ).length;
      const blueCount = Array.from(units.values()).filter(
        (u) => u.faction === Faction.BLUE
      ).length;
      expect(redCount).toBe(2);
      expect(blueCount).toBe(2);
    });
  });

  describe("combat", () => {
    it("should check range correctly", () => {
      const warrior = createUnit(UnitType.WARRIOR, Faction.RED, { x: 1, y: 1 });
      const enemy1 = createUnit(UnitType.WARRIOR, Faction.BLUE, { x: 2, y: 1 });
      const enemy2 = createUnit(UnitType.WARRIOR, Faction.BLUE, { x: 5, y: 5 });

      expect(isInRange(warrior, enemy1)).toBe(true); // Adjacent
      expect(isInRange(warrior, enemy2)).toBe(false); // Far away
    });

    it("should deal damage on attack", () => {
      const attacker = createUnit(UnitType.WARRIOR, Faction.RED, { x: 1, y: 1 });
      const defender = createUnit(UnitType.WARRIOR, Faction.BLUE, { x: 2, y: 1 });
      const initialHp = defender.hp;

      executeAttack(attacker, defender);

      expect(defender.hp).toBeLessThan(initialHp);
    });

    it("should mark unit as dead when HP reaches 0", () => {
      const attacker = createUnit(UnitType.WARRIOR, Faction.RED, { x: 1, y: 1 });
      attacker.attack = 1000; // Guaranteed kill
      const defender = createUnit(UnitType.WARRIOR, Faction.BLUE, { x: 2, y: 1 });

      executeAttack(attacker, defender);

      expect(defender.hp).toBe(0);
      expect(defender.isDead).toBe(true);
    });

    it("should not allow attacking allies", () => {
      const unit1 = createUnit(UnitType.WARRIOR, Faction.RED, { x: 1, y: 1 });
      const unit2 = createUnit(UnitType.WARRIOR, Faction.RED, { x: 2, y: 1 });

      expect(canAttack(unit1, unit2)).toBe(false);
    });
  });

  describe("simulation", () => {
    it("should create a simulation with units", () => {
      const grid = createTestGrid();
      const sim = createSimulation(grid, { unitsPerFaction: 2 });

      expect(sim.units.size).toBe(4);
      expect(sim.turn).toBe(0);
      expect(sim.isComplete).toBe(false);
    });

    it("should advance turns", () => {
      const grid = createTestGrid();
      const sim = createSimulation(grid, { unitsPerFaction: 2 });

      simulateTurn(grid, sim);

      expect(sim.turn).toBe(1);
    });

    it("should complete when one faction is eliminated", () => {
      const grid = createTestGrid();
      const sim = createSimulation(grid, { unitsPerFaction: 1 });

      // Run until complete or max turns
      runSimulation(grid, sim, { maxTurns: 50 });

      expect(sim.isComplete).toBe(true);
    });

    it("should declare a winner when simulation ends", () => {
      const grid = generateBSP(32, { addFeatures: false });
      const sim = createSimulation(grid, { unitsPerFaction: 1 });

      runSimulation(grid, sim, { maxTurns: 100 });

      if (sim.winner) {
        expect([Faction.RED, Faction.BLUE]).toContain(sim.winner);
      }
      // If no winner, it was a draw (max turns reached)
      expect(sim.isComplete).toBe(true);
    });
  });
});
