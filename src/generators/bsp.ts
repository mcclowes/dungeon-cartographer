import type { Grid, Rect, Point } from "../types";
import { TileType } from "../types";
import { createGrid, randomInt } from "../utils";

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
}

class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null = null;
  right: BSPNode | null = null;
  room: Rect | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCenter(): Point {
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
  padding: number
): void {
  if (node.left || node.right) {
    if (node.left) createRooms(node.left, minRoomSize, padding);
    if (node.right) createRooms(node.right, minRoomSize, padding);
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

  node.room = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
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

function connectRooms(grid: Grid, node: BSPNode): void {
  if (!node.left || !node.right) return;

  connectRooms(grid, node.left);
  connectRooms(grid, node.right);

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

function drawAllRooms(grid: Grid, node: BSPNode): void {
  if (node.room) {
    drawRoom(grid, node.room);
  }
  if (node.left) drawAllRooms(grid, node.left);
  if (node.right) drawAllRooms(grid, node.right);
}

function addDoors(grid: Grid): void {
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === TileType.CORRIDOR) {
        const neighbors = [
          grid[y - 1][x],
          grid[y + 1][x],
          grid[y][x - 1],
          grid[y][x + 1],
        ];

        const hasFloor = neighbors.includes(TileType.FLOOR);
        const hasWall = neighbors.includes(TileType.WALL);

        if (hasFloor && hasWall && Math.random() < 0.3) {
          grid[y][x] = TileType.DOOR;
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
 */
export function generateBSP(size: number, options: BSPOptions = {}): Grid {
  const {
    minPartitionSize = 6,
    maxDepth = 4,
    minRoomSize = 3,
    padding = 1,
    addDoors: addDoorsEnabled = true,
  } = options;

  const grid = createGrid(size, size, TileType.WALL);
  const root = new BSPNode(1, 1, size - 2, size - 2);

  buildTree(root, minPartitionSize, maxDepth);
  createRooms(root, minRoomSize, padding);
  drawAllRooms(grid, root);
  connectRooms(grid, root);

  if (addDoorsEnabled) {
    addDoors(grid);
  }

  return grid;
}
