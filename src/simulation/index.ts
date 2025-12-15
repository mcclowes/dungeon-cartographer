// Types
export * from "./types";

// Pathfinding
export { findPath, isWalkable, distance, getWalkableNeighbors } from "./pathfinding";

// Spawning
export { createUnit, spawnUnits, getUnitsByFaction, getLivingUnits } from "./spawning";

// Combat
export {
  isInRange,
  calculateDamage,
  executeAttack,
  canAttack,
  findBestTarget,
  getPotentialTargets,
} from "./combat";

// Simulation
export {
  createSimulation,
  simulateTurn,
  runSimulation,
  simulate,
  getUnitPositions,
} from "./simulation";
