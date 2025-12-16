import type { Grid, Point, Rect } from "../types";
import { TileType } from "../types";

/**
 * A room detected in the dungeon
 */
export interface Room {
  /** Unique room identifier */
  id: number;
  /** All floor tiles belonging to this room */
  tiles: Point[];
  /** Bounding box of the room */
  bounds: Rect;
  /** Center point of the room */
  center: Point;
  /** Area (number of tiles) */
  area: number;
}

/**
 * Connection between two rooms
 */
export interface RoomConnection {
  /** ID of first room */
  roomA: number;
  /** ID of second room */
  roomB: number;
  /** Door or corridor tiles connecting the rooms */
  connectionTiles: Point[];
}

/**
 * Room connectivity graph
 */
export interface ConnectivityGraph {
  /** All detected rooms */
  rooms: Room[];
  /** Connections between rooms */
  connections: RoomConnection[];
  /** Adjacency list (room ID -> connected room IDs) */
  adjacency: Map<number, number[]>;
}

/**
 * Flood fill to find all connected floor tiles from a starting point
 */
function floodFillRoom(grid: Grid, start: Point, visited: Set<string>): Point[] {
  const tiles: Point[] = [];
  const queue: Point[] = [start];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    if (current.x < 0 || current.x >= width || current.y < 0 || current.y >= height) continue;

    const tile = grid[current.y][current.x];
    // Only include floor tiles in the room (not corridors, doors, etc.)
    if (tile !== TileType.FLOOR) continue;

    visited.add(key);
    tiles.push(current);

    // Add cardinal neighbors
    queue.push({ x: current.x - 1, y: current.y });
    queue.push({ x: current.x + 1, y: current.y });
    queue.push({ x: current.x, y: current.y - 1 });
    queue.push({ x: current.x, y: current.y + 1 });
  }

  return tiles;
}

/**
 * Calculate bounding box for a set of tiles
 */
function calculateBounds(tiles: Point[]): Rect {
  if (tiles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const tile of tiles) {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x);
    maxY = Math.max(maxY, tile.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Calculate center point of a room
 */
function calculateCenter(tiles: Point[]): Point {
  if (tiles.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const tile of tiles) {
    sumX += tile.x;
    sumY += tile.y;
  }

  return {
    x: Math.round(sumX / tiles.length),
    y: Math.round(sumY / tiles.length),
  };
}

/**
 * Find all rooms in the grid (contiguous floor areas)
 */
function findRooms(grid: Grid, minRoomSize: number = 4): Room[] {
  const rooms: Room[] = [];
  const visited = new Set<string>();
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  let roomId = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (grid[y][x] !== TileType.FLOOR) continue;

      const tiles = floodFillRoom(grid, { x, y }, visited);

      if (tiles.length >= minRoomSize) {
        rooms.push({
          id: roomId++,
          tiles,
          bounds: calculateBounds(tiles),
          center: calculateCenter(tiles),
          area: tiles.length,
        });
      }
    }
  }

  return rooms;
}

/**
 * Create a lookup map from tile coordinates to room ID
 */
function createRoomLookup(rooms: Room[]): Map<string, number> {
  const lookup = new Map<string, number>();

  for (const room of rooms) {
    for (const tile of room.tiles) {
      lookup.set(`${tile.x},${tile.y}`, room.id);
    }
  }

  return lookup;
}

/**
 * Find which room a corridor/door tile is connected to (flood fill through corridors)
 */
function findConnectedRooms(
  grid: Grid,
  start: Point,
  roomLookup: Map<string, number>,
  visited: Set<string>
): Set<number> {
  const connectedRooms = new Set<number>();
  const queue: Point[] = [start];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    if (current.x < 0 || current.x >= width || current.y < 0 || current.y >= height) continue;

    const tile = grid[current.y][current.x];

    // Check if this is a room tile
    const roomId = roomLookup.get(key);
    if (roomId !== undefined) {
      connectedRooms.add(roomId);
      continue; // Don't traverse into the room
    }

    // Only traverse corridors and doors
    if (tile !== TileType.CORRIDOR && tile !== TileType.DOOR) continue;

    visited.add(key);

    // Add cardinal neighbors
    queue.push({ x: current.x - 1, y: current.y });
    queue.push({ x: current.x + 1, y: current.y });
    queue.push({ x: current.x, y: current.y - 1 });
    queue.push({ x: current.x, y: current.y + 1 });
  }

  return connectedRooms;
}

/**
 * Find connections between rooms via corridors or doors
 */
function findConnections(grid: Grid, roomLookup: Map<string, number>): RoomConnection[] {
  const connections: RoomConnection[] = [];
  const connectionSet = new Set<string>(); // "roomA-roomB" to avoid duplicates
  const visited = new Set<string>();
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Find corridor segments and which rooms they connect
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      const tile = grid[y][x];
      if (tile !== TileType.CORRIDOR && tile !== TileType.DOOR) continue;

      // Find all rooms this corridor segment connects to
      const corridorVisited = new Set<string>();
      const connectedRooms = findConnectedRooms(grid, { x, y }, roomLookup, corridorVisited);

      // Mark all visited corridor tiles
      for (const corridorKey of corridorVisited) {
        visited.add(corridorKey);
      }

      // Create connections between all pairs of connected rooms
      const roomIds = Array.from(connectedRooms).sort((a, b) => a - b);
      for (let i = 0; i < roomIds.length; i++) {
        for (let j = i + 1; j < roomIds.length; j++) {
          const roomA = roomIds[i];
          const roomB = roomIds[j];
          const connectionKey = `${roomA}-${roomB}`;

          if (!connectionSet.has(connectionKey)) {
            connectionSet.add(connectionKey);
            connections.push({
              roomA,
              roomB,
              connectionTiles: Array.from(corridorVisited).map((k) => {
                const [cx, cy] = k.split(",").map(Number);
                return { x: cx, y: cy };
              }),
            });
          }
        }
      }
    }
  }

  return connections;
}

/**
 * Build adjacency list from connections
 */
function buildAdjacencyList(rooms: Room[], connections: RoomConnection[]): Map<number, number[]> {
  const adjacency = new Map<number, number[]>();

  // Initialize all rooms with empty arrays
  for (const room of rooms) {
    adjacency.set(room.id, []);
  }

  // Add connections
  for (const conn of connections) {
    adjacency.get(conn.roomA)?.push(conn.roomB);
    adjacency.get(conn.roomB)?.push(conn.roomA);
  }

  return adjacency;
}

/**
 * Analyze a dungeon grid and extract room connectivity information
 *
 * @param grid - The dungeon grid to analyze
 * @param minRoomSize - Minimum number of tiles for a region to be considered a room (default: 4)
 * @returns Connectivity graph with rooms, connections, and adjacency list
 *
 * @example
 * ```ts
 * const graph = analyzeConnectivity(grid);
 * console.log(`Found ${graph.rooms.length} rooms`);
 * console.log(`With ${graph.connections.length} connections`);
 *
 * // Get rooms connected to room 0
 * const neighbors = graph.adjacency.get(0);
 * ```
 */
export function analyzeConnectivity(grid: Grid, minRoomSize: number = 4): ConnectivityGraph {
  const rooms = findRooms(grid, minRoomSize);
  const roomLookup = createRoomLookup(rooms);
  const connections = findConnections(grid, roomLookup);
  const adjacency = buildAdjacencyList(rooms, connections);

  return {
    rooms,
    connections,
    adjacency,
  };
}

/**
 * Find the shortest path between two rooms (BFS on room graph)
 *
 * @param graph - The connectivity graph
 * @param startRoom - Starting room ID
 * @param endRoom - Target room ID
 * @returns Array of room IDs representing the path, or null if no path exists
 */
export function findRoomPath(
  graph: ConnectivityGraph,
  startRoom: number,
  endRoom: number
): number[] | null {
  if (startRoom === endRoom) return [startRoom];

  const visited = new Set<number>();
  const queue: { roomId: number; path: number[] }[] = [{ roomId: startRoom, path: [startRoom] }];

  while (queue.length > 0) {
    const { roomId, path } = queue.shift()!;

    if (visited.has(roomId)) continue;
    visited.add(roomId);

    const neighbors = graph.adjacency.get(roomId) ?? [];

    for (const neighbor of neighbors) {
      if (neighbor === endRoom) {
        return [...path, neighbor];
      }

      if (!visited.has(neighbor)) {
        queue.push({ roomId: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null; // No path found
}

/**
 * Get statistics about the connectivity graph
 */
export interface ConnectivityStats {
  /** Total number of rooms */
  numRooms: number;
  /** Total number of connections */
  numConnections: number;
  /** Average connections per room */
  avgConnections: number;
  /** Maximum connections for a single room */
  maxConnections: number;
  /** Number of isolated rooms (no connections) */
  isolatedRooms: number;
  /** Largest room by area */
  largestRoom: Room | null;
  /** Smallest room by area */
  smallestRoom: Room | null;
}

/**
 * Calculate statistics about the connectivity graph
 */
export function getConnectivityStats(graph: ConnectivityGraph): ConnectivityStats {
  const { rooms, connections, adjacency } = graph;

  let maxConnections = 0;
  let isolatedRooms = 0;
  let totalConnections = 0;

  for (const [, neighbors] of adjacency) {
    const count = neighbors.length;
    totalConnections += count;
    maxConnections = Math.max(maxConnections, count);
    if (count === 0) isolatedRooms++;
  }

  const sortedByArea = [...rooms].sort((a, b) => b.area - a.area);

  return {
    numRooms: rooms.length,
    numConnections: connections.length,
    avgConnections: rooms.length > 0 ? totalConnections / rooms.length : 0,
    maxConnections,
    isolatedRooms,
    largestRoom: sortedByArea[0] ?? null,
    smallestRoom: sortedByArea[sortedByArea.length - 1] ?? null,
  };
}
