import type { Grid, Point, Rect } from "../types";
import { TileType } from "../types";
import type { RoomShape, RectangleShape } from "./types";
import { RoomShapeType } from "./types";

/**
 * Draw a room shape onto a grid
 * @param grid The grid to draw on
 * @param shape The room shape to draw
 * @param tileType The tile type to use (default: FLOOR)
 */
export function drawRoomShape(
  grid: Grid,
  shape: RoomShape,
  tileType: TileType = TileType.FLOOR
): void {
  switch (shape.type) {
    case RoomShapeType.RECTANGLE:
      drawRectangle(grid, shape.rect, tileType);
      break;
    case RoomShapeType.COMPOSITE:
      drawComposite(grid, shape.rects, tileType);
      break;
    case RoomShapeType.TEMPLATE:
      drawTemplate(grid, shape.mask, shape.boundingBox, tileType);
      break;
    case RoomShapeType.CELLULAR:
      drawCellular(grid, shape.tiles, shape.boundingBox, tileType);
      break;
    case RoomShapeType.POLYGON:
      drawPolygon(grid, shape.vertices, shape.boundingBox, tileType);
      break;
  }
}

/**
 * Draw a rectangle onto a grid
 */
export function drawRectangle(grid: Grid, rect: Rect, tileType: TileType = TileType.FLOOR): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        grid[y][x] = tileType;
      }
    }
  }
}

/**
 * Draw multiple overlapping rectangles onto a grid
 */
export function drawComposite(
  grid: Grid,
  rects: Rect[],
  tileType: TileType = TileType.FLOOR
): void {
  for (const rect of rects) {
    drawRectangle(grid, rect, tileType);
  }
}

/**
 * Draw a template (boolean mask) onto a grid at the specified position
 */
export function drawTemplate(
  grid: Grid,
  mask: boolean[][],
  position: Rect,
  tileType: TileType = TileType.FLOOR
): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const maskHeight = mask.length;
  const maskWidth = mask[0]?.length ?? 0;

  for (let my = 0; my < maskHeight; my++) {
    for (let mx = 0; mx < maskWidth; mx++) {
      if (mask[my][mx]) {
        const gx = position.x + mx;
        const gy = position.y + my;
        if (gy >= 0 && gy < height && gx >= 0 && gx < width) {
          grid[gy][gx] = tileType;
        }
      }
    }
  }
}

/**
 * Draw cellular shape tiles onto a grid
 */
export function drawCellular(
  grid: Grid,
  tiles: Point[],
  boundingBox: Rect,
  tileType: TileType = TileType.FLOOR
): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (const tile of tiles) {
    const gx = boundingBox.x + tile.x;
    const gy = boundingBox.y + tile.y;
    if (gy >= 0 && gy < height && gx >= 0 && gx < width) {
      grid[gy][gx] = tileType;
    }
  }
}

/**
 * Draw a polygon onto a grid using scanline fill algorithm
 */
export function drawPolygon(
  grid: Grid,
  vertices: Point[],
  boundingBox: Rect,
  tileType: TileType = TileType.FLOOR
): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  if (vertices.length < 3) return;

  // Use scanline fill algorithm
  const minY = Math.max(0, boundingBox.y);
  const maxY = Math.min(height - 1, boundingBox.y + boundingBox.height - 1);

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    // Find all intersections with polygon edges
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];

      // Check if edge crosses this scanline
      if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
        // Calculate x intersection
        const t = (y - v1.y) / (v2.y - v1.y);
        const x = v1.x + t * (v2.x - v1.x);
        intersections.push(x);
      }
    }

    // Sort intersections
    intersections.sort((a, b) => a - b);

    // Fill between pairs of intersections
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.ceil(intersections[i]));
      const x2 = Math.min(width - 1, Math.floor(intersections[i + 1]));

      for (let x = x1; x <= x2; x++) {
        grid[y][x] = tileType;
      }
    }
  }
}

/**
 * Get all floor tiles for a room shape
 */
export function getShapeTiles(shape: RoomShape): Point[] {
  const tiles: Point[] = [];

  switch (shape.type) {
    case RoomShapeType.RECTANGLE: {
      const { rect } = shape;
      for (let y = 0; y < rect.height; y++) {
        for (let x = 0; x < rect.width; x++) {
          tiles.push({ x: rect.x + x, y: rect.y + y });
        }
      }
      break;
    }

    case RoomShapeType.COMPOSITE: {
      const tileSet = new Set<string>();
      for (const rect of shape.rects) {
        for (let y = 0; y < rect.height; y++) {
          for (let x = 0; x < rect.width; x++) {
            const key = `${rect.x + x},${rect.y + y}`;
            if (!tileSet.has(key)) {
              tileSet.add(key);
              tiles.push({ x: rect.x + x, y: rect.y + y });
            }
          }
        }
      }
      break;
    }

    case RoomShapeType.TEMPLATE: {
      const { mask, boundingBox } = shape;
      for (let y = 0; y < mask.length; y++) {
        for (let x = 0; x < (mask[y]?.length ?? 0); x++) {
          if (mask[y][x]) {
            tiles.push({ x: boundingBox.x + x, y: boundingBox.y + y });
          }
        }
      }
      break;
    }

    case RoomShapeType.CELLULAR: {
      const { tiles: shapeTiles, boundingBox } = shape;
      for (const tile of shapeTiles) {
        tiles.push({ x: boundingBox.x + tile.x, y: boundingBox.y + tile.y });
      }
      break;
    }

    case RoomShapeType.POLYGON: {
      // Rasterize polygon to get tiles
      const { vertices, boundingBox } = shape;
      const minY = 0;
      const maxY = boundingBox.height - 1;

      for (let y = minY; y <= maxY; y++) {
        const intersections: number[] = [];
        const scanY = boundingBox.y + y;

        for (let i = 0; i < vertices.length; i++) {
          const v1 = vertices[i];
          const v2 = vertices[(i + 1) % vertices.length];

          if ((v1.y <= scanY && v2.y > scanY) || (v2.y <= scanY && v1.y > scanY)) {
            const t = (scanY - v1.y) / (v2.y - v1.y);
            const x = v1.x + t * (v2.x - v1.x);
            intersections.push(x);
          }
        }

        intersections.sort((a, b) => a - b);

        for (let i = 0; i < intersections.length - 1; i += 2) {
          const x1 = Math.ceil(intersections[i]);
          const x2 = Math.floor(intersections[i + 1]);

          for (let x = x1; x <= x2; x++) {
            tiles.push({ x, y: scanY });
          }
        }
      }
      break;
    }
  }

  return tiles;
}

/**
 * Get the center point of a room shape
 */
export function getShapeCenter(shape: RoomShape): Point {
  const tiles = getShapeTiles(shape);
  if (tiles.length === 0) {
    return {
      x: shape.boundingBox.x + Math.floor(shape.boundingBox.width / 2),
      y: shape.boundingBox.y + Math.floor(shape.boundingBox.height / 2),
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (const tile of tiles) {
    sumX += tile.x;
    sumY += tile.y;
  }

  return {
    x: Math.round(sumX / tiles.length),
    y: Math.round(sumY / tiles.length),
  };
}

/**
 * Calculate the bounding box for a set of rectangles
 */
export function calculateCompositeBoundingBox(rects: Rect[]): Rect {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate the bounding box for polygon vertices
 */
export function calculatePolygonBoundingBox(vertices: Point[]): Rect {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }

  return {
    x: Math.floor(minX),
    y: Math.floor(minY),
    width: Math.ceil(maxX - minX) + 1,
    height: Math.ceil(maxY - minY) + 1,
  };
}

/**
 * Check if a shape fits within bounds
 */
export function shapeFitsInBounds(shape: RoomShape, bounds: Rect): boolean {
  const bb = shape.boundingBox;
  return (
    bb.x >= bounds.x &&
    bb.y >= bounds.y &&
    bb.x + bb.width <= bounds.x + bounds.width &&
    bb.y + bb.height <= bounds.y + bounds.height
  );
}

/**
 * Create a rectangle shape
 */
export function createRectangleShape(rect: Rect): RectangleShape {
  return {
    type: RoomShapeType.RECTANGLE,
    rect,
    boundingBox: { ...rect },
  };
}
