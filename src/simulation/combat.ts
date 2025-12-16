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
 * Get allies of a unit (same faction, alive)
 */
export function getAllies(unit: Unit, allUnits: Map<string, Unit>): Unit[] {
  return Array.from(allUnits.values()).filter(
    (u) => u.faction === unit.faction && !u.isDead && u.id !== unit.id
  );
}

/**
 * Calculate how many allies are near/targeting an enemy
 * This encourages focus fire and swarming
 */
function getAllyPressure(enemy: Unit, allies: Unit[]): number {
  let pressure = 0;
  for (const ally of allies) {
    const dist = distance(ally.position, enemy.position);
    // Allies within 3 tiles add pressure (closer = more pressure)
    if (dist <= 3) {
      pressure += (4 - dist) * 2;
    }
    // Allies targeting this enemy (adjacent for melee, in range for ranged)
    if (dist <= ally.range) {
      pressure += 5;
    }
  }
  return pressure;
}

/**
 * Find the best target for a unit to attack
 * Prioritizes: in range > focus fire (damaged + allies nearby) > closest
 * Swarming behavior: prefer targets allies are also attacking
 */
export function findBestTarget(
  attacker: Unit,
  allUnits: Map<string, Unit>
): Unit | null {
  const enemies = getPotentialTargets(attacker, allUnits);

  if (enemies.length === 0) {
    return null;
  }

  const allies = getAllies(attacker, allUnits);

  // First, check for in-range targets
  const inRange = enemies.filter((e) => isInRange(attacker, e));

  if (inRange.length > 0) {
    // Score each target: prefer damaged + allies nearby (focus fire)
    const scored = inRange.map((enemy) => {
      const hpRatio = enemy.hp / enemy.maxHp;
      const allyPressure = getAllyPressure(enemy, allies);
      // Lower score = better target
      // Prefer damaged enemies (lower HP ratio)
      // Prefer enemies with more ally pressure (subtract pressure)
      const score = hpRatio * 100 - allyPressure * 10;
      return { enemy, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored[0].enemy;
  }

  // No in-range targets: pick target that allies are converging on
  const scored = enemies.map((enemy) => {
    const dist = distance(attacker.position, enemy.position);
    const hpRatio = enemy.hp / enemy.maxHp;
    const allyPressure = getAllyPressure(enemy, allies);
    // Score: distance matters most, but prefer targets allies are near
    // Subtract ally pressure to encourage swarming
    const score = dist * 10 + hpRatio * 20 - allyPressure * 5;
    return { enemy, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].enemy;
}
