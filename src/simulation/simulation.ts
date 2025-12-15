import type { Grid, Point } from "../types";
import type {
  Unit,
  SimulationState,
  SimulationEvent,
  SimulationOptions,
  SpawnOptions,
} from "./types";
import { Faction } from "./types";
import { findPath, findClosestPositionInRange } from "./pathfinding";
import { spawnUnits, getUnitsByFaction, getLivingUnits } from "./spawning";
import { findBestTarget, canAttack, executeAttack, getAllies } from "./combat";
import { distance } from "./pathfinding";
import { shuffle } from "../utils/random";

/**
 * Create initial simulation state with spawned units
 */
export function createSimulation(
  grid: Grid,
  spawnOptions?: SpawnOptions
): SimulationState {
  const units = spawnUnits(grid, spawnOptions);

  return {
    units,
    turn: 0,
    events: [],
    isComplete: false,
  };
}

/**
 * Get the set of occupied positions (for pathfinding)
 */
function getOccupiedPositions(units: Map<string, Unit>): Set<string> {
  const occupied = new Set<string>();
  Array.from(units.values()).forEach((unit) => {
    if (!unit.isDead) {
      occupied.add(`${unit.position.x},${unit.position.y}`);
    }
  });
  return occupied;
}

/**
 * Calculate the centroid (average position) of a group of units
 */
function calculateCentroid(units: Unit[]): Point | null {
  if (units.length === 0) return null;

  let sumX = 0;
  let sumY = 0;
  for (const unit of units) {
    sumX += unit.position.x;
    sumY += unit.position.y;
  }

  return {
    x: Math.round(sumX / units.length),
    y: Math.round(sumY / units.length),
  };
}

/**
 * Find destination that balances attacking target with staying near allies
 * Swarming cohesion: prefer to stay grouped but always make progress
 */
function getSwarmDestination(
  unit: Unit,
  target: Point,
  allies: Unit[]
): Point {
  // If no allies, just go to target
  if (allies.length === 0) {
    return target;
  }

  const centroid = calculateCentroid(allies);
  if (!centroid) {
    return target;
  }

  // Calculate distances
  const distToTarget = distance(unit.position, target);
  const distToCentroid = distance(unit.position, centroid);

  // If already at the target or very close, go directly
  if (distToTarget <= 2) {
    return target;
  }

  // If close to allies (within 4 tiles), go straight to target
  if (distToCentroid <= 4) {
    return target;
  }

  // If far from allies but they're between us and target, go to target
  // (we'll naturally group up as we converge)
  const centroidToTarget = distance(centroid, target);
  if (centroidToTarget < distToTarget) {
    return target;
  }

  // Only apply grouping if we're really scattered (>8 tiles from allies)
  // and allies are behind us - move toward a point that's still forward
  // but angled toward the group
  if (distToCentroid > 8) {
    // Blend: 70% toward target, 30% toward centroid
    // This keeps forward momentum while drifting toward group
    const weight = 0.3;
    return {
      x: Math.round(centroid.x * weight + target.x * (1 - weight)),
      y: Math.round(centroid.y * weight + target.y * (1 - weight)),
    };
  }

  // Default: go to target
  return target;
}

/**
 * Move a unit one step toward a target
 */
function moveUnitToward(
  unit: Unit,
  target: Point,
  grid: Grid,
  occupied: Set<string>
): Point | null {
  // Remove self from occupied
  occupied.delete(`${unit.position.x},${unit.position.y}`);

  // Find path to target
  const path = findPath(grid, unit.position, target, occupied);

  if (path.length === 0) {
    // No path found, try to find position in range
    return null;
  }

  // Move one step (or more based on speed)
  const steps = Math.min(unit.speed, path.length);
  const newPos = path[steps - 1];

  // Re-add self to occupied
  occupied.add(`${unit.position.x},${unit.position.y}`);

  return newPos;
}

/**
 * Process a single unit's turn
 */
function processUnitTurn(
  unit: Unit,
  grid: Grid,
  state: SimulationState
): SimulationEvent[] {
  const events: SimulationEvent[] = [];

  if (unit.isDead) {
    return events;
  }

  // Find best target
  const target = findBestTarget(unit, state.units);

  if (!target) {
    // No enemies left
    return events;
  }

  // Check if we can attack
  if (canAttack(unit, target)) {
    const combatEvent = executeAttack(unit, target);
    events.push({ type: "combat", data: combatEvent });

    if (combatEvent.defenderDied) {
      events.push({
        type: "death",
        data: { unitId: target.id, position: { ...target.position } },
      });
    }
  } else {
    // Need to move toward target
    const occupied = getOccupiedPositions(state.units);
    const allies = getAllies(unit, state.units);

    // Determine where we want to go
    let destination: Point;

    if (unit.range > 1) {
      // Ranged unit: find position within range
      const rangePos = findClosestPositionInRange(
        grid,
        unit.position,
        target.position,
        unit.range,
        occupied
      );
      destination = rangePos || target.position;
    } else {
      // Melee: go to target position (will stop adjacent)
      destination = target.position;
    }

    // Apply swarming behavior: stay closer to allies
    destination = getSwarmDestination(unit, destination, allies);

    const newPos = moveUnitToward(unit, destination, grid, occupied);

    if (newPos) {
      const oldPos = { ...unit.position };
      unit.position = newPos;

      events.push({
        type: "move",
        data: {
          unitId: unit.id,
          from: oldPos,
          to: newPos,
        },
      });

      // Check if we can attack after moving
      if (canAttack(unit, target)) {
        const combatEvent = executeAttack(unit, target);
        events.push({ type: "combat", data: combatEvent });

        if (combatEvent.defenderDied) {
          events.push({
            type: "death",
            data: { unitId: target.id, position: { ...target.position } },
          });
        }
      }
    }
  }

  return events;
}

/**
 * Check for victory condition
 */
function checkVictory(state: SimulationState): Faction | null {
  const redUnits = getUnitsByFaction(state.units, Faction.RED);
  const blueUnits = getUnitsByFaction(state.units, Faction.BLUE);

  if (redUnits.length === 0 && blueUnits.length === 0) {
    // Draw - shouldn't happen but handle it
    return null;
  }

  if (redUnits.length === 0) {
    return Faction.BLUE;
  }

  if (blueUnits.length === 0) {
    return Faction.RED;
  }

  return null;
}

/**
 * Run a single turn of the simulation
 * Returns events that occurred during this turn
 */
export function simulateTurn(
  grid: Grid,
  state: SimulationState,
  options: SimulationOptions = {}
): SimulationEvent[] {
  const { randomizeTurnOrder = true } = options;

  if (state.isComplete) {
    return [];
  }

  state.turn++;
  const turnEvents: SimulationEvent[] = [];

  // Get living units
  let units = getLivingUnits(state.units);

  // Randomize turn order if enabled
  if (randomizeTurnOrder) {
    units = shuffle([...units]);
  }

  // Process each unit's turn
  for (const unit of units) {
    if (unit.isDead) continue; // Could have died this turn

    const events = processUnitTurn(unit, grid, state);
    turnEvents.push(...events);

    // Check for victory after each unit action
    const winner = checkVictory(state);
    if (winner) {
      state.isComplete = true;
      state.winner = winner;
      turnEvents.push({ type: "victory", data: { winner } });
      break;
    }
  }

  state.events.push(...turnEvents);
  return turnEvents;
}

/**
 * Run the entire simulation until completion
 */
export function runSimulation(
  grid: Grid,
  state: SimulationState,
  options: SimulationOptions = {}
): SimulationState {
  const { maxTurns = 100 } = options;

  while (!state.isComplete && state.turn < maxTurns) {
    simulateTurn(grid, state, options);
  }

  // If we hit max turns without a winner, it's a draw
  if (!state.isComplete) {
    state.isComplete = true;
  }

  return state;
}

/**
 * Create and run a full simulation from a grid
 */
export function simulate(
  grid: Grid,
  spawnOptions?: SpawnOptions,
  simOptions?: SimulationOptions
): SimulationState {
  const state = createSimulation(grid, spawnOptions);
  return runSimulation(grid, state, simOptions);
}

/**
 * Get a snapshot of current unit positions for rendering
 */
export function getUnitPositions(
  state: SimulationState
): Array<{ unit: Unit; x: number; y: number }> {
  return Array.from(state.units.values())
    .filter((u) => !u.isDead)
    .map((u) => ({
      unit: u,
      x: u.position.x,
      y: u.position.y,
    }));
}
