import type { Grid } from "../types";
import { TileType } from "../types";
import { roundRect } from "./roundRect";

type Edges = [boolean, boolean, boolean, boolean]; // top, right, bottom, left
type Corners = [boolean, boolean, boolean, boolean]; // tl, tr, br, bl

function findEdges(grid: Grid, x: number, y: number): Edges {
  const edges: Edges = [false, false, false, false];

  // Top edge borders wall
  if (y !== 0 && grid[y - 1][x] === 0) {
    edges[0] = true;
  }
  // Right edge borders wall
  if (x !== grid[0].length - 1 && grid[y][x + 1] === 0) {
    edges[1] = true;
  }
  // Bottom edge borders wall
  if (y !== grid.length - 1 && grid[y + 1][x] === 0) {
    edges[2] = true;
  }
  // Left edge borders wall
  if (x !== 0 && grid[y][x - 1] === 0) {
    edges[3] = true;
  }

  return edges;
}

/**
 * Determine door orientation by checking:
 * 1. Adjacent walls (wall above+below = vertical, wall left+right = horizontal)
 * 2. Adjacent doors (door above/below = vertical, door left/right = horizontal)
 * This ensures multi-tile doors align correctly.
 */
function getDoorOrientation(
  grid: Grid,
  x: number,
  y: number,
  edges: Edges
): "vertical" | "horizontal" {
  const height = grid.length;
  const width = grid[0].length;

  // Check for adjacent doors
  const doorAbove = y > 0 && grid[y - 1][x] === TileType.DOOR;
  const doorBelow = y < height - 1 && grid[y + 1][x] === TileType.DOOR;
  const doorLeft = x > 0 && grid[y][x - 1] === TileType.DOOR;
  const doorRight = x < width - 1 && grid[y][x + 1] === TileType.DOOR;

  // If there's an adjacent door vertically, this door should be vertical
  if (doorAbove || doorBelow) {
    return "vertical";
  }

  // If there's an adjacent door horizontally, this door should be horizontal
  if (doorLeft || doorRight) {
    return "horizontal";
  }

  // Fall back to wall-based orientation
  // Vertical if walls are above and below (corridor runs left-right)
  if (edges[0] && edges[2]) {
    return "vertical";
  }

  // Horizontal if walls are left and right (corridor runs up-down)
  if (edges[1] && edges[3]) {
    return "horizontal";
  }

  // Default: check which direction has more wall adjacency
  const verticalWalls = (edges[0] ? 1 : 0) + (edges[2] ? 1 : 0);
  const horizontalWalls = (edges[1] ? 1 : 0) + (edges[3] ? 1 : 0);

  return verticalWalls >= horizontalWalls ? "vertical" : "horizontal";
}

function findCorners(edges: Edges): Corners {
  const corners: Corners = [false, false, false, false];

  // Top-left corner (left + top edges)
  if (edges[3] && edges[0]) {
    corners[0] = true;
  }
  // Top-right corner (top + right edges)
  if (edges[0] && edges[1]) {
    corners[1] = true;
  }
  // Bottom-right corner (right + bottom edges)
  if (edges[1] && edges[2]) {
    corners[2] = true;
  }
  // Bottom-left corner (bottom + left edges)
  if (edges[2] && edges[3]) {
    corners[3] = true;
  }

  return corners;
}

export interface ClassicTileColors {
  background: string;
  floor: string;
  gridLine: string;
  door: string;
}

const DEFAULT_COLORS: ClassicTileColors = {
  background: "#aaaaaa",
  floor: "#fefef4",
  gridLine: "rgba(100, 100, 100, 0.75)",
  door: "#aaaaaa",
};

/**
 * Draw a tile in the classic dungeon style with rounded corners,
 * shadow extensions, and dashed grid lines.
 */
export function drawClassicTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Grid,
  colors: ClassicTileColors = DEFAULT_COLORS
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  // Skip wall tiles (they're just background)
  if (tileType === 0) {
    return;
  }

  const edges = findEdges(grid, x, y);
  const corners = findCorners(edges);

  // Calculate background shadow radius (larger than tile)
  const bgRadius: [number, number, number, number] = [
    corners[0] ? (width + 10) / 2 : 0,
    corners[1] ? (width + 10) / 2 : 0,
    corners[2] ? (width + 10) / 2 : 0,
    corners[3] ? (width + 10) / 2 : 0,
  ];

  // Calculate background shadow position (extends beyond tile at edges)
  let bgX = xCo;
  let bgY = yCo;
  let bgWidth = width;
  let bgHeight = height;

  if (edges[3]) {
    // Left edge
    bgX -= 5;
    bgWidth += 5;
  }
  if (edges[0]) {
    // Top edge
    bgY -= 5;
    bgHeight += 5;
  }
  if (edges[1]) {
    // Right edge
    bgWidth += 5;
  }
  if (edges[2]) {
    // Bottom edge
    bgHeight += 5;
  }

  // Draw shadow/background
  ctx.fillStyle = colors.background;
  roundRect(ctx, bgX, bgY, bgWidth, bgHeight, bgRadius, true, false);

  // Draw main tile fill with rounded corners
  ctx.fillStyle = colors.floor;
  const tileRadius: [number, number, number, number] = [
    corners[0] ? width / 2 : 0,
    corners[1] ? width / 2 : 0,
    corners[2] ? width / 2 : 0,
    corners[3] ? width / 2 : 0,
  ];
  roundRect(ctx, xCo, yCo, width, height, tileRadius, true, false);

  // Draw dashed grid lines on interior edges only (top and right)
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(xCo, yCo);

  // Top edge line
  if (edges[0]) {
    ctx.moveTo(xCo + width, yCo);
  } else {
    ctx.lineTo(xCo + width, yCo);
  }

  // Right edge line
  if (edges[1]) {
    ctx.moveTo(xCo + width, yCo + height);
  } else {
    ctx.lineTo(xCo + width, yCo + height);
  }

  ctx.strokeStyle = colors.gridLine;
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw door
  if (tileType === TileType.DOOR) {
    ctx.fillStyle = colors.door;
    const orientation = getDoorOrientation(grid, x, y, edges);

    if (orientation === "vertical") {
      ctx.fillRect(xCo + width / 2 - 2, yCo, 4, height);
    } else {
      ctx.fillRect(xCo, yCo + height / 2 - 2, width, 4);
    }
  }

  // Draw secret door (thicker bar)
  if (tileType === TileType.SECRET_DOOR) {
    ctx.fillStyle = colors.door;
    const orientation = getDoorOrientation(grid, x, y, edges);

    if (orientation === "vertical") {
      ctx.fillRect(xCo + width / 6, yCo, (width / 3) * 2, height);
    } else {
      ctx.fillRect(xCo, yCo + height / 6, width, (height / 3) * 2);
    }
  }
}
