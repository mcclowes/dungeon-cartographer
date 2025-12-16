import type { Unit } from "../simulation/types";
import { Faction, UnitType } from "../simulation/types";

export interface UnitRenderOptions {
  /** Size of units relative to tile size (0-1, default: 0.7) */
  unitScale?: number;
  /** Show HP bars (default: true) */
  showHpBars?: boolean;
  /** Show unit type indicators (default: true) */
  showTypeIndicators?: boolean;
  /** Opacity for dead units (default: 0.3) */
  deadOpacity?: number;
}

/** Color palette for factions */
const FACTION_COLORS: Record<Faction, { primary: string; secondary: string }> = {
  [Faction.RED]: { primary: "#dc3545", secondary: "#ff6b6b" },
  [Faction.BLUE]: { primary: "#0d6efd", secondary: "#6bb3ff" },
};

/** Unit type indicators */
const TYPE_INDICATORS: Record<UnitType, string> = {
  [UnitType.WARRIOR]: "W",
  [UnitType.ARCHER]: "A",
  [UnitType.MAGE]: "M",
};

/**
 * Draw a single unit on the canvas
 */
function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  tileWidth: number,
  tileHeight: number,
  options: UnitRenderOptions
): void {
  const {
    unitScale = 0.7,
    showHpBars = true,
    showTypeIndicators = true,
    deadOpacity = 0.3,
  } = options;

  const x = unit.position.x * tileWidth;
  const y = unit.position.y * tileHeight;
  const centerX = x + tileWidth / 2;
  const centerY = y + tileHeight / 2;

  const unitSize = Math.min(tileWidth, tileHeight) * unitScale;
  const radius = unitSize / 2;

  // Save context for opacity
  ctx.save();

  if (unit.isDead) {
    ctx.globalAlpha = deadOpacity;
  }

  const colors = FACTION_COLORS[unit.faction];

  // Draw unit body (circle)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();

  // Draw border
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw highlight (top half)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, Math.PI, Math.PI * 2);
  ctx.fillStyle = colors.secondary;
  ctx.globalAlpha = unit.isDead ? deadOpacity * 0.5 : 0.5;
  ctx.fill();

  ctx.globalAlpha = unit.isDead ? deadOpacity : 1;

  // Draw type indicator
  if (showTypeIndicators) {
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${radius}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(TYPE_INDICATORS[unit.type], centerX, centerY);
  }

  // Draw HP bar
  if (showHpBars && !unit.isDead) {
    const barWidth = unitSize;
    const barHeight = 4;
    const barX = centerX - barWidth / 2;
    const barY = y + tileHeight - barHeight - 2;

    // Background
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP fill
    const hpPercent = unit.hp / unit.maxHp;
    const hpColor = hpPercent > 0.5 ? "#28a745" : hpPercent > 0.25 ? "#ffc107" : "#dc3545";
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Draw X for dead units
  if (unit.isDead) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.5);
    ctx.lineTo(centerX + radius * 0.5, centerY + radius * 0.5);
    ctx.moveTo(centerX + radius * 0.5, centerY - radius * 0.5);
    ctx.lineTo(centerX - radius * 0.5, centerY + radius * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw all units on the canvas
 */
export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: Map<string, Unit> | Unit[],
  canvasWidth: number,
  canvasHeight: number,
  gridWidth: number,
  gridHeight: number,
  options: UnitRenderOptions = {}
): void {
  const tileWidth = canvasWidth / gridWidth;
  const tileHeight = canvasHeight / gridHeight;

  const unitArray = units instanceof Map ? Array.from(units.values()) : units;

  // Draw dead units first (so living units appear on top)
  const dead = unitArray.filter((u) => u.isDead);
  const alive = unitArray.filter((u) => !u.isDead);

  for (const unit of dead) {
    drawUnit(ctx, unit, tileWidth, tileHeight, options);
  }

  for (const unit of alive) {
    drawUnit(ctx, unit, tileWidth, tileHeight, options);
  }
}

/**
 * Draw a combat indicator (flash effect)
 */
export function drawCombatEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  progress: number // 0-1
): void {
  const centerX = x * tileWidth + tileWidth / 2;
  const centerY = y * tileHeight + tileHeight / 2;

  const maxRadius = Math.min(tileWidth, tileHeight) * 0.8;
  const radius = maxRadius * (1 - progress);
  const opacity = 1 - progress;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ff0";
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a death effect (skull or X)
 */
export function drawDeathEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  progress: number // 0-1
): void {
  const centerX = x * tileWidth + tileWidth / 2;
  const centerY = y * tileHeight + tileHeight / 2;

  const size = Math.min(tileWidth, tileHeight) * 0.5;
  const scale = 1 + progress * 0.5;
  const opacity = 1 - progress;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // Draw X
  ctx.strokeStyle = "#f00";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-size / 2, -size / 2);
  ctx.lineTo(size / 2, size / 2);
  ctx.moveTo(size / 2, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.stroke();

  ctx.restore();
}
