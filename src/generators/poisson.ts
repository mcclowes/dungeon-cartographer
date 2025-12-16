import type { Grid, Point, Rect } from "../types";
import { TileType } from "../types";
import {
  createGrid,
  randomInt,
  placeFeatures,
  validateGridSize,
  withSeededRandom,
  type FeaturePlacementOptions,
} from "../utils";
import type { RoomShapeOptions } from "../shapes";
import { generateRoomShape, drawRoomShape } from "../shapes";

export interface PoissonOptions {
  /** Random seed for reproducible generation */
  seed?: number;
  /** Minimum distance between room centers (default: 6) */
  minDistance?: number;
  /** Maximum attempts to place each room (default: 30) */
  maxAttempts?: number;
  /** Minimum room size (default: 3) */
  minRoomSize?: number;
  /** Maximum room size (default: 8) */
  maxRoomSize?: number;
  /** Whether to add doors at room connections (default: true) */
  addDoors?: boolean;
  /** Whether to add dungeon features (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
  /** Options for room shapes */
  roomShapeOptions?: RoomShapeOptions;
}

interface Room {
  center: Point;
  bounds: Rect;
}

function euclideanDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Poisson disk sampling for room placement
 * Ensures rooms are well-distributed with minimum spacing
 */
function poissonDiskSample(
  size: number,
  minDistance: number,
  maxAttempts: number,
  minRoomSize: number,
  maxRoomSize: number
): Room[] {
  const rooms: Room[] = [];
  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(size / cellSize);
  const gridHeight = Math.ceil(size / cellSize);
  const grid: (Room | null)[][] = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(null)
  );
  const activeList: Room[] = [];

  // Helper to get grid cell for a point
  const getCell = (p: Point): { gx: number; gy: number } => ({
    gx: Math.floor(p.x / cellSize),
    gy: Math.floor(p.y / cellSize),
  });

  // Helper to check if a point is valid (far enough from others)
  const isValidPoint = (p: Point, roomWidth: number, roomHeight: number): boolean => {
    // Check bounds (room must fit with padding)
    const padding = 2;
    if (
      p.x - roomWidth / 2 < padding ||
      p.x + roomWidth / 2 >= size - padding ||
      p.y - roomHeight / 2 < padding ||
      p.y + roomHeight / 2 >= size - padding
    ) {
      return false;
    }

    // Check distance from existing rooms
    const { gx, gy } = getCell(p);
    const searchRadius = 2;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const neighbor = grid[ny][nx];
          if (neighbor && euclideanDistance(p, neighbor.center) < minDistance) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Start with a random initial point
  const initialX = randomInt(size - 10, 5);
  const initialY = randomInt(size - 10, 5);
  const initialWidth = randomInt(maxRoomSize, minRoomSize);
  const initialHeight = randomInt(maxRoomSize, minRoomSize);
  const initialRoom: Room = {
    center: { x: initialX, y: initialY },
    bounds: {
      x: initialX - Math.floor(initialWidth / 2),
      y: initialY - Math.floor(initialHeight / 2),
      width: initialWidth,
      height: initialHeight,
    },
  };

  rooms.push(initialRoom);
  activeList.push(initialRoom);
  const { gx, gy } = getCell(initialRoom.center);
  grid[gy][gx] = initialRoom;

  // Process active list
  while (activeList.length > 0) {
    const idx = randomInt(activeList.length - 1, 0);
    const current = activeList[idx];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random point in annulus around current room
      const angle = Math.random() * 2 * Math.PI;
      const distance = minDistance + Math.random() * minDistance;
      const newX = Math.round(current.center.x + distance * Math.cos(angle));
      const newY = Math.round(current.center.y + distance * Math.sin(angle));
      const newWidth = randomInt(maxRoomSize, minRoomSize);
      const newHeight = randomInt(maxRoomSize, minRoomSize);
      const newPoint: Point = { x: newX, y: newY };

      if (isValidPoint(newPoint, newWidth, newHeight)) {
        const newRoom: Room = {
          center: newPoint,
          bounds: {
            x: newX - Math.floor(newWidth / 2),
            y: newY - Math.floor(newHeight / 2),
            width: newWidth,
            height: newHeight,
          },
        };

        rooms.push(newRoom);
        activeList.push(newRoom);
        const { gx: ngx, gy: ngy } = getCell(newPoint);
        if (ngy >= 0 && ngy < gridHeight && ngx >= 0 && ngx < gridWidth) {
          grid[ngy][ngx] = newRoom;
        }
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(idx, 1);
    }
  }

  return rooms;
}

/**
 * Find nearest neighbor for each room using a simple approach
 */
function buildMinimumSpanningTree(rooms: Room[]): [number, number][] {
  if (rooms.length < 2) return [];

  const edges: [number, number][] = [];
  const connected = new Set<number>([0]);
  const remaining = new Set<number>(rooms.map((_, i) => i).slice(1));

  while (remaining.size > 0) {
    let minDist = Infinity;
    let bestFrom = -1;
    let bestTo = -1;

    for (const from of connected) {
      for (const to of remaining) {
        const dist = euclideanDistance(rooms[from].center, rooms[to].center);
        if (dist < minDist) {
          minDist = dist;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestTo !== -1) {
      edges.push([bestFrom, bestTo]);
      connected.add(bestTo);
      remaining.delete(bestTo);
    }
  }

  // Add some extra edges for loops (makes dungeon more interesting)
  const extraEdges = Math.floor(rooms.length / 4);
  for (let i = 0; i < extraEdges && rooms.length >= 2; i++) {
    const from = randomInt(rooms.length - 1, 0);
    let to = randomInt(rooms.length - 1, 0);
    while (to === from) {
      to = randomInt(rooms.length - 1, 0);
    }
    const exists = edges.some(([a, b]) => (a === from && b === to) || (a === to && b === from));
    if (!exists && euclideanDistance(rooms[from].center, rooms[to].center) < 20) {
      edges.push([from, to]);
    }
  }

  return edges;
}

function drawCorridor(grid: Grid, from: Point, to: Point): void {
  // L-shaped corridor: go horizontal first, then vertical
  // Horizontal from `from` to `to.x`
  const startX = Math.min(from.x, to.x);
  const endX = Math.max(from.x, to.x);
  for (let x = startX; x <= endX; x++) {
    if (grid[from.y]?.[x] === TileType.WALL) {
      grid[from.y][x] = TileType.CORRIDOR;
    }
  }

  // Vertical segment from `from.y` to `to.y` at `to.x`
  const startY = Math.min(from.y, to.y);
  const endY = Math.max(from.y, to.y);
  for (let y = startY; y <= endY; y++) {
    if (grid[y]?.[to.x] === TileType.WALL) {
      grid[y][to.x] = TileType.CORRIDOR;
    }
  }
}

function addDoors(grid: Grid): void {
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] !== TileType.CORRIDOR) continue;

      const hasFloorNorth = grid[y - 1][x] === TileType.FLOOR;
      const hasFloorSouth = grid[y + 1][x] === TileType.FLOOR;
      const hasFloorEast = grid[y][x + 1] === TileType.FLOOR;
      const hasFloorWest = grid[y][x - 1] === TileType.FLOOR;

      const isVerticalDoorway =
        (hasFloorNorth || hasFloorSouth) &&
        grid[y][x - 1] === TileType.WALL &&
        grid[y][x + 1] === TileType.WALL;
      const isHorizontalDoorway =
        (hasFloorEast || hasFloorWest) &&
        grid[y - 1][x] === TileType.WALL &&
        grid[y + 1][x] === TileType.WALL;

      if ((isVerticalDoorway || isHorizontalDoorway) && Math.random() < 0.5) {
        grid[y][x] = TileType.DOOR;
      }
    }
  }
}

/**
 * Poisson disk sampling dungeon generator
 *
 * Creates well-distributed rooms using Poisson disk sampling,
 * then connects them with a minimum spanning tree plus some extra loops.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated Poisson disk dungeon grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const grid = generatePoisson(50, { minDistance: 8, maxRoomSize: 6 });
 * ```
 */
export function generatePoisson(size: number, options: PoissonOptions = {}): Grid {
  validateGridSize(size, "generatePoisson");

  const {
    seed,
    minDistance = 6,
    maxAttempts = 30,
    minRoomSize = 3,
    maxRoomSize = 8,
    addDoors: addDoorsEnabled = true,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
    roomShapeOptions,
  } = options;

  return withSeededRandom(seed, () => {
    const grid = createGrid(size, size, TileType.WALL);

    // Generate room positions using Poisson disk sampling
    const rooms = poissonDiskSample(size, minDistance, maxAttempts, minRoomSize, maxRoomSize);

    if (rooms.length < 2) {
      console.warn("generatePoisson: Could not place enough rooms");
      return grid;
    }

    // Draw rooms
    for (const room of rooms) {
      if (roomShapeOptions) {
        const shape = generateRoomShape(room.bounds, roomShapeOptions);
        drawRoomShape(grid, shape);
      } else {
        // Simple rectangle room
        for (let y = room.bounds.y; y < room.bounds.y + room.bounds.height; y++) {
          for (let x = room.bounds.x; x < room.bounds.x + room.bounds.width; x++) {
            if (y > 0 && y < size - 1 && x > 0 && x < size - 1) {
              grid[y][x] = TileType.FLOOR;
            }
          }
        }
      }
    }

    // Connect rooms with MST
    const edges = buildMinimumSpanningTree(rooms);
    for (const [fromIdx, toIdx] of edges) {
      drawCorridor(grid, rooms[fromIdx].center, rooms[toIdx].center);
    }

    if (addDoorsEnabled) {
      addDoors(grid);
    }

    if (addFeaturesEnabled) {
      return placeFeatures(grid, featureOptions);
    }

    return grid;
  });
}
