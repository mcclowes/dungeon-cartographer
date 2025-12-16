import type { Grid, Point, Direction } from "../types";
import { TileType, CARDINAL_DIRECTIONS } from "../types";
import {
  createGrid,
  randomInt,
  placeFeatures,
  validateGridSize,
  shuffle,
  withSeededRandom,
  type FeaturePlacementOptions,
} from "../utils";

export interface AgentOptions {
  /** Random seed for reproducible generation */
  seed?: number;
  /** Number of digger agents (default: based on size) */
  numAgents?: number;
  /** Steps each agent takes (default: based on size) */
  stepsPerAgent?: number;
  /** Chance to create a room when stopping (default: 0.3) */
  roomChance?: number;
  /** Minimum room size (default: 3) */
  minRoomSize?: number;
  /** Maximum room size (default: 7) */
  maxRoomSize?: number;
  /** Chance to change direction (default: 0.3) */
  turnChance?: number;
  /** Whether to add doors at room entrances (default: true) */
  addDoors?: boolean;
  /** Whether to add dungeon features (default: false) */
  addFeatures?: boolean;
  /** Options for feature placement */
  featureOptions?: FeaturePlacementOptions;
}

interface Agent {
  position: Point;
  direction: Direction;
  stepsTaken: number;
}

function isInBounds(p: Point, size: number, padding: number = 2): boolean {
  return p.x >= padding && p.x < size - padding && p.y >= padding && p.y < size - padding;
}

function carveRoom(grid: Grid, center: Point, width: number, height: number, size: number): void {
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  for (let dy = -halfH; dy <= halfH; dy++) {
    for (let dx = -halfW; dx <= halfW; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (isInBounds({ x, y }, size, 1)) {
        grid[y][x] = TileType.FLOOR;
      }
    }
  }
}

function moveAgent(agent: Agent, size: number, turnChance: number): boolean {
  // Possibly change direction
  if (Math.random() < turnChance) {
    const dirs = shuffle([...CARDINAL_DIRECTIONS]);
    agent.direction = dirs[0];
  }

  // Calculate new position
  const newPos: Point = {
    x: agent.position.x + agent.direction.dx,
    y: agent.position.y + agent.direction.dy,
  };

  if (isInBounds(newPos, size)) {
    agent.position = newPos;
    agent.stepsTaken++;
    return true;
  }

  // Hit wall, turn randomly
  const dirs = shuffle([...CARDINAL_DIRECTIONS]);
  agent.direction = dirs[0];
  return false;
}

function findDoorCandidates(grid: Grid): Point[] {
  const candidates: Point[] = [];
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] !== TileType.FLOOR) continue;

      // Check for doorway pattern (floor between walls)
      const isVerticalDoorway =
        grid[y - 1][x] === TileType.FLOOR &&
        grid[y + 1][x] === TileType.FLOOR &&
        grid[y][x - 1] === TileType.WALL &&
        grid[y][x + 1] === TileType.WALL;

      const isHorizontalDoorway =
        grid[y][x - 1] === TileType.FLOOR &&
        grid[y][x + 1] === TileType.FLOOR &&
        grid[y - 1][x] === TileType.WALL &&
        grid[y + 1][x] === TileType.WALL;

      if (isVerticalDoorway || isHorizontalDoorway) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}

function addDoors(grid: Grid): void {
  const candidates = findDoorCandidates(grid);
  const shuffled = shuffle(candidates);

  // Add doors to some candidates
  const numDoors = Math.min(shuffled.length, Math.floor(shuffled.length * 0.3));
  for (let i = 0; i < numDoors; i++) {
    const { x, y } = shuffled[i];
    grid[y][x] = TileType.DOOR;
  }
}

/**
 * Agent-based dungeon generator
 *
 * Simulates multiple "digger" agents that carve out corridors and rooms.
 * Agents move through the grid, carving floor tiles and occasionally
 * creating rooms. Results in organic, cave-like dungeons with clear paths.
 *
 * @param size - Grid size (width and height). Must be between 4 and 500.
 * @param options - Generation options
 * @returns Generated agent-based dungeon grid
 * @throws {Error} If size is invalid
 *
 * @example
 * ```ts
 * const grid = generateAgent(50, { numAgents: 5, roomChance: 0.4 });
 * ```
 */
export function generateAgent(size: number, options: AgentOptions = {}): Grid {
  validateGridSize(size, "generateAgent");

  const {
    seed,
    numAgents = Math.max(2, Math.floor(size / 15)),
    stepsPerAgent = size * 4,
    roomChance = 0.3,
    minRoomSize = 3,
    maxRoomSize = 7,
    turnChance = 0.3,
    addDoors: addDoorsEnabled = true,
    addFeatures: addFeaturesEnabled = false,
    featureOptions = {},
  } = options;

  return withSeededRandom(seed, () => {
    const grid = createGrid(size, size, TileType.WALL);

    // Create agents at random starting positions
    const agents: Agent[] = [];
    for (let i = 0; i < numAgents; i++) {
      const startPos: Point = {
        x: randomInt(size - 4, 2),
        y: randomInt(size - 4, 2),
      };
      const startDir = CARDINAL_DIRECTIONS[randomInt(3, 0)];
      agents.push({
        position: startPos,
        direction: startDir,
        stepsTaken: 0,
      });

      // Carve starting room
      const roomW = randomInt(maxRoomSize, minRoomSize);
      const roomH = randomInt(maxRoomSize, minRoomSize);
      carveRoom(grid, startPos, roomW, roomH, size);
    }

    // Run agents
    let totalSteps = 0;
    const maxSteps = numAgents * stepsPerAgent;

    while (totalSteps < maxSteps) {
      for (const agent of agents) {
        if (agent.stepsTaken >= stepsPerAgent) continue;

        // Move agent
        if (moveAgent(agent, size, turnChance)) {
          // Carve corridor
          grid[agent.position.y][agent.position.x] = TileType.FLOOR;

          // Possibly create a room
          if (Math.random() < roomChance) {
            const roomW = randomInt(maxRoomSize, minRoomSize);
            const roomH = randomInt(maxRoomSize, minRoomSize);
            carveRoom(grid, agent.position, roomW, roomH, size);
          }
        }

        totalSteps++;
      }

      // Check if all agents are done
      if (agents.every((a) => a.stepsTaken >= stepsPerAgent)) break;
    }

    if (addDoorsEnabled) {
      addDoors(grid);
    }

    if (addFeaturesEnabled) {
      return placeFeatures(grid, featureOptions);
    }

    return grid;
  });
}
