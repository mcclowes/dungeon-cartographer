import type { Grid, Rect, Point } from "../types";
import { TileType } from "../types";
import { createGrid, randomInt, placeFeatures, validateGridSize, type FeaturePlacementOptions } from "../utils";
import type { RoomShape, RoomShapeOptions, ShapeModifier } from "../shapes";
import {
  generateRoomShape,
  drawRoomShape,
  getShapeCenter,
  getShapeTiles,
  createRectangleShape,
  applyModifiers,
} from "../shapes";

export interface BSPOptions {
  /** Minimum partition size (default: 6) */
  minPartitionSize?: number;
  /** Maximum BSP tree depth (default: 4) */
  maxDepth?: number;
  /** Minimum room size (default: 3) */
  minRoomSize?: number;
  /** Padding between room and partition edge (default: 1) */
  padding?: number;
  /** Whether to add doors (default: true) */
  addDoors?: boolean;
  /** Whether to add dungeon features like stairs, treasures, traps (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
  /** Options for room shape generation (default: rectangle only) */
  roomShapeOptions?: RoomShapeOptions;
}

class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null = null;
  right: BSPNode | null = null;
  room: Rect | null = null;
  roomShape: RoomShape | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCenter(): Point {
    if (this.roomShape) {
      return getShapeCenter(this.roomShape);
    }
    if (this.room) {
      return {
        x: this.room.x + Math.floor(this.room.width / 2),
        y: this.room.y + Math.floor(this.room.height / 2),
      };
    }
    return {
      x: this.x + Math.floor(this.width / 2),
      y: this.y + Math.floor(this.height / 2),
    };
  }

  getRoom(): Rect | null {
    if (this.room) return this.room;
    if (this.left) {
      const leftRoom = this.left.getRoom();
      if (leftRoom) return leftRoom;
    }
    if (this.right) {
      const rightRoom = this.right.getRoom();
      if (rightRoom) return rightRoom;
    }
    return null;
  }

  getRoomShape(): RoomShape | null {
    if (this.roomShape) return this.roomShape;
    if (this.left) {
      const leftShape = this.left.getRoomShape();
      if (leftShape) return leftShape;
    }
    if (this.right) {
      const rightShape = this.right.getRoomShape();
      if (rightShape) return rightShape;
    }
    return null;
  }
}

function splitNode(node: BSPNode, minSize: number): boolean {
  if (node.left || node.right) return false;

  let splitHorizontally = Math.random() > 0.5;

  if (node.width > node.height && node.width / node.height >= 1.25) {
    splitHorizontally = false;
  } else if (node.height > node.width && node.height / node.width >= 1.25) {
    splitHorizontally = true;
  }

  const max = (splitHorizontally ? node.height : node.width) - minSize;
  if (max <= minSize) return false;

  const split = randomInt(max, minSize);

  if (splitHorizontally) {
    node.left = new BSPNode(node.x, node.y, node.width, split);
    node.right = new BSPNode(
      node.x,
      node.y + split,
      node.width,
      node.height - split
    );
  } else {
    node.left = new BSPNode(node.x, node.y, split, node.height);
    node.right = new BSPNode(
      node.x + split,
      node.y,
      node.width - split,
      node.height
    );
  }

  return true;
}

function buildTree(
  node: BSPNode,
  minSize: number,
  maxDepth: number,
  currentDepth = 0
): void {
  if (currentDepth >= maxDepth) return;

  if (splitNode(node, minSize)) {
    buildTree(node.left!, minSize, maxDepth, currentDepth + 1);
    buildTree(node.right!, minSize, maxDepth, currentDepth + 1);
  }
}

function createRooms(
  node: BSPNode,
  minRoomSize: number,
  padding: number,
  shapeOptions?: RoomShapeOptions
): void {
  if (node.left || node.right) {
    if (node.left) createRooms(node.left, minRoomSize, padding, shapeOptions);
    if (node.right) createRooms(node.right, minRoomSize, padding, shapeOptions);
    return;
  }

  const roomWidth = randomInt(
    node.width - padding * 2,
    Math.min(minRoomSize, node.width - padding * 2)
  );
  const roomHeight = randomInt(
    node.height - padding * 2,
    Math.min(minRoomSize, node.height - padding * 2)
  );

  const roomX =
    node.x + randomInt(node.width - roomWidth - padding, padding);
  const roomY =
    node.y + randomInt(node.height - roomHeight - padding, padding);

  const bounds: Rect = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
  node.room = bounds;

  // Generate room shape if options are provided
  if (shapeOptions && shapeOptions.allowedShapes && shapeOptions.allowedShapes.length > 0) {
    node.roomShape = generateRoomShape(bounds, shapeOptions);
  } else {
    // Default to rectangle
    node.roomShape = createRectangleShape(bounds);
  }
}

function drawRoom(grid: Grid, room: Rect): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        grid[y][x] = TileType.FLOOR;
      }
    }
  }
}

function drawHorizontalCorridor(
  grid: Grid,
  x1: number,
  x2: number,
  y: number
): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);

  for (let x = startX; x <= endX; x++) {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
      if (grid[y][x] === TileType.WALL) {
        grid[y][x] = TileType.CORRIDOR;
      }
    }
  }
}

function drawVerticalCorridor(
  grid: Grid,
  y1: number,
  y2: number,
  x: number
): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);

  for (let y = startY; y <= endY; y++) {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
      if (grid[y][x] === TileType.WALL) {
        grid[y][x] = TileType.CORRIDOR;
      }
    }
  }
}

function drawCorridor(
  grid: Grid,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const horizontal = Math.random() > 0.5;

  if (horizontal) {
    drawHorizontalCorridor(grid, x1, x2, y1);
    drawVerticalCorridor(grid, y1, y2, x2);
  } else {
    drawVerticalCorridor(grid, y1, y2, x1);
    drawHorizontalCorridor(grid, x1, x2, y2);
  }
}

/**
 * Find the best connection point from a room shape toward a target point
 */
function findConnectionPoint(shape: RoomShape, target: Point): Point {
  const tiles = getShapeTiles(shape);
  if (tiles.length === 0) {
    return getShapeCenter(shape);
  }

  // Find edge tiles (tiles with at least one wall neighbor)
  const tileSet = new Set(tiles.map(t => `${t.x},${t.y}`));
  const edgeTiles = tiles.filter(tile => {
    const neighbors = [
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
    ];
    return neighbors.some(n => !tileSet.has(`${n.x},${n.y}`));
  });

  if (edgeTiles.length === 0) {
    return getShapeCenter(shape);
  }

  // Find the edge tile closest to the target
  let bestTile = edgeTiles[0];
  let bestDist = Infinity;

  for (const tile of edgeTiles) {
    const dist = Math.abs(tile.x - target.x) + Math.abs(tile.y - target.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestTile = tile;
    }
  }

  return bestTile;
}

function connectRooms(grid: Grid, node: BSPNode): void {
  if (!node.left || !node.right) return;

  connectRooms(grid, node.left);
  connectRooms(grid, node.right);

  const leftShape = node.left.getRoomShape();
  const rightShape = node.right.getRoomShape();

  if (leftShape && rightShape) {
    const leftCenter = getShapeCenter(leftShape);
    const rightCenter = getShapeCenter(rightShape);

    // Find best connection points (edge tiles closest to each other)
    const leftConnect = findConnectionPoint(leftShape, rightCenter);
    const rightConnect = findConnectionPoint(rightShape, leftCenter);

    drawCorridor(
      grid,
      leftConnect.x,
      leftConnect.y,
      rightConnect.x,
      rightConnect.y
    );
  } else {
    // Fallback to old Rect-based connection
    const leftRoom = node.left.getRoom();
    const rightRoom = node.right.getRoom();

    if (leftRoom && rightRoom) {
      const leftCenter = {
        x: leftRoom.x + Math.floor(leftRoom.width / 2),
        y: leftRoom.y + Math.floor(leftRoom.height / 2),
      };
      const rightCenter = {
        x: rightRoom.x + Math.floor(rightRoom.width / 2),
        y: rightRoom.y + Math.floor(rightRoom.height / 2),
      };

      drawCorridor(
        grid,
        leftCenter.x,
        leftCenter.y,
        rightCenter.x,
        rightCenter.y
      );
    }
  }
}

function drawAllRooms(
  grid: Grid,
  node: BSPNode,
  modifiers?: ShapeModifier[]
): void {
  if (node.roomShape) {
    drawRoomShape(grid, node.roomShape);
    // Apply modifiers if provided
    if (modifiers && modifiers.length > 0) {
      applyModifiers(grid, node.roomShape, modifiers);
    }
  } else if (node.room) {
    drawRoom(grid, node.room);
  }
  if (node.left) drawAllRooms(grid, node.left, modifiers);
  if (node.right) drawAllRooms(grid, node.right, modifiers);
}

function isPassable(tile: number): boolean {
  return tile === TileType.FLOOR || tile === TileType.CORRIDOR || tile === TileType.DOOR;
}

function addDoors(grid: Grid): void {
  const height = grid.length;
  const width = grid[0].length;

  // Track which doorways we've already processed
  const processed = new Set<string>();

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] !== TileType.CORRIDOR) continue;
      if (processed.has(`${x},${y}`)) continue;

      // Check if this corridor tile is at a room entrance (adjacent to floor)
      const hasFloorAbove = grid[y - 1][x] === TileType.FLOOR;
      const hasFloorBelow = grid[y + 1][x] === TileType.FLOOR;
      const hasFloorLeft = grid[y][x - 1] === TileType.FLOOR;
      const hasFloorRight = grid[y][x + 1] === TileType.FLOOR;

      if (!hasFloorAbove && !hasFloorBelow && !hasFloorLeft && !hasFloorRight) {
        continue; // Not at a room entrance
      }

      // Determine doorway orientation and find the full span wall-to-wall
      let doorTiles: Point[] = [];

      if (hasFloorAbove || hasFloorBelow) {
        // Horizontal doorway (door tiles run left-right between walls)
        // Find leftmost wall
        let leftX = x;
        while (leftX > 0 && isPassable(grid[y][leftX - 1])) {
          leftX--;
        }
        // Find rightmost wall
        let rightX = x;
        while (rightX < width - 1 && isPassable(grid[y][rightX + 1])) {
          rightX++;
        }

        // Collect all corridor tiles in this span (max 2 for a door)
        const span = rightX - leftX + 1;
        if (span <= 2) {
          for (let dx = leftX; dx <= rightX; dx++) {
            if (grid[y][dx] === TileType.CORRIDOR) {
              doorTiles.push({ x: dx, y });
            }
          }
        }
      } else if (hasFloorLeft || hasFloorRight) {
        // Vertical doorway (door tiles run top-bottom between walls)
        // Find topmost wall
        let topY = y;
        while (topY > 0 && isPassable(grid[topY - 1][x])) {
          topY--;
        }
        // Find bottommost wall
        let bottomY = y;
        while (bottomY < height - 1 && isPassable(grid[bottomY + 1][x])) {
          bottomY++;
        }

        // Collect all corridor tiles in this span (max 2 for a door)
        const span = bottomY - topY + 1;
        if (span <= 2) {
          for (let dy = topY; dy <= bottomY; dy++) {
            if (grid[dy][x] === TileType.CORRIDOR) {
              doorTiles.push({ x, y: dy });
            }
          }
        }
      }

      // Place doors with some randomness (but always place full doorway)
      if (doorTiles.length > 0 && Math.random() < 0.4) {
        for (const tile of doorTiles) {
          grid[tile.y][tile.x] = TileType.DOOR;
          processed.add(`${tile.x},${tile.y}`);
        }
      } else {
        // Mark as processed even if we didn't place a door
        for (const tile of doorTiles) {
          processed.add(`${tile.x},${tile.y}`);
        }
      }
    }
  }
}

/**
 * Binary Space Partitioning dungeon generator
 *
 * Creates well-structured dungeons with distinct rooms and corridors
 * by recursively dividing space into partitions.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated dungeon grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * // Basic rectangular rooms
 * const grid = generateBSP(50, { maxDepth: 5, addDoors: true });
 *
 * // With varied room shapes
 * const gridWithShapes = generateBSP(50, {
 *   roomShapeOptions: {
 *     allowedShapes: ['rectangle', 'composite', 'polygon'],
 *     compositeVariants: ['L', 'T', 'CROSS'],
 *   }
 * });
 * ```
 */
export function generateBSP(size: number, options: BSPOptions = {}): Grid {
  validateGridSize(size, "generateBSP");

  const {
    minPartitionSize = 6,
    maxDepth = 4,
    minRoomSize = 3,
    padding = 1,
    addDoors: addDoorsEnabled = true,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
    roomShapeOptions,
  } = options;

  const grid = createGrid(size, size, TileType.WALL);
  const root = new BSPNode(1, 1, size - 2, size - 2);

  buildTree(root, minPartitionSize, maxDepth);
  createRooms(root, minRoomSize, padding, roomShapeOptions);
  drawAllRooms(grid, root, roomShapeOptions?.modifiers);
  connectRooms(grid, root);

  if (addDoorsEnabled) {
    addDoors(grid);
  }

  if (addFeaturesEnabled) {
    return placeFeatures(grid, featureOptions);
  }

  return grid;
}
