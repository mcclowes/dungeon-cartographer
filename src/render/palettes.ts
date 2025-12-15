import { TileType, TerrainTile, MazeTile } from "../types";

export type Palette = Record<number, string>;

/** Dungeon palette for caves, BSP, WFC, drunkard walk */
export const dungeonPalette: Palette = {
  [TileType.WALL]: "#2d2d2d",
  [TileType.FLOOR]: "#fefef4",
  [TileType.DOOR]: "#8b4513",
  [TileType.SECRET_DOOR]: "#654321",
  [TileType.CORRIDOR]: "#d4c4a8",
};

/** Terrain palette for Perlin generator */
export const terrainPalette: Palette = {
  [TerrainTile.DEEP_WATER]: "#1a4480",
  [TerrainTile.WATER]: "#4a90d9",
  [TerrainTile.SAND]: "#f4e4bc",
  [TerrainTile.GRASS]: "#7cb342",
  [TerrainTile.FOREST]: "#2e7d32",
  [TerrainTile.MOUNTAIN]: "#9e9e9e",
};

/** Maze palette */
export const mazePalette: Palette = {
  [MazeTile.WALL]: "#1a1a2e",
  [MazeTile.PASSAGE]: "#eee8d5",
  [MazeTile.START]: "#2ecc71",
  [MazeTile.END]: "#e74c3c",
};

/** Dark dungeon palette variant */
export const darkDungeonPalette: Palette = {
  [TileType.WALL]: "#1a1a1a",
  [TileType.FLOOR]: "#3d3d3d",
  [TileType.DOOR]: "#5d3a1a",
  [TileType.SECRET_DOOR]: "#3d2a0a",
  [TileType.CORRIDOR]: "#4a4a4a",
};

export type PaletteType = "dungeon" | "terrain" | "maze" | "darkDungeon";

export function getPalette(type: PaletteType): Palette {
  switch (type) {
    case "terrain":
      return terrainPalette;
    case "maze":
      return mazePalette;
    case "darkDungeon":
      return darkDungeonPalette;
    case "dungeon":
    default:
      return dungeonPalette;
  }
}
