import type { Unit, CombatEvent } from "./types";
import { distance } from "./pathfinding";

/**
 * Check if attacker is within range of defender
 */
export function isInRange(attacker: Unit, defender: Unit): boolean {
  return distance(attacker.position, defender.position) <= attacker.range;
}

/**
 * Calculate damage from an attack
 * Damage = attacker.attack - defender.defense/2 + random variance
 */
export function calculateDamage(attacker: Unit, defender: Unit): number {
  const baseDamage = attacker.attack - Math.floor(defender.defense / 2);
  // Add some variance (-20% to +20%)
  const variance = baseDamage * (Math.random() * 0.4 - 0.2);
  const damage = Math.max(1, Math.round(baseDamage + variance));
  return damage;
}

/**
 * Execute an attack from one unit to another
 * Returns the combat event with results
 */
export function executeAttack(attacker: Unit, defender: Unit): CombatEvent {
  const damage = calculateDamage(attacker, defender);

  // Apply damage
  defender.hp = Math.max(0, defender.hp - damage);

  // Check if defender died
  const died = defender.hp <= 0;
  if (died) {
    defender.isDead = true;
  }

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    damage,
    defenderHp: defender.hp,
    defenderDied: died,
  };
}

/**
 * Check if one unit can attack another (in range and alive)
 */
export function canAttack(attacker: Unit, defender: Unit): boolean {
  if (attacker.isDead || defender.isDead) {
    return false;
  }
  if (attacker.faction === defender.faction) {
    return false;
  }
  return isInRange(attacker, defender);
}

/**
 * Get potential targets for a unit
 */
export function getPotentialTargets(
  attacker: Unit,
  allUnits: Map<string, Unit>
): Unit[] {
  return Array.from(allUnits.values()).filter(
    (unit) => unit.faction !== attacker.faction && !unit.isDead
  );
}

/**
 * Find the best target for a unit to attack
 * Prioritizes: in range > lowest HP > closest
 */
export function findBestTarget(
  attacker: Unit,
  allUnits: Map<string, Unit>
): Unit | null {
  const enemies = getPotentialTargets(attacker, allUnits);

  if (enemies.length === 0) {
    return null;
  }

  // First, check for in-range targets
  const inRange = enemies.filter((e) => isInRange(attacker, e));

  if (inRange.length > 0) {
    // Attack lowest HP enemy in range
    inRange.sort((a, b) => a.hp - b.hp);
    return inRange[0];
  }

  // No in-range targets, find closest
  enemies.sort(
    (a, b) =>
      distance(attacker.position, a.position) -
      distance(attacker.position, b.position)
  );

  return enemies[0];
}
