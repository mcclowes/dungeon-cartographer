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
  return (
    tile === TileType.FLOOR ||
    tile === TileType.DOOR ||
    tile === TileType.CORRIDOR ||
    tile === TileType.STAIRS_UP ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.PIT ||
    tile === TileType.TREASURE ||
    tile === TileType.CHEST ||
    tile === TileType.TRAP ||
    tile === TileType.TRAP_PIT ||
    tile === TileType.WATER ||
    tile === TileType.DEEP_WATER ||
    tile === TileType.LAVA ||
    tile === TileType.CRATE ||
    tile === TileType.BARREL ||
    tile === TileType.BED ||
    tile === TileType.TABLE ||
    tile === TileType.CHAIR ||
    tile === TileType.BOOKSHELF ||
    tile === TileType.CARPET ||
    tile === TileType.FIREPLACE ||
    tile === TileType.STATUE ||
    tile === TileType.ALTAR ||
    tile === TileType.RUBBLE ||
    tile === TileType.COLLAPSED ||
    tile === TileType.FALLEN_COLUMN
  );
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

  // Get edges for border drawing
  const edges = findEdges(grid, x, y);

  // Check for corners (where two adjacent edges meet)
  const topLeft = edges[0] && edges[3];
  const topRight = edges[0] && edges[1];
  const bottomRight = edges[2] && edges[1];
  const bottomLeft = edges[2] && edges[3];
  const r = Math.min(width, height) * 0.2; // corner radius

  // Floor-like tiles get parchment background with rounded corners
  ctx.fillStyle = colors.parchment;

  // If we have corners, draw a rounded rect path; otherwise just fill the rect
  if (topLeft || topRight || bottomRight || bottomLeft) {
    ctx.beginPath();
    // Start from top-left, going clockwise
    if (topLeft) {
      ctx.moveTo(xCo + r, yCo);
    } else {
      ctx.moveTo(xCo, yCo);
    }

    // Top edge to top-right
    if (topRight) {
      ctx.lineTo(xCo + width - r, yCo);
      ctx.arcTo(xCo + width, yCo, xCo + width, yCo + r, r);
    } else {
      ctx.lineTo(xCo + width, yCo);
    }

    // Right edge to bottom-right
    if (bottomRight) {
      ctx.lineTo(xCo + width, yCo + height - r);
      ctx.arcTo(xCo + width, yCo + height, xCo + width - r, yCo + height, r);
    } else {
      ctx.lineTo(xCo + width, yCo + height);
    }

    // Bottom edge to bottom-left
    if (bottomLeft) {
      ctx.lineTo(xCo + r, yCo + height);
      ctx.arcTo(xCo, yCo + height, xCo, yCo + height - r, r);
    } else {
      ctx.lineTo(xCo, yCo + height);
    }

    // Left edge back to top-left
    if (topLeft) {
      ctx.lineTo(xCo, yCo + r);
      ctx.arcTo(xCo, yCo, xCo + r, yCo, r);
    } else {
      ctx.lineTo(xCo, yCo);
    }

    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(xCo, yCo, width, height);
  }

  // Draw grid lines
  drawGridLines(ctx, xCo, yCo, width, height, colors.gridLine);

  // Draw sketchy border where tile meets walls
  drawSketchyBorder(ctx, xCo, yCo, width, height, edges, colors.border);

  // Draw tile-specific icons
  drawTileIcon(ctx, xCo, yCo, width, height, tileType, grid, x, y, edges, colors);
}

/**
 * Draw icons/symbols for special tile types
 */
function drawTileIcon(
  ctx: CanvasRenderingContext2D,
  xCo: number,
  yCo: number,
  width: number,
  height: number,
  tileType: TileType,
  grid: Grid,
  x: number,
  y: number,
  edges: Edges,
  colors: ParchmentColors
): void {
  const cx = xCo + width / 2;
  const cy = yCo + height / 2;
  const size = Math.min(width, height);

  ctx.strokeStyle = colors.border;
  ctx.fillStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  switch (tileType) {
    case TileType.DOOR: {
      const doorAbove = y > 0 && grid[y - 1][x] === TileType.DOOR;
      const doorBelow = y < grid.length - 1 && grid[y + 1][x] === TileType.DOOR;
      const doorHorizontal =
        (x > 0 && grid[y][x - 1] === TileType.DOOR) ||
        (x < grid[0].length - 1 && grid[y][x + 1] === TileType.DOOR);
      const isVertical = doorAbove || doorBelow || (!doorHorizontal && edges[0] && edges[2]);

      if (isVertical) {
        ctx.fillRect(cx - 1, yCo, 2, height * 0.3);
        ctx.fillRect(cx - 1, yCo + height * 0.7, 2, height * 0.3);
      } else {
        ctx.fillRect(xCo, cy - 1, width * 0.3, 2);
        ctx.fillRect(xCo + width * 0.7, cy - 1, width * 0.3, 2);
      }
      break;
    }

    case TileType.SECRET_DOOR: {
      // Secret door - dotted line with 'S' marker
      const secretAbove = y > 0 && grid[y - 1][x] === TileType.SECRET_DOOR;
      const secretBelow = y < grid.length - 1 && grid[y + 1][x] === TileType.SECRET_DOOR;
      const secretHorizontal =
        (x > 0 && grid[y][x - 1] === TileType.SECRET_DOOR) ||
        (x < grid[0].length - 1 && grid[y][x + 1] === TileType.SECRET_DOOR);
      const isSecretVertical = secretAbove || secretBelow || (!secretHorizontal && edges[0] && edges[2]);

      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;

      if (isSecretVertical) {
        // Vertical secret door - dotted line from top to bottom
        ctx.beginPath();
        ctx.moveTo(cx, yCo + height * 0.1);
        ctx.lineTo(cx, yCo + height * 0.9);
        ctx.stroke();
      } else {
        // Horizontal secret door - dotted line from left to right
        ctx.beginPath();
        ctx.moveTo(xCo + width * 0.1, cy);
        ctx.lineTo(xCo + width * 0.9, cy);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Draw 'S' marker
      ctx.font = `bold ${size * 0.35}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = colors.border;
      ctx.fillText("S", cx, cy);
      break;
    }

    case TileType.STAIRS_UP: {
      // Stairs going up - lines getting smaller toward top
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const stepY = yCo + height * 0.2 + (i * height * 0.15);
        const stepWidth = width * (0.7 - i * 0.1);
        ctx.moveTo(cx - stepWidth / 2, stepY);
        ctx.lineTo(cx + stepWidth / 2, stepY);
      }
      ctx.stroke();
      // Up arrow
      ctx.beginPath();
      ctx.moveTo(cx, yCo + height * 0.1);
      ctx.lineTo(cx - size * 0.15, yCo + height * 0.25);
      ctx.moveTo(cx, yCo + height * 0.1);
      ctx.lineTo(cx + size * 0.15, yCo + height * 0.25);
      ctx.stroke();
      break;
    }

    case TileType.STAIRS_DOWN: {
      // Stairs going down - lines getting smaller toward bottom
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const stepY = yCo + height * 0.25 + (i * height * 0.15);
        const stepWidth = width * (0.4 + i * 0.1);
        ctx.moveTo(cx - stepWidth / 2, stepY);
        ctx.lineTo(cx + stepWidth / 2, stepY);
      }
      ctx.stroke();
      // Down arrow
      ctx.beginPath();
      ctx.moveTo(cx, yCo + height * 0.9);
      ctx.lineTo(cx - size * 0.15, yCo + height * 0.75);
      ctx.moveTo(cx, yCo + height * 0.9);
      ctx.lineTo(cx + size * 0.15, yCo + height * 0.75);
      ctx.stroke();
      break;
    }

    case TileType.PIT: {
      // Dark pit - concentric rough circles
      ctx.fillStyle = "rgba(40, 30, 20, 0.6)";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case TileType.TREASURE: {
      // X marks the spot
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.25, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.25, cy + size * 0.25);
      ctx.moveTo(cx + size * 0.25, cy - size * 0.25);
      ctx.lineTo(cx - size * 0.25, cy + size * 0.25);
      ctx.stroke();
      break;
    }

    case TileType.CHEST: {
      // Chest icon - rectangle with curved top
      ctx.beginPath();
      ctx.rect(cx - size * 0.25, cy - size * 0.15, size * 0.5, size * 0.35);
      ctx.stroke();
      // Curved lid
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.25, cy - size * 0.15);
      ctx.quadraticCurveTo(cx, cy - size * 0.35, cx + size * 0.25, cy - size * 0.15);
      ctx.stroke();
      // Lock/clasp
      ctx.fillRect(cx - size * 0.05, cy - size * 0.05, size * 0.1, size * 0.1);
      break;
    }

    case TileType.TRAP: {
      // Pressure plate - dashed square
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(cx - size * 0.25, cy - size * 0.25, size * 0.5, size * 0.5);
      ctx.setLineDash([]);
      // Exclamation mark hint
      ctx.fillRect(cx - 1, cy - size * 0.15, 2, size * 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.TRAP_PIT: {
      // Hidden pit trap - dashed circle
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Spikes hint
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const spikeX = cx - size * 0.15 + i * size * 0.15;
        ctx.moveTo(spikeX, cy + size * 0.1);
        ctx.lineTo(spikeX, cy - size * 0.1);
      }
      ctx.stroke();
      break;
    }

    case TileType.WATER: {
      // Light water - wavy lines
      ctx.fillStyle = "rgba(100, 150, 200, 0.3)";
      ctx.fillRect(xCo, yCo, width, height);
      ctx.strokeStyle = "rgba(60, 100, 150, 0.5)";
      ctx.beginPath();
      ctx.moveTo(xCo, cy);
      ctx.quadraticCurveTo(xCo + width * 0.25, cy - 3, xCo + width * 0.5, cy);
      ctx.quadraticCurveTo(xCo + width * 0.75, cy + 3, xCo + width, cy);
      ctx.stroke();
      break;
    }

    case TileType.DEEP_WATER: {
      // Deep water - darker with multiple waves
      ctx.fillStyle = "rgba(50, 100, 150, 0.5)";
      ctx.fillRect(xCo, yCo, width, height);
      ctx.strokeStyle = "rgba(30, 70, 120, 0.6)";
      for (let i = 0; i < 2; i++) {
        const waveY = cy - size * 0.15 + i * size * 0.3;
        ctx.beginPath();
        ctx.moveTo(xCo, waveY);
        ctx.quadraticCurveTo(xCo + width * 0.25, waveY - 3, xCo + width * 0.5, waveY);
        ctx.quadraticCurveTo(xCo + width * 0.75, waveY + 3, xCo + width, waveY);
        ctx.stroke();
      }
      break;
    }

    case TileType.LAVA: {
      // Lava - orange/red with bubbles
      ctx.fillStyle = "rgba(200, 80, 30, 0.5)";
      ctx.fillRect(xCo, yCo, width, height);
      ctx.strokeStyle = "rgba(150, 50, 20, 0.7)";
      // Bubbles
      ctx.beginPath();
      ctx.arc(cx - size * 0.15, cy, size * 0.08, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.2, cy - size * 0.1, size * 0.06, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case TileType.CRATE: {
      // Wooden crate - square with cross bracing
      const crateSize = size * 0.35;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - crateSize, cy - crateSize, crateSize * 2, crateSize * 2);
      // Cross bracing
      ctx.beginPath();
      ctx.moveTo(cx - crateSize, cy - crateSize);
      ctx.lineTo(cx + crateSize, cy + crateSize);
      ctx.moveTo(cx + crateSize, cy - crateSize);
      ctx.lineTo(cx - crateSize, cy + crateSize);
      ctx.stroke();
      break;
    }

    case TileType.BARREL: {
      // Barrel - oval with horizontal bands
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Main barrel shape (vertical oval)
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Horizontal bands
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy - size * 0.15);
      ctx.moveTo(cx - size * 0.25, cy + size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy + size * 0.15);
      ctx.stroke();
      break;
    }

    case TileType.BED: {
      // Bed - rectangle with pillow
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Bed frame
      ctx.strokeRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.5);
      // Pillow (smaller rect at top)
      ctx.fillStyle = "rgba(232, 217, 181, 0.8)";
      ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.25, size * 0.15);
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.2, size * 0.25, size * 0.15);
      // Blanket line
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy);
      ctx.lineTo(cx + size * 0.35, cy);
      ctx.stroke();
      break;
    }

    case TileType.TABLE: {
      // Table - rectangle with legs at corners
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Table top
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.4);
      // Table legs (small circles at corners)
      const legSize = size * 0.05;
      ctx.fillStyle = colors.border;
      ctx.beginPath();
      ctx.arc(cx - size * 0.25, cy - size * 0.15, legSize, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.25, cy - size * 0.15, legSize, 0, Math.PI * 2);
      ctx.arc(cx - size * 0.25, cy + size * 0.15, legSize, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.25, cy + size * 0.15, legSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.CHAIR: {
      // Chair - small square with back
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Seat
      ctx.strokeRect(cx - size * 0.15, cy - size * 0.1, size * 0.3, size * 0.25);
      // Back (thick line at top)
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.15, cy - size * 0.1);
      ctx.lineTo(cx - size * 0.15, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.15, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.15, cy - size * 0.1);
      ctx.stroke();
      break;
    }

    case TileType.BOOKSHELF: {
      // Bookshelf - tall rectangle with horizontal shelves
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Outer frame
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.35, size * 0.6, size * 0.7);
      // Shelves
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const shelfY = cy - size * 0.35 + (i * size * 0.7) / 4;
        ctx.moveTo(cx - size * 0.3, shelfY);
        ctx.lineTo(cx + size * 0.3, shelfY);
      }
      ctx.stroke();
      // Books (vertical lines on shelves)
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let shelf = 0; shelf < 3; shelf++) {
        const shelfY = cy - size * 0.35 + (shelf * size * 0.7) / 4 + size * 0.02;
        for (let book = 0; book < 4; book++) {
          const bookX = cx - size * 0.25 + book * size * 0.13;
          ctx.moveTo(bookX, shelfY);
          ctx.lineTo(bookX, shelfY + size * 0.14);
        }
      }
      ctx.stroke();
      break;
    }

    case TileType.CARPET: {
      // Carpet - decorative rug pattern
      ctx.fillStyle = "rgba(139, 69, 19, 0.3)";
      ctx.fillRect(xCo + 2, yCo + 2, width - 4, height - 4);
      ctx.strokeStyle = "rgba(139, 69, 19, 0.5)";
      ctx.lineWidth = 1;
      // Border pattern
      ctx.strokeRect(xCo + 4, yCo + 4, width - 8, height - 8);
      // Inner decorative lines
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(xCo + 7, yCo + 7, width - 14, height - 14);
      ctx.setLineDash([]);
      break;
    }

    case TileType.FIREPLACE: {
      // Fireplace - arch shape with flames
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Fireplace arch
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.3, cy + size * 0.3);
      ctx.lineTo(cx - size * 0.3, cy - size * 0.1);
      ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.3, cx, cy - size * 0.3);
      ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.3, cx + size * 0.3, cy - size * 0.1);
      ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
      ctx.stroke();
      // Flames
      ctx.fillStyle = "rgba(200, 100, 30, 0.6)";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.15, cy + size * 0.2);
      ctx.quadraticCurveTo(cx - size * 0.1, cy - size * 0.05, cx - size * 0.05, cy + size * 0.1);
      ctx.quadraticCurveTo(cx, cy - size * 0.15, cx + size * 0.05, cy + size * 0.1);
      ctx.quadraticCurveTo(cx + size * 0.1, cy - size * 0.05, cx + size * 0.15, cy + size * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case TileType.STATUE: {
      // Statue - pedestal with figure
      ctx.strokeStyle = colors.border;
      ctx.fillStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Pedestal base
      ctx.strokeRect(cx - size * 0.2, cy + size * 0.1, size * 0.4, size * 0.15);
      // Figure (simplified humanoid)
      ctx.beginPath();
      // Head
      ctx.arc(cx, cy - size * 0.2, size * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      // Body
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.1);
      ctx.lineTo(cx, cy + size * 0.1);
      // Arms
      ctx.moveTo(cx - size * 0.15, cy - size * 0.02);
      ctx.lineTo(cx + size * 0.15, cy - size * 0.02);
      ctx.stroke();
      break;
    }

    case TileType.ALTAR: {
      // Altar - ornate table with symbol
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      // Altar base (wider at bottom)
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy + size * 0.2);
      ctx.lineTo(cx - size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.35, cy + size * 0.2);
      ctx.closePath();
      ctx.stroke();
      // Top surface
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.25, size * 0.6, size * 0.1);
      // Sacred symbol (star/cross)
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.35);
      ctx.lineTo(cx, cy - size * 0.15);
      ctx.moveTo(cx - size * 0.1, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.1, cy - size * 0.25);
      ctx.stroke();
    }
      
    case TileType.RUBBLE: {
      // Scattered rocks and debris - irregular stones of varying sizes
      const rubbleRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.border;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.8;

      // Draw 5-8 scattered stones
      const stoneCount = 5 + Math.floor(rubbleRand() * 4);
      for (let i = 0; i < stoneCount; i++) {
        const stoneX = xCo + size * 0.15 + rubbleRand() * size * 0.7;
        const stoneY = yCo + size * 0.15 + rubbleRand() * size * 0.7;
        const stoneSize = size * (0.08 + rubbleRand() * 0.12);
        const points = 4 + Math.floor(rubbleRand() * 3); // 4-6 sided stones

        ctx.beginPath();
        for (let p = 0; p < points; p++) {
          const angle = (p / points) * Math.PI * 2 + rubbleRand() * 0.5;
          const radius = stoneSize * (0.6 + rubbleRand() * 0.4);
          const px = stoneX + Math.cos(angle) * radius;
          const py = stoneY + Math.sin(angle) * radius;
          if (p === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        // Some stones filled, some just outlined
        if (rubbleRand() < 0.5) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }

      // Add a few small dots for gravel
      for (let i = 0; i < 8; i++) {
        const dotX = xCo + size * 0.1 + rubbleRand() * size * 0.8;
        const dotY = yCo + size * 0.1 + rubbleRand() * size * 0.8;
        const dotSize = size * (0.02 + rubbleRand() * 0.03);
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case TileType.COLLAPSED: {
      // Cave-in / collapsed area - partial wall with debris spray
      const collapseRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.hatching;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;

      // Draw irregular collapsed mass (like a pile of rubble from above)
      ctx.beginPath();
      const collapsePoints = 8 + Math.floor(collapseRand() * 4);
      const collapseRadius = size * 0.35;

      for (let p = 0; p < collapsePoints; p++) {
        const angle = (p / collapsePoints) * Math.PI * 2;
        const radius = collapseRadius * (0.5 + collapseRand() * 0.5);
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (p === 0) {
          ctx.moveTo(px, py);
        } else {
          // Use quadratic curves for organic shapes
          const prevAngle = ((p - 0.5) / collapsePoints) * Math.PI * 2;
          const cpRadius = collapseRadius * (0.4 + collapseRand() * 0.6);
          const cpx = cx + Math.cos(prevAngle) * cpRadius;
          const cpy = cy + Math.sin(prevAngle) * cpRadius;
          ctx.quadraticCurveTo(cpx, cpy, px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw hatching lines on the collapsed mass for texture
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 6; i++) {
        const hx = cx - size * 0.2 + collapseRand() * size * 0.4;
        const hy = cy - size * 0.2 + collapseRand() * size * 0.4;
        const hlen = size * (0.1 + collapseRand() * 0.15);
        const hangle = collapseRand() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + Math.cos(hangle) * hlen, hy + Math.sin(hangle) * hlen);
        ctx.stroke();
      }

      // Spray of debris extending outward
      ctx.fillStyle = colors.border;
      for (let i = 0; i < 12; i++) {
        const angle = collapseRand() * Math.PI * 2;
        const dist = size * (0.3 + collapseRand() * 0.35);
        const debrisX = cx + Math.cos(angle) * dist;
        const debrisY = cy + Math.sin(angle) * dist;
        const debrisSize = size * (0.03 + collapseRand() * 0.06);

        // Irregular stone shapes
        const points = 3 + Math.floor(collapseRand() * 3);
        ctx.beginPath();
        for (let p = 0; p < points; p++) {
          const a = (p / points) * Math.PI * 2 + collapseRand() * 0.5;
          const r = debrisSize * (0.5 + collapseRand() * 0.5);
          const px = debrisX + Math.cos(a) * r;
          const py = debrisY + Math.sin(a) * r;
          if (p === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case TileType.FALLEN_COLUMN: {
      // Broken column sections - rectangular segments at angles
      const columnRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.parchment;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.2;

      // Draw 2-3 fallen column segments
      const segmentCount = 2 + Math.floor(columnRand() * 2);
      for (let i = 0; i < segmentCount; i++) {
        const segX = xCo + size * 0.2 + columnRand() * size * 0.3;
        const segY = yCo + size * 0.2 + columnRand() * size * 0.4;
        const segWidth = size * (0.35 + columnRand() * 0.2);
        const segHeight = size * (0.12 + columnRand() * 0.08);
        const angle = columnRand() * Math.PI - Math.PI / 2; // Random rotation

        ctx.save();
        ctx.translate(segX + segWidth / 2, segY + segHeight / 2);
        ctx.rotate(angle);

        // Draw column segment with rounded ends (like a drum section)
        ctx.beginPath();
        ctx.moveTo(-segWidth / 2, -segHeight / 2);
        ctx.lineTo(segWidth / 2 - segHeight / 2, -segHeight / 2);
        ctx.arc(segWidth / 2 - segHeight / 2, 0, segHeight / 2, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-segWidth / 2 + segHeight / 2, segHeight / 2);
        ctx.arc(-segWidth / 2 + segHeight / 2, 0, segHeight / 2, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Add fluting lines (vertical grooves typical of classical columns)
        ctx.lineWidth = 0.4;
        const flutes = 3 + Math.floor(columnRand() * 2);
        for (let f = 0; f < flutes; f++) {
          const fx = -segWidth / 2 + segHeight / 2 + (f + 0.5) * ((segWidth - segHeight) / flutes);
          ctx.beginPath();
          ctx.moveTo(fx, -segHeight / 2 + 1);
          ctx.lineTo(fx, segHeight / 2 - 1);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Add some small debris around the columns
      ctx.fillStyle = colors.border;
      for (let i = 0; i < 6; i++) {
        const debrisX = xCo + size * 0.1 + columnRand() * size * 0.8;
        const debrisY = yCo + size * 0.1 + columnRand() * size * 0.8;
        const debrisSize = size * (0.02 + columnRand() * 0.04);
        ctx.beginPath();
        ctx.arc(debrisX, debrisY, debrisSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
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

export type CompassPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CartouchePosition = "top" | "bottom";

export interface CompassRoseOptions {
  /** Position of the compass rose (default: "bottom-right") */
  position?: CompassPosition;
  /** Size of the compass rose in pixels (default: 60) */
  size?: number;
  /** Margin from edges in pixels (default: 15) */
  margin?: number;
  /** Main color for the compass (default: brownish ink) */
  color?: string;
  /** Secondary color for accents (default: lighter brown) */
  accentColor?: string;
}

/**
 * Draw a classic compass rose decoration on the map
 */
export function drawCompassRose(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: CompassRoseOptions = {}
): void {
  const {
    position = "bottom-right",
    size = 60,
    margin = 15,
    color = "rgba(70, 45, 20, 0.85)",
    accentColor = "rgba(120, 80, 40, 0.6)",
  } = options;

  // Calculate center position
  let cx: number;
  let cy: number;

  switch (position) {
    case "top-left":
      cx = margin + size / 2;
      cy = margin + size / 2;
      break;
    case "top-right":
      cx = canvasWidth - margin - size / 2;
      cy = margin + size / 2;
      break;
    case "bottom-left":
      cx = margin + size / 2;
      cy = canvasHeight - margin - size / 2;
      break;
    case "bottom-right":
    default:
      cx = canvasWidth - margin - size / 2;
      cy = canvasHeight - margin - size / 2;
      break;
  }

  const r = size / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Draw outer circle
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();

  // Draw inner decorative circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Draw main cardinal direction points (N, S, E, W)
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // North point (main, larger)
  const mainPointLen = r * 0.9;
  const mainPointWidth = r * 0.2;

  // Draw the 4 main points
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2);

    // Main point - filled triangle
    ctx.beginPath();
    ctx.moveTo(0, -mainPointLen);
    ctx.lineTo(-mainPointWidth, -r * 0.2);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(mainPointWidth, -r * 0.2);
    ctx.closePath();

    // North is filled solid, others are outlined
    if (i === 0) {
      ctx.fill();
    } else {
      ctx.stroke();
      // Fill with lighter color for other directions
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.fillStyle = color;
    }

    ctx.restore();
  }

  // Draw secondary diagonal points (NE, SE, SW, NW)
  const secondaryLen = r * 0.55;
  const secondaryWidth = r * 0.1;

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(0, -secondaryLen);
    ctx.lineTo(-secondaryWidth, -r * 0.25);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(secondaryWidth, -r * 0.25);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Draw direction labels
  ctx.fillStyle = color;
  ctx.font = `bold ${r * 0.28}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // N label (outside the point)
  ctx.fillText("N", 0, -r * 0.7);
  // S label
  ctx.fillText("S", 0, r * 0.7);
  // E label
  ctx.fillText("E", r * 0.7, 0);
  // W label
  ctx.fillText("W", -r * 0.7, 0);

  // Draw center decoration
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface TitleCartoucheOptions {
  /** The map title to display (required) */
  title: string;
  /** Subtitle or additional text (optional) */
  subtitle?: string;
  /** Position of the cartouche (default: "top") */
  position?: CartouchePosition;
  /** Font family for the title (default: "serif") */
  fontFamily?: string;
  /** Title font size in pixels (default: 24) */
  fontSize?: number;
  /** Margin from edge in pixels (default: 20) */
  margin?: number;
  /** Main color for text and decorations (default: brownish ink) */
  color?: string;
  /** Background color for the cartouche (default: parchment with transparency) */
  backgroundColor?: string;
  /** Horizontal padding inside the cartouche (default: 30) */
  paddingX?: number;
  /** Vertical padding inside the cartouche (default: 15) */
  paddingY?: number;
}

/**
 * Draw a decorative title cartouche (banner/frame) with the map title
 */
export function drawTitleCartouche(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: TitleCartoucheOptions
): void {
  const {
    title,
    subtitle,
    position = "top",
    fontFamily = "serif",
    fontSize = 24,
    margin = 20,
    color = "rgba(70, 45, 20, 0.9)",
    backgroundColor = "rgba(232, 217, 181, 0.95)",
    paddingX = 30,
    paddingY = 15,
  } = options;

  ctx.save();

  // Measure text dimensions
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const titleMetrics = ctx.measureText(title);
  const titleWidth = titleMetrics.width;
  const titleHeight = fontSize;

  let subtitleWidth = 0;
  let subtitleHeight = 0;
  const subtitleFontSize = fontSize * 0.6;
  if (subtitle) {
    ctx.font = `italic ${subtitleFontSize}px ${fontFamily}`;
    const subtitleMetrics = ctx.measureText(subtitle);
    subtitleWidth = subtitleMetrics.width;
    subtitleHeight = subtitleFontSize;
  }

  // Calculate cartouche dimensions
  const contentWidth = Math.max(titleWidth, subtitleWidth);
  const contentHeight = titleHeight + (subtitle ? subtitleHeight + 8 : 0);
  const cartoucheWidth = contentWidth + paddingX * 2;
  const cartoucheHeight = contentHeight + paddingY * 2;

  // Calculate position
  const cx = canvasWidth / 2;
  const cy = position === "top"
    ? margin + cartoucheHeight / 2
    : canvasHeight - margin - cartoucheHeight / 2;

  // Decorative scroll curl dimensions
  const curlWidth = 25;
  const curlHeight = cartoucheHeight * 0.6;

  // Draw the cartouche shape with decorative curls
  ctx.beginPath();

  // Main rectangle with slight curves
  const left = cx - cartoucheWidth / 2;
  const right = cx + cartoucheWidth / 2;
  const top = cy - cartoucheHeight / 2;
  const bottom = cy + cartoucheHeight / 2;
  const cornerRadius = 4;

  // Top edge with corner curves
  ctx.moveTo(left + cornerRadius, top);
  ctx.lineTo(right - cornerRadius, top);
  ctx.quadraticCurveTo(right, top, right, top + cornerRadius);

  // Right edge
  ctx.lineTo(right, bottom - cornerRadius);
  ctx.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);

  // Bottom edge
  ctx.lineTo(left + cornerRadius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - cornerRadius);

  // Left edge back to start
  ctx.lineTo(left, top + cornerRadius);
  ctx.quadraticCurveTo(left, top, left + cornerRadius, top);

  ctx.closePath();

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fill();

  // Draw decorative scroll curls on the sides
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  // Left curl
  ctx.beginPath();
  ctx.moveTo(left, cy - curlHeight / 2);
  ctx.bezierCurveTo(
    left - curlWidth * 0.8, cy - curlHeight / 3,
    left - curlWidth, cy,
    left - curlWidth * 0.6, cy + curlHeight / 4
  );
  ctx.bezierCurveTo(
    left - curlWidth * 0.3, cy + curlHeight / 2,
    left, cy + curlHeight / 3,
    left, cy + curlHeight / 2
  );
  ctx.stroke();

  // Right curl (mirrored)
  ctx.beginPath();
  ctx.moveTo(right, cy - curlHeight / 2);
  ctx.bezierCurveTo(
    right + curlWidth * 0.8, cy - curlHeight / 3,
    right + curlWidth, cy,
    right + curlWidth * 0.6, cy + curlHeight / 4
  );
  ctx.bezierCurveTo(
    right + curlWidth * 0.3, cy + curlHeight / 2,
    right, cy + curlHeight / 3,
    right, cy + curlHeight / 2
  );
  ctx.stroke();

  // Draw decorative border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Outer border
  ctx.beginPath();
  ctx.moveTo(left + cornerRadius, top);
  ctx.lineTo(right - cornerRadius, top);
  ctx.quadraticCurveTo(right, top, right, top + cornerRadius);
  ctx.lineTo(right, bottom - cornerRadius);
  ctx.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);
  ctx.lineTo(left + cornerRadius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - cornerRadius);
  ctx.lineTo(left, top + cornerRadius);
  ctx.quadraticCurveTo(left, top, left + cornerRadius, top);
  ctx.stroke();

  // Inner decorative border
  const inset = 4;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(left + cornerRadius + inset, top + inset);
  ctx.lineTo(right - cornerRadius - inset, top + inset);
  ctx.quadraticCurveTo(right - inset, top + inset, right - inset, top + cornerRadius + inset);
  ctx.lineTo(right - inset, bottom - cornerRadius - inset);
  ctx.quadraticCurveTo(right - inset, bottom - inset, right - cornerRadius - inset, bottom - inset);
  ctx.lineTo(left + cornerRadius + inset, bottom - inset);
  ctx.quadraticCurveTo(left + inset, bottom - inset, left + inset, bottom - cornerRadius - inset);
  ctx.lineTo(left + inset, top + cornerRadius + inset);
  ctx.quadraticCurveTo(left + inset, top + inset, left + cornerRadius + inset, top + inset);
  ctx.stroke();

  // Draw small decorative elements at corners
  const cornerDeco = 6;
  ctx.lineWidth = 1;

  // Top-left corner decoration
  ctx.beginPath();
  ctx.moveTo(left + cornerDeco, top + cornerDeco * 2);
  ctx.lineTo(left + cornerDeco, top + cornerDeco);
  ctx.lineTo(left + cornerDeco * 2, top + cornerDeco);
  ctx.stroke();

  // Top-right corner decoration
  ctx.beginPath();
  ctx.moveTo(right - cornerDeco, top + cornerDeco * 2);
  ctx.lineTo(right - cornerDeco, top + cornerDeco);
  ctx.lineTo(right - cornerDeco * 2, top + cornerDeco);
  ctx.stroke();

  // Bottom-left corner decoration
  ctx.beginPath();
  ctx.moveTo(left + cornerDeco, bottom - cornerDeco * 2);
  ctx.lineTo(left + cornerDeco, bottom - cornerDeco);
  ctx.lineTo(left + cornerDeco * 2, bottom - cornerDeco);
  ctx.stroke();

  // Bottom-right corner decoration
  ctx.beginPath();
  ctx.moveTo(right - cornerDeco, bottom - cornerDeco * 2);
  ctx.lineTo(right - cornerDeco, bottom - cornerDeco);
  ctx.lineTo(right - cornerDeco * 2, bottom - cornerDeco);
  ctx.stroke();

  // Draw title text
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textY = subtitle
    ? cy - subtitleHeight / 2 - 2
    : cy;

  ctx.fillText(title, cx, textY);

  // Draw subtitle if present
  if (subtitle) {
    ctx.font = `italic ${subtitleFontSize}px ${fontFamily}`;
    ctx.fillText(subtitle, cx, cy + titleHeight / 2 + 2);
  }

  ctx.restore();
}

/**
 * Draw fold lines/creases across the parchment for weathered look
 */
export function addFoldLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    /** Number of horizontal folds (default: 2) */
    horizontalFolds?: number;
    /** Number of vertical folds (default: 2) */
    verticalFolds?: number;
    /** Opacity of fold lines (default: 0.08) */
    opacity?: number;
    /** Seed for consistent random variation */
    seed?: number;
  } = {}
): void {
  const {
    horizontalFolds = 2,
    verticalFolds = 2,
    opacity = 0.08,
    seed = 54321,
  } = options;

  const rand = seededRandom(seed);

  ctx.save();

  // Draw horizontal fold lines
  for (let i = 1; i <= horizontalFolds; i++) {
    const baseY = (height / (horizontalFolds + 1)) * i;
    const wobble = rand() * 10 - 5;

    // Shadow line (darker, slightly offset)
    ctx.strokeStyle = `rgba(40, 25, 10, ${opacity * 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY + wobble + 1);

    // Create slight waviness
    for (let x = 0; x <= width; x += width / 8) {
      const y = baseY + wobble + Math.sin(x * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x, y + 1);
    }
    ctx.stroke();

    // Highlight line (lighter, above shadow)
    ctx.strokeStyle = `rgba(255, 250, 240, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY + wobble - 1);

    for (let x = 0; x <= width; x += width / 8) {
      const y = baseY + wobble + Math.sin(x * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x, y - 1);
    }
    ctx.stroke();
  }

  // Draw vertical fold lines
  for (let i = 1; i <= verticalFolds; i++) {
    const baseX = (width / (verticalFolds + 1)) * i;
    const wobble = rand() * 10 - 5;

    // Shadow line
    ctx.strokeStyle = `rgba(40, 25, 10, ${opacity * 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX + wobble + 1, 0);

    for (let y = 0; y <= height; y += height / 8) {
      const x = baseX + wobble + Math.sin(y * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x + 1, y);
    }
    ctx.stroke();

    // Highlight line
    ctx.strokeStyle = `rgba(255, 250, 240, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baseX + wobble - 1, 0);

    for (let y = 0; y <= height; y += height / 8) {
      const x = baseX + wobble + Math.sin(y * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x - 1, y);
    }
    ctx.stroke();
  }

  // Add subtle darkening along fold intersections
  for (let hi = 1; hi <= horizontalFolds; hi++) {
    for (let vi = 1; vi <= verticalFolds; vi++) {
      const fx = (width / (verticalFolds + 1)) * vi;
      const fy = (height / (horizontalFolds + 1)) * hi;

      const gradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, 20);
      gradient.addColorStop(0, `rgba(60, 40, 20, ${opacity * 0.5})`);
      gradient.addColorStop(1, "rgba(60, 40, 20, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(fx - 20, fy - 20, 40, 40);
    }
  }

  ctx.restore();
}
