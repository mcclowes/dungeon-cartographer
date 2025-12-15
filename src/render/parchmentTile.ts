import type { Grid } from "../types";
import { TileType } from "../types";

export interface ParchmentColors {
  /** Parchment/floor color */
  parchment: string;
  /** Wall/background color */
  wall: string;
  /** Hatching stroke color */
  hatching: string;
  /** Grid line color */
  gridLine: string;
  /** Border/shadow color */
  border: string;
}

const DEFAULT_COLORS: ParchmentColors = {
  parchment: "#e8d9b5",
  wall: "#ba9c63", // Background/wall color
  hatching: "#8a7045", // Darker shade for hatching strokes
  gridLine: "rgba(165, 90, 60, 0.6)", // More visible reddish-brown
  border: "rgba(70, 45, 20, 0.85)", // Darker border
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
 * Simple seeded random for consistent hatching per tile
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Draw short scattered hatching strokes near the edge facing floors
 */
function drawMarginHatching(
  ctx: CanvasRenderingContext2D,
  xCo: number,
  yCo: number,
  width: number,
  height: number,
  grid: Grid,
  x: number,
  y: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  const rand = seededRandom(x * 1000 + y);
  const baseSpacing = 3.5;
  const strokeLen = Math.min(width, height) * 0.55;

  // Check which sides face floors
  const floorAbove = y > 0 && isFloorLike(grid[y - 1][x]);
  const floorBelow = y < grid.length - 1 && isFloorLike(grid[y + 1][x]);
  const floorLeft = x > 0 && isFloorLike(grid[y][x - 1]);
  const floorRight = x < grid[0].length - 1 && isFloorLike(grid[y][x + 1]);

  // Draw hatching only near edges that face floors
  if (floorAbove) {
    for (let i = 0; i < width; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(xCo + i + rand() * 2, yCo);
      ctx.lineTo(xCo + i + len * 0.4 + rand() * 2, yCo + len);
      ctx.stroke();
    }
  }

  if (floorBelow) {
    for (let i = 0; i < width; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(xCo + i + rand() * 2, yCo + height);
      ctx.lineTo(xCo + i + len * 0.4 + rand() * 2, yCo + height - len);
      ctx.stroke();
    }
  }

  if (floorLeft) {
    for (let i = 0; i < height; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(xCo, yCo + i + rand() * 2);
      ctx.lineTo(xCo + len, yCo + i + len * 0.4 + rand() * 2);
      ctx.stroke();
    }
  }

  if (floorRight) {
    for (let i = 0; i < height; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(xCo + width, yCo + i + rand() * 2);
      ctx.lineTo(xCo + width - len, yCo + i + len * 0.4 + rand() * 2);
      ctx.stroke();
    }
  }
}

/**
 * Draw a sketchy, hand-drawn style border with rounded corners
 */
function drawSketchyBorder(
  ctx: CanvasRenderingContext2D,
  xCo: number,
  yCo: number,
  width: number,
  height: number,
  edges: Edges,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Seed for consistent variation per tile position
  const seed = (xCo * 7 + yCo * 13) % 100;
  const r = Math.min(width, height) * 0.2; // corner radius

  // Check for corners (where two adjacent edges meet)
  const topLeft = edges[0] && edges[3];
  const topRight = edges[0] && edges[1];
  const bottomRight = edges[2] && edges[1];
  const bottomLeft = edges[2] && edges[3];

  // Draw 2 slightly offset strokes for sketchy effect
  for (let s = 0; s < 2; s++) {
    const off = (s - 0.5) * 0.6;
    ctx.lineWidth = s === 0 ? 1.5 : 0.8;

    // Draw each edge separately
    if (edges[0]) {
      // Top edge
      ctx.beginPath();
      const y = yCo + 1 + off;
      const x1 = topLeft ? xCo + r : xCo - 1;
      const x2 = topRight ? xCo + width - r : xCo + width + 1;
      ctx.moveTo(x1, y + Math.sin(seed + s) * 0.4);
      ctx.lineTo(x2, y + Math.sin(seed + s + 1) * 0.4);
      ctx.stroke();
    }

    if (edges[1]) {
      // Right edge
      ctx.beginPath();
      const x = xCo + width - 1 - off;
      const y1 = topRight ? yCo + r : yCo - 1;
      const y2 = bottomRight ? yCo + height - r : yCo + height + 1;
      ctx.moveTo(x + Math.sin(seed + s + 2) * 0.4, y1);
      ctx.lineTo(x + Math.sin(seed + s + 3) * 0.4, y2);
      ctx.stroke();
    }

    if (edges[2]) {
      // Bottom edge
      ctx.beginPath();
      const y = yCo + height - 1 - off;
      const x1 = bottomLeft ? xCo + r : xCo - 1;
      const x2 = bottomRight ? xCo + width - r : xCo + width + 1;
      ctx.moveTo(x1, y + Math.sin(seed + s + 4) * 0.4);
      ctx.lineTo(x2, y + Math.sin(seed + s + 5) * 0.4);
      ctx.stroke();
    }

    if (edges[3]) {
      // Left edge
      ctx.beginPath();
      const x = xCo + 1 + off;
      const y1 = topLeft ? yCo + r : yCo - 1;
      const y2 = bottomLeft ? yCo + height - r : yCo + height + 1;
      ctx.moveTo(x + Math.sin(seed + s + 6) * 0.4, y1);
      ctx.lineTo(x + Math.sin(seed + s + 7) * 0.4, y2);
      ctx.stroke();
    }

    // Draw corner arcs
    if (topLeft) {
      ctx.beginPath();
      ctx.arc(xCo + r, yCo + r, r - 1 - off, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    }

    if (topRight) {
      ctx.beginPath();
      ctx.arc(xCo + width - r, yCo + r, r - 1 - off, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
    }

    if (bottomRight) {
      ctx.beginPath();
      ctx.arc(xCo + width - r, yCo + height - r, r - 1 - off, 0, Math.PI * 0.5);
      ctx.stroke();
    }

    if (bottomLeft) {
      ctx.beginPath();
      ctx.arc(xCo + r, yCo + height - r, r - 1 - off, Math.PI * 0.5, Math.PI);
      ctx.stroke();
    }
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
 * Check if a wall tile is adjacent to a floor tile
 */
function isEdgeWall(grid: Grid, x: number, y: number): boolean {
  const neighbors = [
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
    [x - 1, y],
  ];

  for (const [nx, ny] of neighbors) {
    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      if (isFloorLike(grid[ny][nx])) {
        return true;
      }
    }
  }
  return false;
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
    // Draw faint grid lines on wall tiles too (like the reference)
    drawGridLines(ctx, xCo, yCo, width, height, "rgba(160, 100, 60, 0.15)");

    // Only draw margin hatching on walls that are adjacent to floors
    if (isEdgeWall(grid, x, y)) {
      drawMarginHatching(ctx, xCo, yCo, width, height, grid, x, y, colors.hatching);
    }
    return;
  }

  // Floor-like tiles get parchment background
  ctx.fillStyle = colors.parchment;
  ctx.fillRect(xCo, yCo, width, height);

  // Draw grid lines
  drawGridLines(ctx, xCo, yCo, width, height, colors.gridLine);

  // Get edges for border drawing
  const edges = findEdges(grid, x, y);

  // Draw sketchy border where tile meets walls
  drawSketchyBorder(ctx, xCo, yCo, width, height, edges, colors.border);

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
