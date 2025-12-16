export type CompassPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CartouchePosition = "top" | "bottom";

export interface CompassRoseOptions {
  /** Position of the compass rose (default: "bottom-right") */
  position?: CompassPosition;
  /** Size of the compass rose in pixels (default: 60) */
  size?: number;
  /** Margin from edges in pixels (default: 15) */
  margin?: number;
  /** Main color for the compass (default: brownish ink) */
  color?: string;
  /** Secondary color for accents (default: lighter brown) */
  accentColor?: string;
}

/**
 * Draw a classic compass rose decoration on the map
 */
export function drawCompassRose(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: CompassRoseOptions = {}
): void {
  const {
    position = "bottom-right",
    size = 60,
    margin = 15,
    color = "rgba(70, 45, 20, 0.85)",
    accentColor = "rgba(120, 80, 40, 0.6)",
  } = options;

  // Calculate center position
  let cx: number;
  let cy: number;

  switch (position) {
    case "top-left":
      cx = margin + size / 2;
      cy = margin + size / 2;
      break;
    case "top-right":
      cx = canvasWidth - margin - size / 2;
      cy = margin + size / 2;
      break;
    case "bottom-left":
      cx = margin + size / 2;
      cy = canvasHeight - margin - size / 2;
      break;
    case "bottom-right":
    default:
      cx = canvasWidth - margin - size / 2;
      cy = canvasHeight - margin - size / 2;
      break;
  }

  const r = size / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Draw outer circle
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();

  // Draw inner decorative circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Draw main cardinal direction points (N, S, E, W)
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // North point (main, larger)
  const mainPointLen = r * 0.9;
  const mainPointWidth = r * 0.2;

  // Draw the 4 main points
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2);

    // Main point - filled triangle
    ctx.beginPath();
    ctx.moveTo(0, -mainPointLen);
    ctx.lineTo(-mainPointWidth, -r * 0.2);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(mainPointWidth, -r * 0.2);
    ctx.closePath();

    // North is filled solid, others are outlined
    if (i === 0) {
      ctx.fill();
    } else {
      ctx.stroke();
      // Fill with lighter color for other directions
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.fillStyle = color;
    }

    ctx.restore();
  }

  // Draw secondary diagonal points (NE, SE, SW, NW)
  const secondaryLen = r * 0.55;
  const secondaryWidth = r * 0.1;

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(0, -secondaryLen);
    ctx.lineTo(-secondaryWidth, -r * 0.25);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(secondaryWidth, -r * 0.25);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Draw direction labels
  ctx.fillStyle = color;
  ctx.font = `bold ${r * 0.28}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // N label (outside the point)
  ctx.fillText("N", 0, -r * 0.7);
  // S label
  ctx.fillText("S", 0, r * 0.7);
  // E label
  ctx.fillText("E", r * 0.7, 0);
  // W label
  ctx.fillText("W", -r * 0.7, 0);

  // Draw center decoration
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface TitleCartoucheOptions {
  /** The map title to display (required) */
  title: string;
  /** Subtitle or additional text (optional) */
  subtitle?: string;
  /** Position of the cartouche (default: "top") */
  position?: CartouchePosition;
  /** Font family for the title (default: "serif") */
  fontFamily?: string;
  /** Title font size in pixels (default: 24) */
  fontSize?: number;
  /** Margin from edge in pixels (default: 20) */
  margin?: number;
  /** Main color for text and decorations (default: brownish ink) */
  color?: string;
  /** Background color for the cartouche (default: parchment with transparency) */
  backgroundColor?: string;
  /** Horizontal padding inside the cartouche (default: 30) */
  paddingX?: number;
  /** Vertical padding inside the cartouche (default: 15) */
  paddingY?: number;
}

/**
 * Draw a decorative title cartouche (banner/frame) with the map title
 */
export function drawTitleCartouche(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: TitleCartoucheOptions
): void {
  const {
    title,
    subtitle,
    position = "top",
    fontFamily = "serif",
    fontSize = 24,
    margin = 20,
    color = "rgba(70, 45, 20, 0.9)",
    backgroundColor = "rgba(232, 217, 181, 0.95)",
    paddingX = 30,
    paddingY = 15,
  } = options;

  ctx.save();

  // Measure text dimensions
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const titleMetrics = ctx.measureText(title);
  const titleWidth = titleMetrics.width;
  const titleHeight = fontSize;

  let subtitleWidth = 0;
  let subtitleHeight = 0;
  const subtitleFontSize = fontSize * 0.6;
  if (subtitle) {
    ctx.font = `italic ${subtitleFontSize}px ${fontFamily}`;
    const subtitleMetrics = ctx.measureText(subtitle);
    subtitleWidth = subtitleMetrics.width;
    subtitleHeight = subtitleFontSize;
  }

  // Calculate cartouche dimensions
  const contentWidth = Math.max(titleWidth, subtitleWidth);
  const contentHeight = titleHeight + (subtitle ? subtitleHeight + 8 : 0);
  const cartoucheWidth = contentWidth + paddingX * 2;
  const cartoucheHeight = contentHeight + paddingY * 2;

  // Calculate position
  const cx = canvasWidth / 2;
  const cy =
    position === "top" ? margin + cartoucheHeight / 2 : canvasHeight - margin - cartoucheHeight / 2;

  // Decorative scroll curl dimensions
  const curlWidth = 25;
  const curlHeight = cartoucheHeight * 0.6;

  // Draw the cartouche shape with decorative curls
  ctx.beginPath();

  // Main rectangle with slight curves
  const left = cx - cartoucheWidth / 2;
  const right = cx + cartoucheWidth / 2;
  const top = cy - cartoucheHeight / 2;
  const bottom = cy + cartoucheHeight / 2;
  const cornerRadius = 4;

  // Top edge with corner curves
  ctx.moveTo(left + cornerRadius, top);
  ctx.lineTo(right - cornerRadius, top);
  ctx.quadraticCurveTo(right, top, right, top + cornerRadius);

  // Right edge
  ctx.lineTo(right, bottom - cornerRadius);
  ctx.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);

  // Bottom edge
  ctx.lineTo(left + cornerRadius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - cornerRadius);

  // Left edge back to start
  ctx.lineTo(left, top + cornerRadius);
  ctx.quadraticCurveTo(left, top, left + cornerRadius, top);

  ctx.closePath();

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fill();

  // Draw decorative scroll curls on the sides
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  // Left curl
  ctx.beginPath();
  ctx.moveTo(left, cy - curlHeight / 2);
  ctx.bezierCurveTo(
    left - curlWidth * 0.8,
    cy - curlHeight / 3,
    left - curlWidth,
    cy,
    left - curlWidth * 0.6,
    cy + curlHeight / 4
  );
  ctx.bezierCurveTo(
    left - curlWidth * 0.3,
    cy + curlHeight / 2,
    left,
    cy + curlHeight / 3,
    left,
    cy + curlHeight / 2
  );
  ctx.stroke();

  // Right curl (mirrored)
  ctx.beginPath();
  ctx.moveTo(right, cy - curlHeight / 2);
  ctx.bezierCurveTo(
    right + curlWidth * 0.8,
    cy - curlHeight / 3,
    right + curlWidth,
    cy,
    right + curlWidth * 0.6,
    cy + curlHeight / 4
  );
  ctx.bezierCurveTo(
    right + curlWidth * 0.3,
    cy + curlHeight / 2,
    right,
    cy + curlHeight / 3,
    right,
    cy + curlHeight / 2
  );
  ctx.stroke();

  // Draw decorative border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Outer border
  ctx.beginPath();
  ctx.moveTo(left + cornerRadius, top);
  ctx.lineTo(right - cornerRadius, top);
  ctx.quadraticCurveTo(right, top, right, top + cornerRadius);
  ctx.lineTo(right, bottom - cornerRadius);
  ctx.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);
  ctx.lineTo(left + cornerRadius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - cornerRadius);
  ctx.lineTo(left, top + cornerRadius);
  ctx.quadraticCurveTo(left, top, left + cornerRadius, top);
  ctx.stroke();

  // Inner decorative border
  const inset = 4;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(left + cornerRadius + inset, top + inset);
  ctx.lineTo(right - cornerRadius - inset, top + inset);
  ctx.quadraticCurveTo(right - inset, top + inset, right - inset, top + cornerRadius + inset);
  ctx.lineTo(right - inset, bottom - cornerRadius - inset);
  ctx.quadraticCurveTo(right - inset, bottom - inset, right - cornerRadius - inset, bottom - inset);
  ctx.lineTo(left + cornerRadius + inset, bottom - inset);
  ctx.quadraticCurveTo(left + inset, bottom - inset, left + inset, bottom - cornerRadius - inset);
  ctx.lineTo(left + inset, top + cornerRadius + inset);
  ctx.quadraticCurveTo(left + inset, top + inset, left + cornerRadius + inset, top + inset);
  ctx.stroke();

  // Draw small decorative elements at corners
  const cornerDeco = 6;
  ctx.lineWidth = 1;

  // Top-left corner decoration
  ctx.beginPath();
  ctx.moveTo(left + cornerDeco, top + cornerDeco * 2);
  ctx.lineTo(left + cornerDeco, top + cornerDeco);
  ctx.lineTo(left + cornerDeco * 2, top + cornerDeco);
  ctx.stroke();

  // Top-right corner decoration
  ctx.beginPath();
  ctx.moveTo(right - cornerDeco, top + cornerDeco * 2);
  ctx.lineTo(right - cornerDeco, top + cornerDeco);
  ctx.lineTo(right - cornerDeco * 2, top + cornerDeco);
  ctx.stroke();

  // Bottom-left corner decoration
  ctx.beginPath();
  ctx.moveTo(left + cornerDeco, bottom - cornerDeco * 2);
  ctx.lineTo(left + cornerDeco, bottom - cornerDeco);
  ctx.lineTo(left + cornerDeco * 2, bottom - cornerDeco);
  ctx.stroke();

  // Bottom-right corner decoration
  ctx.beginPath();
  ctx.moveTo(right - cornerDeco, bottom - cornerDeco * 2);
  ctx.lineTo(right - cornerDeco, bottom - cornerDeco);
  ctx.lineTo(right - cornerDeco * 2, bottom - cornerDeco);
  ctx.stroke();

  // Draw title text
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textY = subtitle ? cy - subtitleHeight / 2 - 2 : cy;

  ctx.fillText(title, cx, textY);

  // Draw subtitle if present
  if (subtitle) {
    ctx.font = `italic ${subtitleFontSize}px ${fontFamily}`;
    ctx.fillText(subtitle, cx, cy + titleHeight / 2 + 2);
  }

  ctx.restore();
}
