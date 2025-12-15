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
 * Draw a line segment with optional gaps for a hand-drawn look
 */
function drawLineWithGaps(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rand: () => number,
  gapChance = 0.15
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 8) {
    // Short lines - draw without gaps
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return;
  }

  // Break line into segments with potential gaps
  const segmentLength = 6 + rand() * 8;
  const segments = Math.ceil(length / segmentLength);

  let currentPos = 0;
  let drawing = true;

  for (let i = 0; i < segments; i++) {
    const segStart = currentPos / length;
    const segEnd = Math.min((currentPos + segmentLength) / length, 1);

    if (drawing) {
      ctx.beginPath();
      ctx.moveTo(x1 + dx * segStart, y1 + dy * segStart);
      ctx.lineTo(x1 + dx * segEnd, y1 + dy * segEnd);
      ctx.stroke();
    }

    // Randomly decide to create a gap (more likely in the middle of lines)
    const midFactor = 1 - Math.abs(segStart - 0.5) * 2; // Higher in middle
    if (rand() < gapChance * midFactor && i < segments - 1 && i > 0) {
      drawing = false;
      currentPos += segmentLength * (0.3 + rand() * 0.4); // Gap size
    } else {
      drawing = true;
    }

    currentPos += segmentLength;
  }
}

/**
 * Draw a sketchy, hand-drawn style border with rounded corners and occasional gaps
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
  const seed = Math.floor(xCo * 7 + yCo * 13);
  const rand = seededRandom(seed);
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

    // Gap chance is lower for the main stroke, higher for the secondary
    const gapChance = s === 0 ? 0.12 : 0.18;

    // Draw each edge separately with gaps
    if (edges[0]) {
      // Top edge
      const y = yCo + 1 + off + Math.sin(seed + s) * 0.4;
      const x1 = topLeft ? xCo + r : xCo - 1;
      const x2 = topRight ? xCo + width - r : xCo + width + 1;
      drawLineWithGaps(ctx, x1, y, x2, y + Math.sin(seed + s + 1) * 0.4, rand, gapChance);
    }

    if (edges[1]) {
      // Right edge
      const x = xCo + width - 1 - off + Math.sin(seed + s + 2) * 0.4;
      const y1 = topRight ? yCo + r : yCo - 1;
      const y2 = bottomRight ? yCo + height - r : yCo + height + 1;
      drawLineWithGaps(ctx, x, y1, x + Math.sin(seed + s + 3) * 0.4, y2, rand, gapChance);
    }

    if (edges[2]) {
      // Bottom edge
      const y = yCo + height - 1 - off + Math.sin(seed + s + 4) * 0.4;
      const x1 = bottomLeft ? xCo + r : xCo - 1;
      const x2 = bottomRight ? xCo + width - r : xCo + width + 1;
      drawLineWithGaps(ctx, x1, y, x2, y + Math.sin(seed + s + 5) * 0.4, rand, gapChance);
    }

    if (edges[3]) {
      // Left edge
      const x = xCo + 1 + off + Math.sin(seed + s + 6) * 0.4;
      const y1 = topLeft ? yCo + r : yCo - 1;
      const y2 = bottomLeft ? yCo + height - r : yCo + height + 1;
      drawLineWithGaps(ctx, x, y1, x + Math.sin(seed + s + 7) * 0.4, y2, rand, gapChance);
    }

    // Draw corner arcs (no gaps on corners - they're short)
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
 * Add random scuffs and stains to the parchment for a weathered look
 */
export function addParchmentScuffs(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scuffCount = 15,
  seed = 12345
): void {
  const rand = seededRandom(seed);

  ctx.save();

  for (let i = 0; i < scuffCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 10 + rand() * 40;
    const opacity = 0.03 + rand() * 0.06;

    // Random scuff shape - irregular blob
    ctx.beginPath();
    ctx.moveTo(x, y);

    const points = 5 + Math.floor(rand() * 4);
    for (let p = 0; p < points; p++) {
      const angle = (p / points) * Math.PI * 2;
      const radius = size * (0.5 + rand() * 0.5);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (p === 0) {
        ctx.moveTo(px, py);
      } else {
        // Use quadratic curves for organic shapes
        const cpAngle = ((p - 0.5) / points) * Math.PI * 2;
        const cpRadius = size * (0.3 + rand() * 0.7);
        const cpx = x + Math.cos(cpAngle) * cpRadius;
        const cpy = y + Math.sin(cpAngle) * cpRadius;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    // Brownish stain color
    const r = 80 + Math.floor(rand() * 40);
    const g = 50 + Math.floor(rand() * 30);
    const b = 20 + Math.floor(rand() * 20);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.fill();
  }

  // Add some smaller scratch marks
  ctx.strokeStyle = "rgba(90, 60, 30, 0.08)";
  ctx.lineCap = "round";

  for (let i = 0; i < scuffCount * 2; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const length = 5 + rand() * 25;
    const angle = rand() * Math.PI * 2;

    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.restore();
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
