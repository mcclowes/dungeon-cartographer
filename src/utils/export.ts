import type { Grid } from "../types";
import { TileType } from "../types";

/**
 * Metadata for exported map data
 */
export interface MapMetadata {
  /** Name of the map */
  name?: string;
  /** Generator used to create the map */
  generator?: string;
  /** Random seed used for generation */
  seed?: number;
  /** Generation parameters */
  params?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt?: string;
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

/**
 * JSON export format
 */
export interface MapJSON {
  version: string;
  width: number;
  height: number;
  grid: number[][];
  metadata: MapMetadata;
  tileTypes: Record<number, string>;
}

/**
 * Export options for JSON format
 */
export interface JSONExportOptions {
  /** Include tile type mapping (default: true) */
  includeTileTypes?: boolean;
  /** Pretty print JSON (default: true) */
  pretty?: boolean;
  /** Map metadata */
  metadata?: MapMetadata;
}

/**
 * Export a grid to JSON format with metadata
 *
 * @param grid - The grid to export
 * @param options - Export options
 * @returns JSON string representation of the map
 *
 * @example
 * ```ts
 * const json = exportToJSON(grid, {
 *   metadata: { name: "My Dungeon", generator: "bsp", seed: 12345 }
 * });
 * ```
 */
export function exportToJSON(grid: Grid, options: JSONExportOptions = {}): string {
  const { includeTileTypes = true, pretty = true, metadata = {} } = options;

  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  const mapData: MapJSON = {
    version: "1.0.0",
    width,
    height,
    grid,
    metadata: {
      ...metadata,
      createdAt: metadata.createdAt ?? new Date().toISOString(),
    },
    tileTypes: {},
  };

  if (includeTileTypes) {
    // Include mapping of tile values to names
    mapData.tileTypes = Object.fromEntries(
      Object.entries(TileType)
        .filter(([key]) => isNaN(Number(key)))
        .map(([key, value]) => [value, key])
    );
  }

  return pretty ? JSON.stringify(mapData, null, 2) : JSON.stringify(mapData);
}

/**
 * Import a grid from JSON format
 *
 * @param json - JSON string to import
 * @returns Parsed map data with grid and metadata
 *
 * @example
 * ```ts
 * const { grid, metadata } = importFromJSON(jsonString);
 * ```
 */
export function importFromJSON(json: string): { grid: Grid; metadata: MapMetadata } {
  const data = JSON.parse(json) as MapJSON;

  if (!data.grid || !Array.isArray(data.grid)) {
    throw new Error("Invalid JSON: missing or invalid grid data");
  }

  return {
    grid: data.grid,
    metadata: data.metadata ?? {},
  };
}

/**
 * TMX export options
 */
export interface TMXExportOptions {
  /** Map name (default: "dungeon") */
  name?: string;
  /** Tile width in pixels (default: 32) */
  tileWidth?: number;
  /** Tile height in pixels (default: 32) */
  tileHeight?: number;
  /** Tileset name (default: "dungeon_tiles") */
  tilesetName?: string;
  /** Tileset image source path */
  tilesetSource?: string;
  /** Tileset image width */
  tilesetImageWidth?: number;
  /** Tileset image height */
  tilesetImageHeight?: number;
  /** First tile GID (default: 1) */
  firstGid?: number;
  /** Custom tile ID mapping (grid value -> tileset ID) */
  tileMapping?: Record<number, number>;
  /** Layer name (default: "Tiles") */
  layerName?: string;
  /** Include object layer for features (default: true) */
  includeObjectLayer?: boolean;
}

/**
 * Default tile mapping from TileType to tileset IDs
 * Maps dungeon-cartographer tile types to generic tileset positions
 */
const DEFAULT_TILE_MAPPING: Record<number, number> = {
  [TileType.WALL]: 1,
  [TileType.FLOOR]: 2,
  [TileType.DOOR]: 3,
  [TileType.SECRET_DOOR]: 4,
  [TileType.CORRIDOR]: 5,
  [TileType.STAIRS_UP]: 6,
  [TileType.STAIRS_DOWN]: 7,
  [TileType.PIT]: 8,
  [TileType.TREASURE]: 9,
  [TileType.CHEST]: 10,
  [TileType.TRAP]: 11,
  [TileType.TRAP_PIT]: 12,
  [TileType.WATER]: 13,
  [TileType.DEEP_WATER]: 14,
  [TileType.LAVA]: 15,
  [TileType.CRATE]: 16,
  [TileType.BARREL]: 17,
  [TileType.BED]: 18,
  [TileType.TABLE]: 19,
  [TileType.CHAIR]: 20,
  [TileType.BOOKSHELF]: 21,
  [TileType.CARPET]: 22,
  [TileType.FIREPLACE]: 23,
  [TileType.STATUE]: 24,
  [TileType.ALTAR]: 25,
  [TileType.RUBBLE]: 26,
  [TileType.COLLAPSED]: 27,
  [TileType.FALLEN_COLUMN]: 28,
};

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Export a grid to TMX format (Tiled Map Editor)
 *
 * The TMX format is widely supported by game engines and map editors.
 * This exports a basic TMX file with a single tile layer.
 *
 * @param grid - The grid to export
 * @param options - Export options
 * @returns TMX XML string
 *
 * @example
 * ```ts
 * const tmx = exportToTMX(grid, {
 *   name: "level1",
 *   tileWidth: 32,
 *   tileHeight: 32,
 *   tilesetSource: "dungeon_tiles.png"
 * });
 * ```
 */
export function exportToTMX(grid: Grid, options: TMXExportOptions = {}): string {
  const {
    tileWidth = 32,
    tileHeight = 32,
    tilesetName = "dungeon_tiles",
    tilesetSource = "tileset.png",
    tilesetImageWidth = 256,
    tilesetImageHeight = 256,
    firstGid = 1,
    tileMapping = DEFAULT_TILE_MAPPING,
    layerName = "Tiles",
    includeObjectLayer = true,
  } = options;

  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Convert grid to tile IDs (comma-separated for CSV encoding)
  const tileData: number[] = [];
  const objects: { type: string; x: number; y: number; tileType: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileType = grid[y][x];
      const tileId = (tileMapping[tileType] ?? 1) + firstGid - 1;
      tileData.push(tileId);

      // Collect special objects for object layer
      if (includeObjectLayer) {
        if (
          tileType === TileType.STAIRS_UP ||
          tileType === TileType.STAIRS_DOWN ||
          tileType === TileType.TREASURE ||
          tileType === TileType.CHEST ||
          tileType === TileType.TRAP ||
          tileType === TileType.TRAP_PIT
        ) {
          objects.push({
            type: TileType[tileType],
            x: x * tileWidth,
            y: y * tileHeight,
            tileType,
          });
        }
      }
    }
  }

  // Format tile data as CSV (rows separated by newlines)
  const csvRows: string[] = [];
  for (let y = 0; y < height; y++) {
    const row = tileData.slice(y * width, (y + 1) * width);
    csvRows.push(row.join(","));
  }
  const csvData = csvRows.join(",\n");

  // Build TMX XML
  let tmx = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="${width}" height="${height}" tilewidth="${tileWidth}" tileheight="${tileHeight}" infinite="0" nextlayerid="${includeObjectLayer ? 3 : 2}" nextobjectid="${objects.length + 1}">
 <tileset firstgid="${firstGid}" name="${escapeXml(tilesetName)}" tilewidth="${tileWidth}" tileheight="${tileHeight}" tilecount="${Math.floor((tilesetImageWidth / tileWidth) * (tilesetImageHeight / tileHeight))}" columns="${Math.floor(tilesetImageWidth / tileWidth)}">
  <image source="${escapeXml(tilesetSource)}" width="${tilesetImageWidth}" height="${tilesetImageHeight}"/>
 </tileset>
 <layer id="1" name="${escapeXml(layerName)}" width="${width}" height="${height}">
  <data encoding="csv">
${csvData}
  </data>
 </layer>`;

  // Add object layer for special tiles
  if (includeObjectLayer && objects.length > 0) {
    tmx += `
 <objectgroup id="2" name="Objects">`;
    objects.forEach((obj, i) => {
      tmx += `
  <object id="${i + 1}" name="${obj.type}" type="${obj.type}" x="${obj.x}" y="${obj.y}" width="${tileWidth}" height="${tileHeight}"/>`;
    });
    tmx += `
 </objectgroup>`;
  }

  tmx += `
</map>`;

  return tmx;
}

/**
 * Export grid as a simple CSV (just tile values)
 *
 * @param grid - The grid to export
 * @returns CSV string with tile values
 */
export function exportToCSV(grid: Grid): string {
  return grid.map((row) => row.join(",")).join("\n");
}

/**
 * Import grid from CSV format
 *
 * @param csv - CSV string to import
 * @returns Parsed grid
 */
export function importFromCSV(csv: string): Grid {
  return csv
    .trim()
    .split("\n")
    .map((row) => row.split(",").map((cell) => parseInt(cell.trim(), 10)));
}
