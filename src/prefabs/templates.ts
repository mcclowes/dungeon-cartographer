import { TileType } from "../types";
import type { Prefab } from "./types";

const W = TileType.WALL;
const F = TileType.FLOOR;
const D = TileType.DOOR;
const T = TileType.TREASURE;
const C = TileType.CHEST;
const A = TileType.ALTAR;
const S = TileType.STATUE;
const P = TileType.TRAP;
const X = TileType.STAIRS_DOWN;

/**
 * Entrance hall with statues
 */
export const entranceHall: Prefab = {
  id: "entrance-hall",
  name: "Entrance Hall",
  category: "entrance",
  width: 9,
  height: 7,
  grid: [
    [W, W, W, W, D, W, W, W, W],
    [W, F, F, S, F, S, F, F, W],
    [W, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, W],
    [W, F, F, S, F, S, F, F, W],
    [W, W, W, W, D, W, W, W, W],
  ],
  connections: [
    { position: { x: 4, y: 0 }, direction: "north", required: true },
    { position: { x: 4, y: 6 }, direction: "south", required: false },
  ],
  tags: ["symmetrical", "grand"],
  weight: 1.5,
};

/**
 * Simple treasure room
 */
export const treasureRoom: Prefab = {
  id: "treasure-room",
  name: "Treasure Room",
  category: "treasure",
  width: 7,
  height: 7,
  grid: [
    [W, W, W, D, W, W, W],
    [W, F, F, F, F, F, W],
    [W, F, C, F, C, F, W],
    [W, F, F, T, F, F, W],
    [W, F, C, F, C, F, W],
    [W, F, F, F, F, F, W],
    [W, W, W, W, W, W, W],
  ],
  connections: [{ position: { x: 3, y: 0 }, direction: "north", required: true }],
  tags: ["loot", "reward"],
  minLevel: 2,
  weight: 0.8,
};

/**
 * Boss arena with altar
 */
export const bossArena: Prefab = {
  id: "boss-arena",
  name: "Boss Arena",
  category: "boss",
  width: 11,
  height: 11,
  grid: [
    [W, W, W, W, W, D, W, W, W, W, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, S, F, F, F, S, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, A, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, S, F, F, F, S, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, F, F, F, F, F, F, F, F, F, W],
    [W, W, W, W, W, W, W, W, W, W, W],
  ],
  connections: [{ position: { x: 5, y: 0 }, direction: "north", required: true }],
  tags: ["combat", "final"],
  minLevel: 5,
  weight: 0.5,
};

/**
 * Trap corridor with pit traps
 */
export const trapCorridor: Prefab = {
  id: "trap-corridor",
  name: "Trap Corridor",
  category: "trap",
  width: 11,
  height: 5,
  grid: [
    [W, W, W, W, W, W, W, W, W, W, W],
    [W, F, F, P, F, F, F, P, F, F, W],
    [D, F, F, F, F, P, F, F, F, F, D],
    [W, F, F, P, F, F, F, P, F, F, W],
    [W, W, W, W, W, W, W, W, W, W, W],
  ],
  connections: [
    { position: { x: 0, y: 2 }, direction: "west", required: true },
    { position: { x: 10, y: 2 }, direction: "east", required: true },
  ],
  tags: ["dangerous", "linear"],
  weight: 1.0,
};

/**
 * Small shrine room
 */
export const shrineRoom: Prefab = {
  id: "shrine-room",
  name: "Shrine Room",
  category: "shrine",
  width: 7,
  height: 7,
  grid: [
    [W, W, W, D, W, W, W],
    [W, F, F, F, F, F, W],
    [W, F, F, F, F, F, W],
    [W, F, F, A, F, F, W],
    [W, F, F, F, F, F, W],
    [W, F, F, F, F, F, W],
    [W, W, W, W, W, W, W],
  ],
  connections: [{ position: { x: 3, y: 0 }, direction: "north", required: true }],
  tags: ["peaceful", "rest"],
  weight: 1.0,
};

/**
 * Exit room with stairs
 */
export const exitRoom: Prefab = {
  id: "exit-room",
  name: "Exit Room",
  category: "exit",
  width: 7,
  height: 7,
  grid: [
    [W, W, W, D, W, W, W],
    [W, F, F, F, F, F, W],
    [W, F, F, F, F, F, W],
    [W, F, F, X, F, F, W],
    [W, F, F, F, F, F, W],
    [W, F, F, F, F, F, W],
    [W, W, W, W, W, W, W],
  ],
  connections: [{ position: { x: 3, y: 0 }, direction: "north", required: true }],
  tags: ["progression"],
  weight: 1.0,
};

/**
 * Library room with bookshelves
 */
const B = TileType.BOOKSHELF;
export const libraryRoom: Prefab = {
  id: "library-room",
  name: "Library Room",
  category: "library",
  width: 9,
  height: 9,
  grid: [
    [W, W, W, W, D, W, W, W, W],
    [W, B, F, B, F, B, F, B, W],
    [W, F, F, F, F, F, F, F, W],
    [W, B, F, F, F, F, F, B, W],
    [W, F, F, F, F, F, F, F, W],
    [W, B, F, F, F, F, F, B, W],
    [W, F, F, F, F, F, F, F, W],
    [W, B, F, B, F, B, F, B, W],
    [W, W, W, W, W, W, W, W, W],
  ],
  connections: [{ position: { x: 4, y: 0 }, direction: "north", required: true }],
  tags: ["knowledge", "lore"],
  weight: 0.9,
};

/**
 * Prison with cells
 */
export const prisonBlock: Prefab = {
  id: "prison-block",
  name: "Prison Block",
  category: "prison",
  width: 11,
  height: 7,
  grid: [
    [W, W, D, W, W, W, W, W, D, W, W],
    [W, F, F, F, W, F, W, F, F, F, W],
    [W, F, F, F, D, F, D, F, F, F, W],
    [D, F, F, F, F, F, F, F, F, F, D],
    [W, F, F, F, D, F, D, F, F, F, W],
    [W, F, F, F, W, F, W, F, F, F, W],
    [W, W, D, W, W, W, W, W, D, W, W],
  ],
  connections: [
    { position: { x: 0, y: 3 }, direction: "west", required: true },
    { position: { x: 10, y: 3 }, direction: "east", required: false },
    { position: { x: 2, y: 0 }, direction: "north", required: false },
    { position: { x: 8, y: 0 }, direction: "north", required: false },
    { position: { x: 2, y: 6 }, direction: "south", required: false },
    { position: { x: 8, y: 6 }, direction: "south", required: false },
  ],
  tags: ["cells", "captives"],
  weight: 0.7,
};

/**
 * Collection of all built-in prefabs
 */
export const builtInPrefabs: Prefab[] = [
  entranceHall,
  treasureRoom,
  bossArena,
  trapCorridor,
  shrineRoom,
  exitRoom,
  libraryRoom,
  prisonBlock,
];

/**
 * Get prefabs by category
 */
export function getPrefabsByCategory(
  category: Prefab["category"],
  prefabs: Prefab[] = builtInPrefabs
): Prefab[] {
  return prefabs.filter((p) => p.category === category);
}

/**
 * Get prefabs by tag
 */
export function getPrefabsByTag(tag: string, prefabs: Prefab[] = builtInPrefabs): Prefab[] {
  return prefabs.filter((p) => p.tags?.includes(tag));
}

/**
 * Get prefabs valid for a dungeon level
 */
export function getPrefabsForLevel(level: number, prefabs: Prefab[] = builtInPrefabs): Prefab[] {
  return prefabs.filter((p) => {
    const minOk = p.minLevel === undefined || level >= p.minLevel;
    const maxOk = p.maxLevel === undefined || level <= p.maxLevel;
    return minOk && maxOk;
  });
}
