import type { Grid } from "../types";
import { TileType, TerrainTile, MazeTile } from "../types";
import type { Palette } from "./palettes";
import { dungeonPalette, terrainPalette, mazePalette } from "./palettes";

export type RenderStyle = "dungeon" | "terrain" | "maze" | "simple";

export interface RenderOptions {
  /** Rendering style (default: "dungeon") */
  style?: RenderStyle;
  /** Color palette to use */
  palette?: Palette;
  /** Show grid lines (default: false) */
  showGrid?: boolean;
  /** Grid line color */
  gridColor?: string;
  /** Add shadows/3D effects (default: true for dungeon style) */
  shadows?: boolean;
}

function drawSimpleTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * width, y * height, width, height);
}

function drawDungeonTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Grid,
  palette: Palette,
  shadows: boolean
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  if (tileType === TileType.WALL) {
    ctx.fillStyle = palette[TileType.WALL] || "#2d2d2d";
    ctx.fillRect(xCo, yCo, width, height);
    return;
  }

  // Shadow
  if (shadows) {
    ctx.fillStyle = "#888888";
    ctx.fillRect(xCo + 2, yCo + 2, width, height);
  }

  // Main tile
  ctx.fillStyle = palette[tileType] || palette[TileType.FLOOR] || "#fefef4";
  ctx.fillRect(xCo, yCo, width, height);

  // Grid lines
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.strokeRect(xCo, yCo, width, height);

  // Door indicator
  if (tileType === TileType.DOOR) {
    ctx.fillStyle = "#5d3a1a";
    ctx.fillRect(xCo + width * 0.3, yCo + height * 0.4, width * 0.4, height * 0.2);
  }

  // Corridor indicator
  if (tileType === TileType.CORRIDOR) {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(xCo + 2, yCo + 2, width - 4, height - 4);
    ctx.setLineDash([]);
  }
}

function drawTerrainTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Grid,
  palette: Palette
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  // Base color
  ctx.fillStyle = palette[tileType] || "#ff00ff";
  ctx.fillRect(xCo, yCo, width, height);

  // Texture variation
  const variation = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.1;
  ctx.fillStyle = `rgba(${variation > 0 ? 255 : 0}, ${variation > 0 ? 255 : 0}, ${variation > 0 ? 255 : 0}, ${Math.abs(variation)})`;
  ctx.fillRect(xCo, yCo, width, height);

  // Water waves
  if (tileType === TerrainTile.DEEP_WATER || tileType === TerrainTile.WATER) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    const waveOffset = (x + y) % 3;
    ctx.moveTo(xCo, yCo + height * 0.3 + waveOffset);
    ctx.quadraticCurveTo(
      xCo + width * 0.5,
      yCo + height * 0.5 + waveOffset,
      xCo + width,
      yCo + height * 0.3 + waveOffset
    );
    ctx.stroke();
  }

  // Mountain peaks
  if (tileType === TerrainTile.MOUNTAIN) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(xCo + width * 0.5, yCo + height * 0.2);
    ctx.lineTo(xCo + width * 0.7, yCo + height * 0.5);
    ctx.lineTo(xCo + width * 0.3, yCo + height * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Forest trees
  if (tileType === TerrainTile.FOREST) {
    ctx.fillStyle = "#1b5e20";
    const treeX = xCo + width * 0.3 + (x % 2) * width * 0.2;
    const treeY = yCo + height * 0.3 + (y % 2) * height * 0.2;
    ctx.beginPath();
    ctx.arc(treeX, treeY, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMazeTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Grid,
  palette: Palette
): void {
  const xCo = x * width;
  const yCo = y * height;
  const tileType = grid[y][x];

  // Base color
  ctx.fillStyle = palette[tileType] || "#ff00ff";
  ctx.fillRect(xCo, yCo, width, height);

  // Start marker (play icon)
  if (tileType === MazeTile.START) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(xCo + width * 0.3, yCo + height * 0.2);
    ctx.lineTo(xCo + width * 0.7, yCo + height * 0.5);
    ctx.lineTo(xCo + width * 0.3, yCo + height * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  // End marker (circle)
  if (tileType === MazeTile.END) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(xCo + width * 0.5, yCo + height * 0.5, width * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wall shading
  if (tileType === MazeTile.WALL) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(xCo + width - 2, yCo, 2, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(xCo, yCo + height - 2, width, 2);
  }
}

/**
 * Render a grid to a canvas context
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  width: number,
  height: number,
  options: RenderOptions = {}
): void {
  const {
    style = "dungeon",
    palette: customPalette,
    showGrid = false,
    gridColor = "rgba(0, 0, 0, 0.1)",
    shadows = style === "dungeon",
  } = options;

  const tileWidth = width / grid[0].length;
  const tileHeight = height / grid.length;

  // Select palette
  let palette: Palette;
  if (customPalette) {
    palette = customPalette;
  } else {
    switch (style) {
      case "terrain":
        palette = terrainPalette;
        break;
      case "maze":
        palette = mazePalette;
        break;
      default:
        palette = dungeonPalette;
    }
  }

  // Clear canvas
  ctx.fillStyle = palette[0] || "#333333";
  ctx.fillRect(0, 0, width, height);

  // Draw tiles
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      switch (style) {
        case "terrain":
          drawTerrainTile(ctx, x, y, tileWidth, tileHeight, grid, palette);
          break;
        case "maze":
          drawMazeTile(ctx, x, y, tileWidth, tileHeight, grid, palette);
          break;
        case "simple":
          drawSimpleTile(
            ctx,
            x,
            y,
            tileWidth,
            tileHeight,
            palette[grid[y][x]] || "#ff00ff"
          );
          break;
        case "dungeon":
        default:
          drawDungeonTile(ctx, x, y, tileWidth, tileHeight, grid, palette, shadows);
          break;
      }
    }
  }

  // Optional grid overlay
  if (showGrid) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= grid.length; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileHeight);
      ctx.lineTo(width, y * tileHeight);
      ctx.stroke();
    }
    for (let x = 0; x <= grid[0].length; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileWidth, 0);
      ctx.lineTo(x * tileWidth, height);
      ctx.stroke();
    }
  }
}

/**
 * Render a grid to a new canvas element
 */
export function renderToCanvas(
  grid: Grid,
  width: number,
  height: number,
  options: RenderOptions = {}
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  drawGrid(ctx, grid, width, height, options);
  return canvas;
}

/**
 * Render a grid to a data URL
 */
export function renderToDataURL(
  grid: Grid,
  width: number,
  height: number,
  options: RenderOptions = {},
  format: "png" | "jpeg" = "png"
): string {
  const canvas = renderToCanvas(grid, width, height, options);
  return canvas.toDataURL(`image/${format}`);
}
