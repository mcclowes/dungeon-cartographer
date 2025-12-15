export type RadiusInput = number | [number, number, number, number];

interface Radius {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: RadiusInput = 5,
  fill = false,
  stroke = true
): void {
  let r: Radius;

  if (typeof radius === "number") {
    r = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    r = { tl: radius[0], tr: radius[1], br: radius[2], bl: radius[3] };
  }

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();

  if (fill) {
    ctx.fill();
  }

  if (stroke) {
    ctx.stroke();
  }
}
