import type { Grid, Point, Rect, Room } from "../types";
import { TileType, RoomSize, RoomType } from "../types";

/**
 * Classify room size based on tile count
 */
export function classifyRoomSize(area: number): RoomSize {
  if (area < 9) return RoomSize.TINY;
  if (area < 25) return RoomSize.SMALL;
  if (area < 64) return RoomSize.MEDIUM;
  if (area < 144) return RoomSize.LARGE;
  return RoomSize.HUGE;
}

/**
 * Calculate the bounding rectangle for a set of tiles
 */
export function calculateBounds(tiles: Point[]): Rect {
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
 * Calculate the center point of a room
 */
export function calculateCenter(bounds: Rect): Point {
  return {
    x: bounds.x + Math.floor(bounds.width / 2),
    y: bounds.y + Math.floor(bounds.height / 2),
  };
}

/**
 * Create a Room object from a rectangular area
 */
export function createRoomFromRect(rect: Rect, id: number): Room {
  const tiles: Point[] = [];
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      tiles.push({ x, y });
    }
  }

  const area = rect.width * rect.height;
  return {
    id,
    bounds: rect,
    center: calculateCenter(rect),
    tiles,
    size: classifyRoomSize(area),
    type: RoomType.GENERIC,
    area,
    connected: false,
  };
}

/**
 * Create a Room object from a set of tiles
 */
export function createRoomFromTiles(tiles: Point[], id: number): Room {
  const bounds = calculateBounds(tiles);
  const area = tiles.length;

  return {
    id,
    bounds,
    center: calculateCenter(bounds),
    tiles: [...tiles],
    size: classifyRoomSize(area),
    type: RoomType.GENERIC,
    area,
    connected: false,
  };
}

/**
 * Check if a tile is a floor-like tile (not wall or corridor)
 */
function isRoomFloor(tile: number): boolean {
  return (
    tile === TileType.FLOOR ||
    tile === TileType.STAIRS_UP ||
    tile === TileType.STAIRS_DOWN ||
    tile === TileType.TREASURE ||
    tile === TileType.CHEST ||
    tile === TileType.TRAP ||
    tile === TileType.TRAP_PIT ||
    tile === TileType.WATER ||
    tile === TileType.DEEP_WATER ||
    tile === TileType.LAVA ||
    tile === TileType.PIT
  );
}

/**
 * Flood fill to find all connected floor tiles starting from a point
 */
function floodFillRoom(
  grid: Grid,
  startX: number,
  startY: number,
  visited: Set<string>
): Point[] {
  const tiles: Point[] = [];
  const stack: Point[] = [{ x: startX, y: startY }];
  const height = grid.length;
  const width = grid[0].length;

  while (stack.length > 0) {
    const point = stack.pop()!;
    const key = `${point.x},${point.y}`;

    if (visited.has(key)) continue;
    if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) continue;
    if (!isRoomFloor(grid[point.y][point.x])) continue;

    visited.add(key);
    tiles.push(point);

    // Check cardinal neighbors only (rooms are separated by walls)
    stack.push({ x: point.x - 1, y: point.y });
    stack.push({ x: point.x + 1, y: point.y });
    stack.push({ x: point.x, y: point.y - 1 });
    stack.push({ x: point.x, y: point.y + 1 });
  }

  return tiles;
}

/**
 * Detect rooms in a grid by flood-filling connected floor areas
 * This is useful for grids that weren't generated with room metadata
 */
export function detectRooms(grid: Grid): Room[] {
  const rooms: Room[] = [];
  const visited = new Set<string>();
  let roomId = 0;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (!isRoomFloor(grid[y][x])) continue;

      const tiles = floodFillRoom(grid, x, y, visited);

      // Only consider areas with multiple tiles as rooms
      // Single tiles or very small areas might be corridor fragments
      if (tiles.length >= 4) {
        rooms.push(createRoomFromTiles(tiles, roomId++));
      }
    }
  }

  return rooms;
}

/**
 * Assign room types based on size and position heuristics
 */
export function assignRoomTypes(rooms: Room[]): void {
  if (rooms.length === 0) return;

  // Sort rooms by area (largest first)
  const sortedByArea = [...rooms].sort((a, b) => b.area - a.area);

  // Largest room is likely a throne room or great hall
  if (sortedByArea[0].size === RoomSize.HUGE || sortedByArea[0].size === RoomSize.LARGE) {
    sortedByArea[0].type = RoomType.THRONE;
  }

  // Sort by distance from center of map
  const avgX = rooms.reduce((sum, r) => sum + r.center.x, 0) / rooms.length;
  const avgY = rooms.reduce((sum, r) => sum + r.center.y, 0) / rooms.length;

  const sortedByDistanceFromCenter = [...rooms].sort((a, b) => {
    const distA = Math.abs(a.center.x - avgX) + Math.abs(a.center.y - avgY);
    const distB = Math.abs(b.center.x - avgX) + Math.abs(b.center.y - avgY);
    return distB - distA; // Furthest first
  });

  // Room furthest from center could be entrance
  const entrance = sortedByDistanceFromCenter[0];
  if (entrance.type === RoomType.GENERIC) {
    entrance.type = RoomType.ENTRANCE;
  }

  // Assign some small rooms as guard posts
  let guardCount = 0;
  for (const room of rooms) {
    if (room.type !== RoomType.GENERIC) continue;
    if (room.size === RoomSize.TINY || room.size === RoomSize.SMALL) {
      if (guardCount < Math.ceil(rooms.length / 4)) {
        room.type = RoomType.GUARD;
        guardCount++;
      }
    }
  }

  // Assign one room as treasure room (preferably medium size, away from entrance)
  const treasureCandidates = rooms.filter(
    r => r.type === RoomType.GENERIC &&
    (r.size === RoomSize.SMALL || r.size === RoomSize.MEDIUM)
  );
  if (treasureCandidates.length > 0) {
    // Pick the one furthest from entrance
    const entranceRoom = rooms.find(r => r.type === RoomType.ENTRANCE);
    if (entranceRoom) {
      treasureCandidates.sort((a, b) => {
        const distA = Math.abs(a.center.x - entranceRoom.center.x) +
                      Math.abs(a.center.y - entranceRoom.center.y);
        const distB = Math.abs(b.center.x - entranceRoom.center.x) +
                      Math.abs(b.center.y - entranceRoom.center.y);
        return distB - distA;
      });
      treasureCandidates[0].type = RoomType.TREASURE;
    }
  }
}

/**
 * Get the room containing a specific point
 */
export function getRoomAtPoint(rooms: Room[], point: Point): Room | null {
  for (const room of rooms) {
    for (const tile of room.tiles) {
      if (tile.x === point.x && tile.y === point.y) {
        return room;
      }
    }
  }
  return null;
}

/**
 * Get rooms by type
 */
export function getRoomsByType(rooms: Room[], type: RoomType): Room[] {
  return rooms.filter(r => r.type === type);
}

/**
 * Get rooms by size
 */
export function getRoomsBySize(rooms: Room[], size: RoomSize): Room[] {
  return rooms.filter(r => r.size === size);
}
