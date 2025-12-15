import type { Grid } from "../types";
import { TileType } from "../types";

export interface ParchmentColors {
  /** Parchment/floor color */
  parchment: string;
  /** Wall/hatching color */
  wall: string;
  /** Grid line color */
  gridLine: string;
  /** Border/shadow color */
  border: string;
}

const DEFAULT_COLORS: ParchmentColors = {
  parchment: "#e8d9b5",
  wall: "#c4a882",
  gridLine: "rgba(139, 90, 43, 0.3)",
  border: "rgba(80, 50, 20, 0.6)",
};

type Edges = [boolean, boolean, boolean, boolean]; // top, right, bottom, left

function getNeighbor(grid: Grid, x: number, y: number): number {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return TileType.WALL;
  }
  return grid[y][x];
}

function isFloorLike(tile: number): boolean {
  return tile === TileType.FLOOR || tile === TileType.DOOR || tile === TileType.CORRIDOR;
}

function findEdges(grid: Grid, x: number, y: number): Edges {
  return [
    !isFloorLike(getNeighbor(grid, x, y - 1)), // top borders wall
    !isFloorLike(getNeighbor(grid, x + 1, y)), // right borders wall
    !isFloorLike(getNeighbor(grid, x, y + 1)), // bottom borders wall
    !isFloorLike(getNeighbor(grid, x - 1, y)), // left borders wall
  ];
}

/**
 * Draw crosshatch pattern for wall areas
 */
function drawHatching(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  spacing = 4
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Diagonal lines (top-left to bottom-right)
  for (let i = -height; i < width; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + height, y + height);
    ctx.stroke();
  }

  // Cross-hatching (top-right to bottom-left)
  for (let i = 0; i < width + height; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - height, y + height);
    ctx.stroke();
  }
}

/**
 * Draw a soft, slightly irregular border
 */
function drawSoftBorder(
  ctx: CanvasRenderingContext2D,
  xCo: number,
  yCo: number,
  width: number,
  height: number,
  edges: Edges,
  color: string,
  borderWidth = 3
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = borderWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw border on edges that face walls
  if (edges[0]) {
    // Top
    ctx.beginPath();
    ctx.moveTo(xCo - 1, yCo + borderWidth / 2);
    ctx.lineTo(xCo + width + 1, yCo + borderWidth / 2);
    ctx.stroke();
  }

  if (edges[1]) {
    // Right
    ctx.beginPath();
    ctx.moveTo(xCo + width - borderWidth / 2, yCo - 1);
    ctx.lineTo(xCo + width - borderWidth / 2, yCo + height + 1);
    ctx.stroke();
  }

  if (edges[2]) {
    // Bottom
    ctx.beginPath();
    ctx.moveTo(xCo - 1, yCo + height - borderWidth / 2);
    ctx.lineTo(xCo + width + 1, yCo + height - borderWidth / 2);
    ctx.stroke();
  }

  if (edges[3]) {
    // Left
    ctx.beginPath();
    ctx.moveTo(xCo + borderWidth / 2, yCo - 1);
    ctx.lineTo(xCo + borderWidth / 2, yCo + height + 1);
    ctx.stroke();
  }
}

/**
 * Draw grid lines on floor tiles
 */
function drawGridLines(
  ctx: CanvasRenderingContext2D,
  xCo: number,
  yCo: number,
  width: number,
  height: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(xCo, yCo + height);
  ctx.lineTo(xCo + width, yCo + height);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(xCo + width, yCo);
  ctx.lineTo(xCo + width, yCo + height);
  ctx.stroke();
}

/**
 * Draw a tile in parchment/treasure map style
 */
export function drawParchmentTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Grid,
  colors: ParchmentColors = DEFAULT_COLORS
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  if (tileType === TileType.WALL) {
    // Draw hatched wall pattern
    drawHatching(ctx, xCo, yCo, width, height, colors.wall, 5);
    return;
  }

  // Floor-like tiles get parchment background
  ctx.fillStyle = colors.parchment;
  ctx.fillRect(xCo, yCo, width, height);

  // Draw subtle grid lines
  drawGridLines(ctx, xCo, yCo, width, height, colors.gridLine);

  // Get edges for border drawing
  const edges = findEdges(grid, x, y);

  // Draw soft border where tile meets walls
  drawSoftBorder(ctx, xCo, yCo, width, height, edges, colors.border, 3);

  // Draw door indicator
  if (tileType === TileType.DOOR) {
    ctx.fillStyle = colors.border;

    // Check orientation based on adjacent doors or walls
    const doorAbove = y > 0 && grid[y - 1][x] === TileType.DOOR;
    const doorBelow = y < grid.length - 1 && grid[y + 1][x] === TileType.DOOR;
    const doorHorizontal = (x > 0 && grid[y][x - 1] === TileType.DOOR) ||
                           (x < grid[0].length - 1 && grid[y][x + 1] === TileType.DOOR);

    const isVertical = doorAbove || doorBelow || (!doorHorizontal && edges[0] && edges[2]);

    if (isVertical) {
      // Vertical door - two short lines
      ctx.fillRect(xCo + width / 2 - 1, yCo, 2, height * 0.3);
      ctx.fillRect(xCo + width / 2 - 1, yCo + height * 0.7, 2, height * 0.3);
    } else {
      // Horizontal door - two short lines
      ctx.fillRect(xCo, yCo + height / 2 - 1, width * 0.3, 2);
      ctx.fillRect(xCo + width * 0.7, yCo + height / 2 - 1, width * 0.3, 2);
    }
  }
}

/**
 * Add parchment texture/noise overlay to the entire canvas
 */
export function addParchmentTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.03
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Add vignette effect (darker edges)
 */
export function addVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.3
): void {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(60, 40, 20, ${intensity})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
