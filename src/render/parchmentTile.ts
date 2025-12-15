import type { Grid, Room } from "../types";
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
    tile === TileType.LAVA
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
 * Now supports varied angles for a more organic, crosshatch-like pattern
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
  color: string,
  variedAngles = true
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  const rand = seededRandom(x * 1000 + y);
  const baseSpacing = 3.5;
  const strokeLen = Math.min(width, height) * 0.55;

  // Varied angle offsets for more organic hatching
  const getAngleVariation = () => variedAngles ? (rand() - 0.5) * 0.4 : 0;

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
      const angleVar = getAngleVariation();
      ctx.beginPath();
      ctx.moveTo(xCo + i + rand() * 2, yCo);
      ctx.lineTo(xCo + i + len * (0.4 + angleVar) + rand() * 2, yCo + len);
      ctx.stroke();

      // Add occasional crosshatch stroke
      if (variedAngles && rand() < 0.3) {
        ctx.lineWidth = 0.4 + rand() * 0.3;
        ctx.beginPath();
        ctx.moveTo(xCo + i + rand() * 2 + len * 0.2, yCo + len * 0.3);
        ctx.lineTo(xCo + i - len * 0.3 + rand() * 2, yCo + len * 0.8);
        ctx.stroke();
      }
    }
  }

  if (floorBelow) {
    for (let i = 0; i < width; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      const angleVar = getAngleVariation();
      ctx.beginPath();
      ctx.moveTo(xCo + i + rand() * 2, yCo + height);
      ctx.lineTo(xCo + i + len * (0.4 + angleVar) + rand() * 2, yCo + height - len);
      ctx.stroke();

      // Add occasional crosshatch stroke
      if (variedAngles && rand() < 0.3) {
        ctx.lineWidth = 0.4 + rand() * 0.3;
        ctx.beginPath();
        ctx.moveTo(xCo + i + rand() * 2 + len * 0.2, yCo + height - len * 0.3);
        ctx.lineTo(xCo + i - len * 0.3 + rand() * 2, yCo + height - len * 0.8);
        ctx.stroke();
      }
    }
  }

  if (floorLeft) {
    for (let i = 0; i < height; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      const angleVar = getAngleVariation();
      ctx.beginPath();
      ctx.moveTo(xCo, yCo + i + rand() * 2);
      ctx.lineTo(xCo + len, yCo + i + len * (0.4 + angleVar) + rand() * 2);
      ctx.stroke();

      // Add occasional crosshatch stroke
      if (variedAngles && rand() < 0.3) {
        ctx.lineWidth = 0.4 + rand() * 0.3;
        ctx.beginPath();
        ctx.moveTo(xCo + len * 0.3, yCo + i + rand() * 2 + len * 0.2);
        ctx.lineTo(xCo + len * 0.8, yCo + i - len * 0.3 + rand() * 2);
        ctx.stroke();
      }
    }
  }

  if (floorRight) {
    for (let i = 0; i < height; i += baseSpacing + rand() * 2) {
      ctx.lineWidth = 0.6 + rand() * 0.4;
      const len = strokeLen * (0.7 + rand() * 0.5);
      const angleVar = getAngleVariation();
      ctx.beginPath();
      ctx.moveTo(xCo + width, yCo + i + rand() * 2);
      ctx.lineTo(xCo + width - len, yCo + i + len * (0.4 + angleVar) + rand() * 2);
      ctx.stroke();

      // Add occasional crosshatch stroke
      if (variedAngles && rand() < 0.3) {
        ctx.lineWidth = 0.4 + rand() * 0.3;
        ctx.beginPath();
        ctx.moveTo(xCo + width - len * 0.3, yCo + i + rand() * 2 + len * 0.2);
        ctx.lineTo(xCo + width - len * 0.8, yCo + i - len * 0.3 + rand() * 2);
        ctx.stroke();
      }
    }
  }
}

/**
 * Draw a line segment with optional gaps and organic wobble for a hand-drawn look
 */
function drawLineWithGaps(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rand: () => number,
  gapChance = 0.15,
  wobbleAmount = 0.8
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 8) {
    // Short lines - draw with slight wobble but no gaps
    ctx.beginPath();
    ctx.moveTo(x1 + (rand() - 0.5) * wobbleAmount, y1 + (rand() - 0.5) * wobbleAmount);
    ctx.lineTo(x2 + (rand() - 0.5) * wobbleAmount, y2 + (rand() - 0.5) * wobbleAmount);
    ctx.stroke();
    return;
  }

  // Calculate perpendicular direction for wobble
  const perpX = -dy / length;
  const perpY = dx / length;

  // Break line into segments with potential gaps and wobble
  const segmentLength = 4 + rand() * 6;
  const segments = Math.ceil(length / segmentLength);

  let currentPos = 0;
  let drawing = true;
  let lastWobble = (rand() - 0.5) * wobbleAmount;

  for (let i = 0; i < segments; i++) {
    const segStart = currentPos / length;
    const segEnd = Math.min((currentPos + segmentLength) / length, 1);

    if (drawing) {
      // Add organic wobble perpendicular to line direction
      const startWobble = lastWobble;
      const endWobble = (rand() - 0.5) * wobbleAmount * 1.5;

      const startX = x1 + dx * segStart + perpX * startWobble;
      const startY = y1 + dy * segStart + perpY * startWobble;
      const endX = x1 + dx * segEnd + perpX * endWobble;
      const endY = y1 + dy * segEnd + perpY * endWobble;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      lastWobble = endWobble;
    }

    // Randomly decide to create a gap (more likely in the middle of lines)
    const midFactor = 1 - Math.abs(segStart - 0.5) * 2; // Higher in middle
    if (rand() < gapChance * midFactor && i < segments - 1 && i > 0) {
      drawing = false;
      currentPos += segmentLength * (0.3 + rand() * 0.4); // Gap size
      lastWobble = (rand() - 0.5) * wobbleAmount; // Reset wobble after gap
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

export type ScaleBarPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ScaleBarOptions {
  /** Position of the scale bar (default: "bottom-left") */
  position?: ScaleBarPosition;
  /** Label text (default: "10 ft") */
  label?: string;
  /** Number of tiles the scale bar represents (default: 2) */
  tiles?: number;
  /** Margin from edges in pixels (default: 15) */
  margin?: number;
  /** Main color (default: brownish ink) */
  color?: string;
}

/**
 * Draw a scale bar on the map
 */
export function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tileWidth: number,
  options: ScaleBarOptions = {}
): void {
  const {
    position = "bottom-left",
    label = "10 ft",
    tiles = 2,
    margin = 15,
    color = "rgba(70, 45, 20, 0.85)",
  } = options;

  const barWidth = tileWidth * tiles;
  const barHeight = 4;

  // Calculate position
  let x: number;
  let y: number;

  switch (position) {
    case "top-left":
      x = margin;
      y = margin;
      break;
    case "top-right":
      x = canvasWidth - margin - barWidth;
      y = margin;
      break;
    case "bottom-right":
      x = canvasWidth - margin - barWidth;
      y = canvasHeight - margin - barHeight - 15;
      break;
    case "bottom-left":
    default:
      x = margin;
      y = canvasHeight - margin - barHeight - 15;
      break;
  }

  ctx.save();

  // Draw scale bar background
  ctx.fillStyle = "rgba(232, 217, 181, 0.8)";
  ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 25);

  // Draw bar with alternating segments
  ctx.fillStyle = color;
  const segmentWidth = barWidth / tiles;
  for (let i = 0; i < tiles; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(x + i * segmentWidth, y, segmentWidth, barHeight);
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + i * segmentWidth, y, segmentWidth, barHeight);
    }
  }

  // Draw end caps
  ctx.fillRect(x, y - 3, 2, barHeight + 6);
  ctx.fillRect(x + barWidth - 2, y - 3, 2, barHeight + 6);

  // Draw label
  ctx.fillStyle = color;
  ctx.font = `${Math.max(10, tileWidth * 0.4)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + barWidth / 2, y + barHeight + 3);

  ctx.restore();
}

export interface RoomLabelOptions {
  /** Font size multiplier (default: 1) */
  fontSizeMultiplier?: number;
  /** Use Roman numerals (default: true) */
  romanNumerals?: boolean;
  /** Main color (default: brownish ink) */
  color?: string;
  /** Minimum room size to label (default: "small") */
  minSize?: "tiny" | "small" | "medium" | "large" | "huge";
}

/**
 * Convert number to Roman numeral
 */
function toRoman(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

  let result = "";
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  return result;
}

/**
 * Draw room labels/numbers on the map
 */
export function drawRoomLabels(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  tileWidth: number,
  tileHeight: number,
  options: RoomLabelOptions = {}
): void {
  const {
    fontSizeMultiplier = 1,
    romanNumerals = true,
    color = "rgba(70, 45, 20, 0.7)",
    minSize = "small",
  } = options;

  const sizeOrder = ["tiny", "small", "medium", "large", "huge"];
  const minSizeIndex = sizeOrder.indexOf(minSize);

  ctx.save();

  // Sort rooms by position (top-left to bottom-right) for consistent numbering
  const sortedRooms = [...rooms].sort((a, b) => {
    const aPos = a.center.y * 1000 + a.center.x;
    const bPos = b.center.y * 1000 + b.center.x;
    return aPos - bPos;
  });

  let labelNum = 1;
  for (const room of sortedRooms) {
    // Skip rooms that are too small
    const roomSizeIndex = sizeOrder.indexOf(room.size);
    if (roomSizeIndex < minSizeIndex) continue;

    const cx = room.center.x * tileWidth + tileWidth / 2;
    const cy = room.center.y * tileHeight + tileHeight / 2;

    // Calculate font size based on room size
    const baseFontSize = Math.min(
      room.bounds.width * tileWidth * 0.3,
      room.bounds.height * tileHeight * 0.3,
      tileWidth * 2
    );
    const fontSize = Math.max(10, baseFontSize * fontSizeMultiplier);

    const label = romanNumerals ? toRoman(labelNum) : String(labelNum);

    // Draw label with slight shadow for readability
    ctx.font = `bold ${fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Shadow
    ctx.fillStyle = "rgba(232, 217, 181, 0.6)";
    ctx.fillText(label, cx + 1, cy + 1);

    // Main text
    ctx.fillStyle = color;
    ctx.fillText(label, cx, cy);

    labelNum++;
  }

  ctx.restore();
}

export interface PillarOptions {
  /** Minimum room size to add pillars (default: "large") */
  minRoomSize?: "medium" | "large" | "huge";
  /** Pillar size as fraction of tile (default: 0.3) */
  pillarSize?: number;
  /** Main color (default: brownish ink) */
  color?: string;
  /** Spacing between pillars in tiles (default: 3) */
  spacing?: number;
}

/**
 * Draw pillars/columns in large rooms
 */
export function drawPillars(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  rooms: Room[],
  tileWidth: number,
  tileHeight: number,
  options: PillarOptions = {}
): void {
  const {
    minRoomSize = "large",
    pillarSize = 0.3,
    color = "rgba(70, 45, 20, 0.85)",
    spacing = 3,
  } = options;

  const sizeOrder = ["tiny", "small", "medium", "large", "huge"];
  const minSizeIndex = sizeOrder.indexOf(minRoomSize);

  ctx.save();

  for (const room of rooms) {
    // Skip rooms that are too small
    const roomSizeIndex = sizeOrder.indexOf(room.size);
    if (roomSizeIndex < minSizeIndex) continue;

    // Skip rooms that aren't rectangular enough (pillars look odd in irregular shapes)
    const rectArea = room.bounds.width * room.bounds.height;
    const fillRatio = room.area / rectArea;
    if (fillRatio < 0.7) continue;

    // Calculate pillar positions - place pillars in a grid pattern with margin from walls
    const marginTiles = 1;
    const innerWidth = room.bounds.width - marginTiles * 2;
    const innerHeight = room.bounds.height - marginTiles * 2;

    // Need at least spacing tiles to place pillars
    if (innerWidth < spacing || innerHeight < spacing) continue;

    // Calculate number of pillars
    const pillarsX = Math.floor(innerWidth / spacing);
    const pillarsY = Math.floor(innerHeight / spacing);

    if (pillarsX < 2 || pillarsY < 2) continue;

    // Calculate actual spacing
    const spacingX = innerWidth / pillarsX;
    const spacingY = innerHeight / pillarsY;

    // Draw pillars
    for (let py = 0; py <= pillarsY; py++) {
      for (let px = 0; px <= pillarsX; px++) {
        // Skip center pillars (keep center clear)
        if (px > 0 && px < pillarsX && py > 0 && py < pillarsY) continue;

        const tileX = room.bounds.x + marginTiles + px * spacingX;
        const tileY = room.bounds.y + marginTiles + py * spacingY;

        // Verify tile is a floor
        const gridX = Math.floor(tileX);
        const gridY = Math.floor(tileY);
        if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[0].length) continue;
        if (grid[gridY][gridX] !== TileType.FLOOR) continue;

        const cx = tileX * tileWidth + tileWidth / 2;
        const cy = tileY * tileHeight + tileHeight / 2;
        const radius = Math.min(tileWidth, tileHeight) * pillarSize / 2;

        // Draw pillar (circle with inner shading)
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(232, 217, 181, 0.9)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(cx - radius * 0.2, cy - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();

        // Shadow
        ctx.beginPath();
        ctx.arc(cx + radius * 0.15, cy + radius * 0.15, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(70, 45, 20, 0.2)";
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Draw full grid lines across the entire parchment (including wall areas)
 */
export function drawFullGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridWidth: number,
  gridHeight: number,
  tileWidth: number,
  tileHeight: number,
  color = "rgba(160, 100, 60, 0.12)"
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Horizontal lines
  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileHeight);
    ctx.lineTo(width, y * tileHeight);
    ctx.stroke();
  }

  // Vertical lines
  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileWidth, 0);
    ctx.lineTo(x * tileWidth, height);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Add torn/rough edges effect to the parchment border
 */
export function addTornEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    /** Depth of tears (default: 8) */
    tearDepth?: number;
    /** Frequency of tears (default: 0.1) */
    tearFrequency?: number;
    /** Edge color (default: darker parchment) */
    edgeColor?: string;
    /** Seed for consistent randomization */
    seed?: number;
  } = {}
): void {
  const {
    tearDepth = 8,
    tearFrequency = 0.1,
    edgeColor = "rgba(150, 120, 80, 0.6)",
    seed = 98765,
  } = options;

  const rand = seededRandom(seed);

  ctx.save();
  ctx.fillStyle = edgeColor;

  // Top edge
  for (let x = 0; x < width; x += 3) {
    if (rand() < tearFrequency) {
      const tearWidth = 5 + rand() * 15;
      const depth = rand() * tearDepth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + tearWidth / 2, depth);
      ctx.lineTo(x + tearWidth, 0);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Bottom edge
  for (let x = 0; x < width; x += 3) {
    if (rand() < tearFrequency) {
      const tearWidth = 5 + rand() * 15;
      const depth = rand() * tearDepth;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + tearWidth / 2, height - depth);
      ctx.lineTo(x + tearWidth, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Left edge
  for (let y = 0; y < height; y += 3) {
    if (rand() < tearFrequency) {
      const tearHeight = 5 + rand() * 15;
      const depth = rand() * tearDepth;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(depth, y + tearHeight / 2);
      ctx.lineTo(0, y + tearHeight);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Right edge
  for (let y = 0; y < height; y += 3) {
    if (rand() < tearFrequency) {
      const tearHeight = 5 + rand() * 15;
      const depth = rand() * tearDepth;
      ctx.beginPath();
      ctx.moveTo(width, y);
      ctx.lineTo(width - depth, y + tearHeight / 2);
      ctx.lineTo(width, y + tearHeight);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}
