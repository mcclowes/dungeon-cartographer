import type { Grid, Point } from "../types";
import { TileType } from "../types";

/**
 * Check if a tile is walkable (floor, corridor, door, stairs, etc.)
 */
export function isWalkable(tile: number): boolean {
  return (
    tile === TileType.FLOOR ||
    tile === TileType.CORRIDOR ||
    tile === TileType.DOOR ||
    tile === TileType.SECRET_DOOR ||
    tile === TileType.STAIRS_UP ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.TREASURE ||
    tile === TileType.CHEST ||
    tile === TileType.TRAP ||
    tile === TileType.CARPET ||
    tile === TileType.RUBBLE
  );
}

/**
 * Find all walkable tiles in a grid
 */
export function findWalkableTiles(grid: Grid): Point[] {
  const tiles: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (isWalkable(grid[y][x])) {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}

/**
 * Flood fill from a starting point to find all connected walkable tiles
 */
export function floodFillWalkable(grid: Grid, start: Point): Set<string> {
  const visited = new Set<string>();
  const queue: Point[] = [start];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    if (current.x < 0 || current.x >= width || current.y < 0 || current.y >= height) continue;
    if (!isWalkable(grid[current.y][current.x])) continue;

    visited.add(key);

    // Add cardinal neighbors
    queue.push({ x: current.x - 1, y: current.y });
    queue.push({ x: current.x + 1, y: current.y });
    queue.push({ x: current.x, y: current.y - 1 });
    queue.push({ x: current.x, y: current.y + 1 });
  }

  return visited;
}

/**
 * Check if all walkable tiles in the grid are connected
 * Returns true if the dungeon is fully traversable
 */
export function isFullyConnected(grid: Grid): boolean {
  const walkableTiles = findWalkableTiles(grid);

  if (walkableTiles.length === 0) return true; // Empty grid is trivially connected

  // Flood fill from the first walkable tile
  const connected = floodFillWalkable(grid, walkableTiles[0]);

  // Check if all walkable tiles were reached
  return walkableTiles.every((tile) => connected.has(`${tile.x},${tile.y}`));
}

/**
 * Find disconnected regions in the grid
 * Returns an array of regions, each containing a set of connected tile coordinates
 */
export function findDisconnectedRegions(grid: Grid): Set<string>[] {
  const walkableTiles = findWalkableTiles(grid);
  const regions: Set<string>[] = [];
  const assigned = new Set<string>();

  for (const tile of walkableTiles) {
    const key = `${tile.x},${tile.y}`;
    if (assigned.has(key)) continue;

    const region = floodFillWalkable(grid, tile);
    regions.push(region);

    for (const regionKey of region) {
      assigned.add(regionKey);
    }
  }

  return regions;
}

interface PathNode {
  point: Point;
  g: number;
  f: number;
  parent: string | null;
}

/**
 * A* pathfinding between two points
 * Returns the path as an array of points, or null if no path exists
 */
export function findPath(grid: Grid, start: Point, end: Point): Point[] | null {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  if (!isWalkable(grid[start.y]?.[start.x]) || !isWalkable(grid[end.y]?.[end.x])) {
    return null;
  }

  const openSet = new Map<string, PathNode>();
  const closedSet = new Map<string, PathNode>();

  const heuristic = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const startKey = `${start.x},${start.y}`;
  openSet.set(startKey, {
    point: start,
    g: 0,
    f: heuristic(start, end),
    parent: null,
  });

  while (openSet.size > 0) {
    // Find node with lowest f score
    let currentKey = "";
    let currentNode: PathNode | null = null;
    let lowestF = Infinity;

    for (const [key, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentKey = key;
        currentNode = node;
      }
    }

    if (!currentNode) break;

    // Check if we reached the goal
    if (currentNode.point.x === end.x && currentNode.point.y === end.y) {
      // Reconstruct path
      const path: Point[] = [];
      let traceKey: string | null = currentKey;

      while (traceKey) {
        const [x, y] = traceKey.split(",").map(Number);
        path.unshift({ x, y });

        const tracedNode: PathNode | undefined = closedSet.get(traceKey) ?? openSet.get(traceKey);
        traceKey = tracedNode?.parent ?? null;
      }

      return path;
    }

    // Move current to closed set
    openSet.delete(currentKey);
    closedSet.set(currentKey, currentNode);

    // Check neighbors
    const neighbors = [
      { x: currentNode.point.x - 1, y: currentNode.point.y },
      { x: currentNode.point.x + 1, y: currentNode.point.y },
      { x: currentNode.point.x, y: currentNode.point.y - 1 },
      { x: currentNode.point.x, y: currentNode.point.y + 1 },
    ];

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey)) continue;
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) continue;
      if (!isWalkable(grid[neighbor.y][neighbor.x])) continue;

      const tentativeG = currentNode.g + 1;

      const existing = openSet.get(neighborKey);
      if (!existing || tentativeG < existing.g) {
        openSet.set(neighborKey, {
          point: neighbor,
          g: tentativeG,
          f: tentativeG + heuristic(neighbor, end),
          parent: currentKey,
        });
      }
    }
  }

  return null; // No path found
}

/**
 * Validate that a grid is fully traversable and optionally fix disconnected regions
 */
export interface ValidationResult {
  isValid: boolean;
  numRegions: number;
  largestRegionSize: number;
  totalWalkable: number;
}

export function validateTraversability(grid: Grid): ValidationResult {
  const regions = findDisconnectedRegions(grid);
  const totalWalkable = regions.reduce((sum, r) => sum + r.size, 0);
  const largestRegionSize = Math.max(0, ...regions.map((r) => r.size));

  return {
    isValid: regions.length <= 1,
    numRegions: regions.length,
    largestRegionSize,
    totalWalkable,
  };
}
