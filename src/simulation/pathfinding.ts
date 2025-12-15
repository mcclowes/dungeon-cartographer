import type { Grid, Point } from "../types";
import { TileType, CARDINAL_DIRECTIONS } from "../types";
import { isInBounds } from "../utils/grid";

/** Node in the A* search */
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/** Manhattan distance heuristic */
function heuristic(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Check if a tile is walkable */
export function isWalkable(grid: Grid, x: number, y: number): boolean {
  if (!isInBounds(x, y, grid[0].length, grid.length)) {
    return false;
  }
  const tile = grid[y][x];
  // Walkable tiles: floor, corridor, door, stairs
  return (
    tile === TileType.FLOOR ||
    tile === TileType.CORRIDOR ||
    tile === TileType.DOOR ||
    tile === TileType.STAIRS_UP ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.TREASURE ||
    tile === TileType.CHEST ||
    tile === TileType.TRAP ||
    tile === TileType.TRAP_PIT
  );
}

/** Convert node to key for map */
function nodeKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * A* pathfinding algorithm
 * Returns array of points from start to goal (exclusive of start, inclusive of goal)
 * Returns empty array if no path found
 */
export function findPath(
  grid: Grid,
  start: Point,
  goal: Point,
  occupiedPositions?: Set<string>
): Point[] {
  // Quick check if goal is walkable
  if (!isWalkable(grid, goal.x, goal.y)) {
    return [];
  }

  // If start equals goal, no path needed
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const openSetKeys = new Set<string>();

  // Start node
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };

  openSet.push(startNode);
  openSetKeys.add(nodeKey(start.x, start.y));

  while (openSet.length > 0) {
    // Find node with lowest f score
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openSet[lowestIdx];

    // Check if we reached the goal
    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path: Point[] = [];
      let node: PathNode | null = current;
      while (node !== null && node.parent !== null) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    // Remove current from open set
    openSet.splice(lowestIdx, 1);
    openSetKeys.delete(nodeKey(current.x, current.y));
    closedSet.add(nodeKey(current.x, current.y));

    // Check all neighbors
    for (const dir of CARDINAL_DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = nodeKey(nx, ny);

      // Skip if in closed set
      if (closedSet.has(key)) {
        continue;
      }

      // Skip if not walkable
      if (!isWalkable(grid, nx, ny)) {
        continue;
      }

      // Skip if occupied (except for the goal position)
      if (
        occupiedPositions &&
        occupiedPositions.has(key) &&
        !(nx === goal.x && ny === goal.y)
      ) {
        continue;
      }

      const g = current.g + 1;
      const h = heuristic({ x: nx, y: ny }, goal);
      const f = g + h;

      // Check if already in open set
      if (openSetKeys.has(key)) {
        // Find existing node and update if better
        const existing = openSet.find((n) => n.x === nx && n.y === ny);
        if (existing && g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        // Add new node
        openSet.push({
          x: nx,
          y: ny,
          g,
          h,
          f,
          parent: current,
        });
        openSetKeys.add(key);
      }
    }
  }

  // No path found
  return [];
}

/**
 * Find the closest walkable position to a target within a given range
 * Useful for ranged units that don't need to be adjacent
 */
export function findClosestPositionInRange(
  grid: Grid,
  from: Point,
  target: Point,
  range: number,
  occupiedPositions?: Set<string>
): Point | null {
  // If already in range, return current position
  if (heuristic(from, target) <= range) {
    return from;
  }

  // Find all walkable positions within range of target
  const candidates: { point: Point; distance: number }[] = [];

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const x = target.x + dx;
      const y = target.y + dy;

      // Check Manhattan distance is within range
      if (Math.abs(dx) + Math.abs(dy) > range) {
        continue;
      }

      // Check walkable and not occupied
      if (!isWalkable(grid, x, y)) {
        continue;
      }

      const key = nodeKey(x, y);
      if (occupiedPositions && occupiedPositions.has(key)) {
        continue;
      }

      // Calculate distance from current position
      const distance = heuristic(from, { x, y });
      candidates.push({ point: { x, y }, distance });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by distance from current position
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].point;
}

/**
 * Get all walkable neighbors of a position
 */
export function getWalkableNeighbors(grid: Grid, pos: Point): Point[] {
  const neighbors: Point[] = [];

  for (const dir of CARDINAL_DIRECTIONS) {
    const nx = pos.x + dir.dx;
    const ny = pos.y + dir.dy;

    if (isWalkable(grid, nx, ny)) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

/**
 * Calculate the distance between two points (Manhattan)
 */
export function distance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
