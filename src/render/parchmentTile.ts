import type { Grid } from "../types";
import { TileType } from "../types";
import {
  type ParchmentColors,
  type Edges,
  DEFAULT_PARCHMENT_COLORS,
  isFloorLike,
  findEdges,
  seededRandom,
} from "./parchmentUtils";

// Re-export types and utilities for backward compatibility
export type { ParchmentColors } from "./parchmentUtils";
export { DEFAULT_PARCHMENT_COLORS } from "./parchmentUtils";

// Re-export effects
export {
  addParchmentTexture,
  addParchmentScuffs,
  addVignette,
  addFoldLines,
} from "./parchmentEffects";

// Re-export decorations
export {
  drawCompassRose,
  drawTitleCartouche,
  type CompassPosition,
  type CompassRoseOptions,
  type CartouchePosition,
  type TitleCartoucheOptions,
} from "./parchmentDecorations";

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
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return;
  }

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

    const midFactor = 1 - Math.abs(segStart - 0.5) * 2;
    if (rand() < gapChance * midFactor && i < segments - 1 && i > 0) {
      drawing = false;
      currentPos += segmentLength * (0.3 + rand() * 0.4);
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

  const seed = Math.floor(xCo * 7 + yCo * 13);
  const rand = seededRandom(seed);
  const r = Math.min(width, height) * 0.2;

  const topLeft = edges[0] && edges[3];
  const topRight = edges[0] && edges[1];
  const bottomRight = edges[2] && edges[1];
  const bottomLeft = edges[2] && edges[3];

  for (let s = 0; s < 2; s++) {
    const off = (s - 0.5) * 0.6;
    ctx.lineWidth = s === 0 ? 1.5 : 0.8;
    const gapChance = s === 0 ? 0.12 : 0.18;

    if (edges[0]) {
      const y = yCo + 1 + off + Math.sin(seed + s) * 0.4;
      const x1 = topLeft ? xCo + r : xCo - 1;
      const x2 = topRight ? xCo + width - r : xCo + width + 1;
      drawLineWithGaps(ctx, x1, y, x2, y + Math.sin(seed + s + 1) * 0.4, rand, gapChance);
    }

    if (edges[1]) {
      const x = xCo + width - 1 - off + Math.sin(seed + s + 2) * 0.4;
      const y1 = topRight ? yCo + r : yCo - 1;
      const y2 = bottomRight ? yCo + height - r : yCo + height + 1;
      drawLineWithGaps(ctx, x, y1, x + Math.sin(seed + s + 3) * 0.4, y2, rand, gapChance);
    }

    if (edges[2]) {
      const y = yCo + height - 1 - off + Math.sin(seed + s + 4) * 0.4;
      const x1 = bottomLeft ? xCo + r : xCo - 1;
      const x2 = bottomRight ? xCo + width - r : xCo + width + 1;
      drawLineWithGaps(ctx, x1, y, x2, y + Math.sin(seed + s + 5) * 0.4, rand, gapChance);
    }

    if (edges[3]) {
      const x = xCo + 1 + off + Math.sin(seed + s + 6) * 0.4;
      const y1 = topLeft ? yCo + r : yCo - 1;
      const y2 = bottomLeft ? yCo + height - r : yCo + height + 1;
      drawLineWithGaps(ctx, x, y1, x + Math.sin(seed + s + 7) * 0.4, y2, rand, gapChance);
    }

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

  ctx.beginPath();
  ctx.moveTo(xCo, yCo + height);
  ctx.lineTo(xCo + width, yCo + height);
  ctx.stroke();

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
  colors: ParchmentColors = DEFAULT_PARCHMENT_COLORS
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  if (tileType === TileType.WALL) {
    drawGridLines(ctx, xCo, yCo, width, height, "rgba(160, 100, 60, 0.15)");
    if (isEdgeWall(grid, x, y)) {
      drawMarginHatching(ctx, xCo, yCo, width, height, grid, x, y, colors.hatching);
    }
    return;
  }

  const edges = findEdges(grid, x, y);

  const topLeft = edges[0] && edges[3];
  const topRight = edges[0] && edges[1];
  const bottomRight = edges[2] && edges[1];
  const bottomLeft = edges[2] && edges[3];
  const r = Math.min(width, height) * 0.2;

  ctx.fillStyle = colors.parchment;

  if (topLeft || topRight || bottomRight || bottomLeft) {
    ctx.beginPath();
    if (topLeft) {
      ctx.moveTo(xCo + r, yCo);
    } else {
      ctx.moveTo(xCo, yCo);
    }

    if (topRight) {
      ctx.lineTo(xCo + width - r, yCo);
      ctx.arcTo(xCo + width, yCo, xCo + width, yCo + r, r);
    } else {
      ctx.lineTo(xCo + width, yCo);
    }

    if (bottomRight) {
      ctx.lineTo(xCo + width, yCo + height - r);
      ctx.arcTo(xCo + width, yCo + height, xCo + width - r, yCo + height, r);
    } else {
      ctx.lineTo(xCo + width, yCo + height);
    }

    if (bottomLeft) {
      ctx.lineTo(xCo + r, yCo + height);
      ctx.arcTo(xCo, yCo + height, xCo, yCo + height - r, r);
    } else {
      ctx.lineTo(xCo, yCo + height);
    }

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

  drawGridLines(ctx, xCo, yCo, width, height, colors.gridLine);
  drawSketchyBorder(ctx, xCo, yCo, width, height, edges, colors.border);
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
      const secretAbove = y > 0 && grid[y - 1][x] === TileType.SECRET_DOOR;
      const secretBelow = y < grid.length - 1 && grid[y + 1][x] === TileType.SECRET_DOOR;
      const secretHorizontal =
        (x > 0 && grid[y][x - 1] === TileType.SECRET_DOOR) ||
        (x < grid[0].length - 1 && grid[y][x + 1] === TileType.SECRET_DOOR);
      const isSecretVertical =
        secretAbove || secretBelow || (!secretHorizontal && edges[0] && edges[2]);

      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;

      if (isSecretVertical) {
        ctx.beginPath();
        ctx.moveTo(cx, yCo + height * 0.1);
        ctx.lineTo(cx, yCo + height * 0.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(xCo + width * 0.1, cy);
        ctx.lineTo(xCo + width * 0.9, cy);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.font = `bold ${size * 0.35}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = colors.border;
      ctx.fillText("S", cx, cy);
      break;
    }

    case TileType.STAIRS_UP: {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const stepY = yCo + height * 0.2 + i * height * 0.15;
        const stepWidth = width * (0.7 - i * 0.1);
        ctx.moveTo(cx - stepWidth / 2, stepY);
        ctx.lineTo(cx + stepWidth / 2, stepY);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, yCo + height * 0.1);
      ctx.lineTo(cx - size * 0.15, yCo + height * 0.25);
      ctx.moveTo(cx, yCo + height * 0.1);
      ctx.lineTo(cx + size * 0.15, yCo + height * 0.25);
      ctx.stroke();
      break;
    }

    case TileType.STAIRS_DOWN: {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const stepY = yCo + height * 0.25 + i * height * 0.15;
        const stepWidth = width * (0.4 + i * 0.1);
        ctx.moveTo(cx - stepWidth / 2, stepY);
        ctx.lineTo(cx + stepWidth / 2, stepY);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, yCo + height * 0.9);
      ctx.lineTo(cx - size * 0.15, yCo + height * 0.75);
      ctx.moveTo(cx, yCo + height * 0.9);
      ctx.lineTo(cx + size * 0.15, yCo + height * 0.75);
      ctx.stroke();
      break;
    }

    case TileType.PIT: {
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
      ctx.beginPath();
      ctx.rect(cx - size * 0.25, cy - size * 0.15, size * 0.5, size * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.25, cy - size * 0.15);
      ctx.quadraticCurveTo(cx, cy - size * 0.35, cx + size * 0.25, cy - size * 0.15);
      ctx.stroke();
      ctx.fillRect(cx - size * 0.05, cy - size * 0.05, size * 0.1, size * 0.1);
      break;
    }

    case TileType.TRAP: {
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(cx - size * 0.25, cy - size * 0.25, size * 0.5, size * 0.5);
      ctx.setLineDash([]);
      ctx.fillRect(cx - 1, cy - size * 0.15, 2, size * 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.TRAP_PIT: {
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
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
      ctx.fillStyle = "rgba(200, 80, 30, 0.5)";
      ctx.fillRect(xCo, yCo, width, height);
      ctx.strokeStyle = "rgba(150, 50, 20, 0.7)";
      ctx.beginPath();
      ctx.arc(cx - size * 0.15, cy, size * 0.08, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.2, cy - size * 0.1, size * 0.06, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case TileType.CRATE: {
      const crateSize = size * 0.35;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - crateSize, cy - crateSize, crateSize * 2, crateSize * 2);
      ctx.beginPath();
      ctx.moveTo(cx - crateSize, cy - crateSize);
      ctx.lineTo(cx + crateSize, cy + crateSize);
      ctx.moveTo(cx + crateSize, cy - crateSize);
      ctx.lineTo(cx - crateSize, cy + crateSize);
      ctx.stroke();
      break;
    }

    case TileType.BARREL: {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy - size * 0.15);
      ctx.moveTo(cx - size * 0.25, cy + size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy + size * 0.15);
      ctx.stroke();
      break;
    }

    case TileType.BED: {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.5);
      ctx.fillStyle = "rgba(232, 217, 181, 0.8)";
      ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.25, size * 0.15);
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.2, size * 0.25, size * 0.15);
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy);
      ctx.lineTo(cx + size * 0.35, cy);
      ctx.stroke();
      break;
    }

    case TileType.TABLE: {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.4);
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
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size * 0.15, cy - size * 0.1, size * 0.3, size * 0.25);
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
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.35, size * 0.6, size * 0.7);
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const shelfY = cy - size * 0.35 + (i * size * 0.7) / 4;
        ctx.moveTo(cx - size * 0.3, shelfY);
        ctx.lineTo(cx + size * 0.3, shelfY);
      }
      ctx.stroke();
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
      ctx.fillStyle = "rgba(139, 69, 19, 0.3)";
      ctx.fillRect(xCo + 2, yCo + 2, width - 4, height - 4);
      ctx.strokeStyle = "rgba(139, 69, 19, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(xCo + 4, yCo + 4, width - 8, height - 8);
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(xCo + 7, yCo + 7, width - 14, height - 14);
      ctx.setLineDash([]);
      break;
    }

    case TileType.FIREPLACE: {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.3, cy + size * 0.3);
      ctx.lineTo(cx - size * 0.3, cy - size * 0.1);
      ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.3, cx, cy - size * 0.3);
      ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.3, cx + size * 0.3, cy - size * 0.1);
      ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
      ctx.stroke();
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
      ctx.strokeStyle = colors.border;
      ctx.fillStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size * 0.2, cy + size * 0.1, size * 0.4, size * 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.2, size * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.1);
      ctx.lineTo(cx, cy + size * 0.1);
      ctx.moveTo(cx - size * 0.15, cy - size * 0.02);
      ctx.lineTo(cx + size * 0.15, cy - size * 0.02);
      ctx.stroke();
      break;
    }

    case TileType.ALTAR: {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy + size * 0.2);
      ctx.lineTo(cx - size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.25, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.35, cy + size * 0.2);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(cx - size * 0.3, cy - size * 0.25, size * 0.6, size * 0.1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.35);
      ctx.lineTo(cx, cy - size * 0.15);
      ctx.moveTo(cx - size * 0.1, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.1, cy - size * 0.25);
      ctx.stroke();
      break;
    }

    case TileType.RUBBLE: {
      const rubbleRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.border;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.8;

      const stoneCount = 5 + Math.floor(rubbleRand() * 4);
      for (let i = 0; i < stoneCount; i++) {
        const stoneX = xCo + size * 0.15 + rubbleRand() * size * 0.7;
        const stoneY = yCo + size * 0.15 + rubbleRand() * size * 0.7;
        const stoneSize = size * (0.08 + rubbleRand() * 0.12);
        const points = 4 + Math.floor(rubbleRand() * 3);

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
        if (rubbleRand() < 0.5) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }

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
      const collapseRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.hatching;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;

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

      ctx.fillStyle = colors.border;
      for (let i = 0; i < 12; i++) {
        const angle = collapseRand() * Math.PI * 2;
        const dist = size * (0.3 + collapseRand() * 0.35);
        const debrisX = cx + Math.cos(angle) * dist;
        const debrisY = cy + Math.sin(angle) * dist;
        const debrisSize = size * (0.03 + collapseRand() * 0.06);

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
      const columnRand = seededRandom(x * 1000 + y);
      ctx.fillStyle = colors.parchment;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.2;

      const segmentCount = 2 + Math.floor(columnRand() * 2);
      for (let i = 0; i < segmentCount; i++) {
        const segX = xCo + size * 0.2 + columnRand() * size * 0.3;
        const segY = yCo + size * 0.2 + columnRand() * size * 0.4;
        const segWidth = size * (0.35 + columnRand() * 0.2);
        const segHeight = size * (0.12 + columnRand() * 0.08);
        const angle = columnRand() * Math.PI - Math.PI / 2;

        ctx.save();
        ctx.translate(segX + segWidth / 2, segY + segHeight / 2);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(-segWidth / 2, -segHeight / 2);
        ctx.lineTo(segWidth / 2 - segHeight / 2, -segHeight / 2);
        ctx.arc(segWidth / 2 - segHeight / 2, 0, segHeight / 2, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-segWidth / 2 + segHeight / 2, segHeight / 2);
        ctx.arc(-segWidth / 2 + segHeight / 2, 0, segHeight / 2, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

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
