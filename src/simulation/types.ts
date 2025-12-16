import type { Point } from "../types";

/** Faction identifier for units */
export enum Faction {
  RED = "red",
  BLUE = "blue",
}

/** Unit type determines stats and behavior */
export enum UnitType {
  WARRIOR = "warrior",
  ARCHER = "archer",
  MAGE = "mage",
}

/** Base stats for a unit type */
export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number; // Attack range (1 = melee)
}

/** Default stats for each unit type */
export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.WARRIOR]: {
    maxHp: 100,
    attack: 15,
    defense: 10,
    speed: 1,
    range: 1,
  },
  [UnitType.ARCHER]: {
    maxHp: 60,
    attack: 20,
    defense: 5,
    speed: 1,
    range: 4,
  },
  [UnitType.MAGE]: {
    maxHp: 50,
    attack: 25,
    defense: 3,
    speed: 1,
    range: 3,
  },
};

/** A unit in the simulation */
export interface Unit {
  id: string;
  type: UnitType;
  faction: Faction;
  position: Point;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  isDead: boolean;
  target?: string; // ID of current target
  path?: Point[]; // Current movement path
}

/** Combat event when one unit attacks another */
export interface CombatEvent {
  attackerId: string;
  defenderId: string;
  damage: number;
  defenderHp: number;
  defenderDied: boolean;
}

/** Movement event when a unit moves */
export interface MoveEvent {
  unitId: string;
  from: Point;
  to: Point;
}

/** Simulation event union type */
export type SimulationEvent =
  | { type: "move"; data: MoveEvent }
  | { type: "combat"; data: CombatEvent }
  | { type: "death"; data: { unitId: string; position: Point } }
  | { type: "victory"; data: { winner: Faction } };

/** Simulation state */
export interface SimulationState {
  units: Map<string, Unit>;
  turn: number;
  events: SimulationEvent[];
  isComplete: boolean;
  winner?: Faction;
}

/** Options for spawning units */
export interface SpawnOptions {
  /** Number of units per faction */
  unitsPerFaction?: number;
  /** Unit types to spawn (random selection if multiple) */
  unitTypes?: UnitType[];
  /** Minimum distance between spawn points */
  minSpawnDistance?: number;
  /** Spawn factions on opposite sides of the map */
  opposingSides?: boolean;
}

/** Options for running the simulation */
export interface SimulationOptions {
  /** Maximum turns before draw */
  maxTurns?: number;
  /** Randomize turn order each turn */
  randomizeTurnOrder?: boolean;
}
