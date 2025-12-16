import type { Point, Rect } from "../types";
import type { PolygonShape, PolygonVariant } from "./types";
import { RoomShapeType } from "./types";
import { calculatePolygonBoundingBox } from "./draw";
import { randomInt } from "../utils/random";

/**
 * Generate a polygon-based room shape
 */
export function generatePolygonShape(
  bounds: Rect,
  variant?: PolygonVariant
): PolygonShape {
  // Select variant if not specified
  const actualVariant =
    variant ??
    (["hexagon", "octagon", "circle", "ellipse", "diamond"] as PolygonVariant[])[
      randomInt(5, 0)
    ];

  // Calculate center and radius to fit within bounds with padding
  const padding = 1;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const radiusX = (bounds.width - padding * 2) / 2;
  const radiusY = (bounds.height - padding * 2) / 2;
  const radius = Math.min(radiusX, radiusY);

  let vertices: Point[];

  switch (actualVariant) {
    case "hexagon":
      vertices = createHexagon(centerX, centerY, radius);
      break;
    case "octagon":
      vertices = createOctagon(centerX, centerY, radius);
      break;
    case "circle":
      vertices = createCircle(centerX, centerY, radius, 16);
      break;
    case "ellipse":
      vertices = createEllipse(centerX, centerY, radiusX, radiusY, 16);
      break;
    case "diamond":
      vertices = createDiamond(centerX, centerY, radiusX, radiusY);
      break;
    case "custom":
    default:
      // Default to octagon for custom
      vertices = createOctagon(centerX, centerY, radius);
      break;
  }

  return {
    type: RoomShapeType.POLYGON,
    vertices,
    variant: actualVariant,
    boundingBox: bounds,
  };
}

/**
 * Create a regular hexagon (6 vertices)
 */
export function createHexagon(
  centerX: number,
  centerY: number,
  radius: number
): Point[] {
  return createRegularPolygon(centerX, centerY, radius, 6, Math.PI / 6);
}

/**
 * Create a regular octagon (8 vertices)
 */
export function createOctagon(
  centerX: number,
  centerY: number,
  radius: number
): Point[] {
  return createRegularPolygon(centerX, centerY, radius, 8, Math.PI / 8);
}

/**
 * Create a diamond/rhombus shape (4 vertices)
 */
export function createDiamond(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number
): Point[] {
  return [
    { x: centerX, y: centerY - radiusY }, // Top
    { x: centerX + radiusX, y: centerY }, // Right
    { x: centerX, y: centerY + radiusY }, // Bottom
    { x: centerX - radiusX, y: centerY }, // Left
  ];
}

/**
 * Create a circle approximation with specified number of segments
 */
export function createCircle(
  centerX: number,
  centerY: number,
  radius: number,
  segments: number = 16
): Point[] {
  return createRegularPolygon(centerX, centerY, radius, segments);
}

/**
 * Create an ellipse approximation with specified number of segments
 */
export function createEllipse(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  segments: number = 16
): Point[] {
  const vertices: Point[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push({
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    });
  }

  return vertices;
}

/**
 * Create a regular polygon with n sides
 */
export function createRegularPolygon(
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  rotation: number = 0
): Point[] {
  const vertices: Point[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i - Math.PI / 2 + rotation;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return vertices;
}

/**
 * Create a star polygon
 */
export function createStar(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 5
): Point[] {
  const vertices: Point[] = [];
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return vertices;
}

/**
 * Create an irregular polygon by jittering a regular polygon
 */
export function createIrregularPolygon(
  centerX: number,
  centerY: number,
  baseRadius: number,
  sides: number,
  jitter: number = 0.3
): Point[] {
  const vertices: Point[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i - Math.PI / 2;
    // Randomize radius
    const radiusJitter = 1 + (Math.random() * 2 - 1) * jitter;
    const radius = baseRadius * radiusJitter;
    // Randomize angle slightly
    const angleJitter = (Math.random() * 2 - 1) * jitter * 0.3;

    vertices.push({
      x: centerX + Math.cos(angle + angleJitter) * radius,
      y: centerY + Math.sin(angle + angleJitter) * radius,
    });
  }

  return vertices;
}

/**
 * Scale polygon vertices to fit within bounds
 */
export function scalePolygonToFit(vertices: Point[], bounds: Rect): Point[] {
  if (vertices.length === 0) return [];

  const currentBounds = calculatePolygonBoundingBox(vertices);

  const scaleX = (bounds.width - 2) / currentBounds.width;
  const scaleY = (bounds.height - 2) / currentBounds.height;
  const scale = Math.min(scaleX, scaleY);

  const centerX = currentBounds.x + currentBounds.width / 2;
  const centerY = currentBounds.y + currentBounds.height / 2;
  const targetCenterX = bounds.x + bounds.width / 2;
  const targetCenterY = bounds.y + bounds.height / 2;

  return vertices.map((v) => ({
    x: (v.x - centerX) * scale + targetCenterX,
    y: (v.y - centerY) * scale + targetCenterY,
  }));
}

/**
 * Rotate polygon vertices around center
 */
export function rotatePolygon(
  vertices: Point[],
  centerX: number,
  centerY: number,
  angle: number
): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return vertices.map((v) => {
    const dx = v.x - centerX;
    const dy = v.y - centerY;
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });
}

/**
 * Check if a point is inside a polygon using ray casting
 */
export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  const n = vertices.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];

    if (
      vi.y > point.y !== vj.y > point.y &&
      point.x < ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y) + vi.x
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Get all integer coordinate points inside a polygon
 */
export function rasterizePolygon(vertices: Point[]): Point[] {
  if (vertices.length < 3) return [];

  const bounds = calculatePolygonBoundingBox(vertices);
  const tiles: Point[] = [];

  for (let y = Math.floor(bounds.y); y < Math.ceil(bounds.y + bounds.height); y++) {
    for (let x = Math.floor(bounds.x); x < Math.ceil(bounds.x + bounds.width); x++) {
      // Check center of tile
      if (pointInPolygon({ x: x + 0.5, y: y + 0.5 }, vertices)) {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

/**
 * Check if bounds are large enough for polygon shapes
 */
export function canFitPolygonShape(bounds: Rect, minSize: number = 5): boolean {
  return bounds.width >= minSize && bounds.height >= minSize;
}
