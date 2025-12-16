import type { Grid, Point } from "../types";
import type { Unit, SpawnOptions } from "./types";
import { Faction, UnitType, UNIT_STATS } from "./types";
import { isWalkable, distance } from "./pathfinding";
import { randomItem, shuffle } from "../utils/random";

/** Generate a unique ID for a unit */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Find all walkable positions on the grid
 */
function findWalkablePositions(grid: Grid): Point[] {
  const positions: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (isWalkable(grid, x, y)) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

/**
 * Create a unit at a specific position
 */
export function createUnit(
  type: UnitType,
  faction: Faction,
  position: Point
): Unit {
  const stats = UNIT_STATS[type];
  return {
    id: generateId(),
    type,
    faction,
    position: { ...position },
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    range: stats.range,
    isDead: false,
  };
}

/**
 * Spawn units on a grid for two opposing factions
 */
export function spawnUnits(
  grid: Grid,
  options: SpawnOptions = {}
): Map<string, Unit> {
  const {
    unitsPerFaction = 3,
    unitTypes = [UnitType.WARRIOR, UnitType.ARCHER, UnitType.MAGE],
    minSpawnDistance = 2,
    opposingSides = true,
  } = options;

  const units = new Map<string, Unit>();
  const allWalkable = findWalkablePositions(grid);

  if (allWalkable.length < unitsPerFaction * 2) {
    // Not enough space, spawn what we can
    const shuffled = shuffle([...allWalkable]);
    const half = Math.floor(shuffled.length / 2);

    for (let i = 0; i < Math.min(half, unitsPerFaction); i++) {
      const type = randomItem(unitTypes);
      const unit = createUnit(type, Faction.RED, shuffled[i]);
      units.set(unit.id, unit);
    }

    for (let i = 0; i < Math.min(shuffled.length - half, unitsPerFaction); i++) {
      const type = randomItem(unitTypes);
      const unit = createUnit(type, Faction.BLUE, shuffled[half + i]);
      units.set(unit.id, unit);
    }

    return units;
  }

  if (opposingSides) {
    // Split walkable positions into two sides (left/right or top/bottom)
    const width = grid[0].length;
    const height = grid.length;

    // Determine if map is wider than tall
    const useVerticalSplit = width >= height;

    let redPositions: Point[];
    let bluePositions: Point[];

    if (useVerticalSplit) {
      // Left side for red, right side for blue
      const midX = width / 2;
      redPositions = allWalkable.filter((p) => p.x < midX);
      bluePositions = allWalkable.filter((p) => p.x >= midX);
    } else {
      // Top for red, bottom for blue
      const midY = height / 2;
      redPositions = allWalkable.filter((p) => p.y < midY);
      bluePositions = allWalkable.filter((p) => p.y >= midY);
    }

    // Spawn red units
    const selectedRed = selectSpawnPositions(
      redPositions,
      unitsPerFaction,
      minSpawnDistance
    );
    for (const pos of selectedRed) {
      const type = randomItem(unitTypes);
      const unit = createUnit(type, Faction.RED, pos);
      units.set(unit.id, unit);
    }

    // Spawn blue units
    const selectedBlue = selectSpawnPositions(
      bluePositions,
      unitsPerFaction,
      minSpawnDistance
    );
    for (const pos of selectedBlue) {
      const type = randomItem(unitTypes);
      const unit = createUnit(type, Faction.BLUE, pos);
      units.set(unit.id, unit);
    }
  } else {
    // Random placement across the map
    const shuffled = shuffle([...allWalkable]);
    const usedPositions: Point[] = [];

    // Spawn red units
    for (let i = 0; i < unitsPerFaction && shuffled.length > 0; i++) {
      const pos = findValidSpawnPosition(shuffled, usedPositions, minSpawnDistance);
      if (pos) {
        const type = randomItem(unitTypes);
        const unit = createUnit(type, Faction.RED, pos);
        units.set(unit.id, unit);
        usedPositions.push(pos);
      }
    }

    // Spawn blue units
    for (let i = 0; i < unitsPerFaction && shuffled.length > 0; i++) {
      const pos = findValidSpawnPosition(shuffled, usedPositions, minSpawnDistance);
      if (pos) {
        const type = randomItem(unitTypes);
        const unit = createUnit(type, Faction.BLUE, pos);
        units.set(unit.id, unit);
        usedPositions.push(pos);
      }
    }
  }

  return units;
}

/**
 * Select spawn positions with minimum distance between them
 */
function selectSpawnPositions(
  available: Point[],
  count: number,
  minDistance: number
): Point[] {
  const shuffled = shuffle([...available]);
  const selected: Point[] = [];

  for (const pos of shuffled) {
    if (selected.length >= count) break;

    // Check minimum distance from already selected
    const tooClose = selected.some((p) => distance(p, pos) < minDistance);
    if (!tooClose) {
      selected.push(pos);
    }
  }

  // If we couldn't find enough with spacing, fill with whatever is available
  if (selected.length < count) {
    for (const pos of shuffled) {
      if (selected.length >= count) break;
      if (!selected.some((p) => p.x === pos.x && p.y === pos.y)) {
        selected.push(pos);
      }
    }
  }

  return selected;
}

/**
 * Find a valid spawn position from candidates
 */
function findValidSpawnPosition(
  candidates: Point[],
  usedPositions: Point[],
  minDistance: number
): Point | null {
  for (let i = 0; i < candidates.length; i++) {
    const pos = candidates[i];
    const tooClose = usedPositions.some((p) => distance(p, pos) < minDistance);
    if (!tooClose) {
      // Remove from candidates
      candidates.splice(i, 1);
      return pos;
    }
  }

  // No position with min distance, just take any
  if (candidates.length > 0) {
    return candidates.shift()!;
  }

  return null;
}

/**
 * Get all units of a specific faction
 */
export function getUnitsByFaction(
  units: Map<string, Unit>,
  faction: Faction
): Unit[] {
  return Array.from(units.values()).filter(
    (u) => u.faction === faction && !u.isDead
  );
}

/**
 * Get all living units
 */
export function getLivingUnits(units: Map<string, Unit>): Unit[] {
  return Array.from(units.values()).filter((u) => !u.isDead);
}
