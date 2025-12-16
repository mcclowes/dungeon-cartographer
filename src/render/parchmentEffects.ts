import { seededRandom } from "./parchmentUtils";

/**
 * Add parchment texture/noise overlay to the entire canvas
 */
export function addParchmentTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.03
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Add random scuffs and stains to the parchment for a weathered look
 */
export function addParchmentScuffs(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scuffCount = 15,
  seed = 12345
): void {
  const rand = seededRandom(seed);

  ctx.save();

  for (let i = 0; i < scuffCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 10 + rand() * 40;
    const opacity = 0.03 + rand() * 0.06;

    // Random scuff shape - irregular blob
    ctx.beginPath();
    ctx.moveTo(x, y);

    const points = 5 + Math.floor(rand() * 4);
    for (let p = 0; p < points; p++) {
      const angle = (p / points) * Math.PI * 2;
      const radius = size * (0.5 + rand() * 0.5);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (p === 0) {
        ctx.moveTo(px, py);
      } else {
        // Use quadratic curves for organic shapes
        const cpAngle = ((p - 0.5) / points) * Math.PI * 2;
        const cpRadius = size * (0.3 + rand() * 0.7);
        const cpx = x + Math.cos(cpAngle) * cpRadius;
        const cpy = y + Math.sin(cpAngle) * cpRadius;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    // Brownish stain color
    const r = 80 + Math.floor(rand() * 40);
    const g = 50 + Math.floor(rand() * 30);
    const b = 20 + Math.floor(rand() * 20);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.fill();
  }

  // Add some smaller scratch marks
  ctx.strokeStyle = "rgba(90, 60, 30, 0.08)";
  ctx.lineCap = "round";

  for (let i = 0; i < scuffCount * 2; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const length = 5 + rand() * 25;
    const angle = rand() * Math.PI * 2;

    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Add vignette effect (darker edges)
 */
export function addVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.3
): void {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(60, 40, 20, ${intensity})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export interface FoldLinesOptions {
  /** Number of horizontal folds (default: 2) */
  horizontalFolds?: number;
  /** Number of vertical folds (default: 2) */
  verticalFolds?: number;
  /** Opacity of fold lines (default: 0.08) */
  opacity?: number;
  /** Seed for consistent random variation */
  seed?: number;
}

/**
 * Draw fold lines/creases across the parchment for weathered look
 */
export function addFoldLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: FoldLinesOptions = {}
): void {
  const { horizontalFolds = 2, verticalFolds = 2, opacity = 0.08, seed = 54321 } = options;

  const rand = seededRandom(seed);

  ctx.save();

  // Draw horizontal fold lines
  for (let i = 1; i <= horizontalFolds; i++) {
    const baseY = (height / (horizontalFolds + 1)) * i;
    const wobble = rand() * 10 - 5;

    // Shadow line (darker, slightly offset)
    ctx.strokeStyle = `rgba(40, 25, 10, ${opacity * 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY + wobble + 1);

    // Create slight waviness
    for (let x = 0; x <= width; x += width / 8) {
      const y = baseY + wobble + Math.sin(x * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x, y + 1);
    }
    ctx.stroke();

    // Highlight line (lighter, above shadow)
    ctx.strokeStyle = `rgba(255, 250, 240, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY + wobble - 1);

    for (let x = 0; x <= width; x += width / 8) {
      const y = baseY + wobble + Math.sin(x * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x, y - 1);
    }
    ctx.stroke();
  }

  // Draw vertical fold lines
  for (let i = 1; i <= verticalFolds; i++) {
    const baseX = (width / (verticalFolds + 1)) * i;
    const wobble = rand() * 10 - 5;

    // Shadow line
    ctx.strokeStyle = `rgba(40, 25, 10, ${opacity * 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX + wobble + 1, 0);

    for (let y = 0; y <= height; y += height / 8) {
      const x = baseX + wobble + Math.sin(y * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x + 1, y);
    }
    ctx.stroke();

    // Highlight line
    ctx.strokeStyle = `rgba(255, 250, 240, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baseX + wobble - 1, 0);

    for (let y = 0; y <= height; y += height / 8) {
      const x = baseX + wobble + Math.sin(y * 0.02 + rand() * Math.PI) * 2;
      ctx.lineTo(x - 1, y);
    }
    ctx.stroke();
  }

  // Add subtle darkening along fold intersections
  for (let hi = 1; hi <= horizontalFolds; hi++) {
    for (let vi = 1; vi <= verticalFolds; vi++) {
      const fx = (width / (verticalFolds + 1)) * vi;
      const fy = (height / (horizontalFolds + 1)) * hi;

      const gradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, 20);
      gradient.addColorStop(0, `rgba(60, 40, 20, ${opacity * 0.5})`);
      gradient.addColorStop(1, "rgba(60, 40, 20, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(fx - 20, fy - 20, 40, 40);
    }
  }

  ctx.restore();
}
