import type { Rect } from "../types";
import type { TemplateShape } from "./types";
import { RoomShapeType } from "./types";
import { randomInt } from "../utils/random";

/** Template definition with boolean mask */
export type TemplateMask = boolean[][];

/** Pre-defined room shape templates */
export const ROOM_TEMPLATES: Record<string, TemplateMask> = {
  // Cross/plus shape (5x5)
  cross: [
    [false, true, true, true, false],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [false, true, true, true, false],
  ],

  // Diamond shape (5x5)
  diamond: [
    [false, false, true, false, false],
    [false, true, true, true, false],
    [true, true, true, true, true],
    [false, true, true, true, false],
    [false, false, true, false, false],
  ],

  // Octagon shape (6x6)
  octagon: [
    [false, true, true, true, true, false],
    [true, true, true, true, true, true],
    [true, true, true, true, true, true],
    [true, true, true, true, true, true],
    [true, true, true, true, true, true],
    [false, true, true, true, true, false],
  ],

  // Rounded rectangle (6x4)
  rounded: [
    [false, true, true, true, true, false],
    [true, true, true, true, true, true],
    [true, true, true, true, true, true],
    [false, true, true, true, true, false],
  ],

  // Circle approximation (7x7)
  circle: [
    [false, false, true, true, true, false, false],
    [false, true, true, true, true, true, false],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, true, false, false],
  ],

  // Irregular cave-like shape 1 (6x6)
  irregular1: [
    [false, true, true, true, false, false],
    [true, true, true, true, true, false],
    [true, true, true, true, true, true],
    [false, true, true, true, true, true],
    [false, true, true, true, true, false],
    [false, false, true, true, false, false],
  ],

  // Irregular cave-like shape 2 (6x6)
  irregular2: [
    [false, false, true, true, true, false],
    [false, true, true, true, true, true],
    [true, true, true, true, true, true],
    [true, true, true, true, true, false],
    [false, true, true, true, false, false],
    [false, false, true, false, false, false],
  ],

  // Irregular shape 3 - blob (7x5)
  irregular3: [
    [false, true, true, true, true, false, false],
    [true, true, true, true, true, true, false],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, false, false, false],
  ],

  // H-shape (7x5)
  hShape: [
    [true, true, false, false, false, true, true],
    [true, true, false, false, false, true, true],
    [true, true, true, true, true, true, true],
    [true, true, false, false, false, true, true],
    [true, true, false, false, false, true, true],
  ],

  // Chevron/arrow pointing right (5x5)
  chevron: [
    [true, true, false, false, false],
    [true, true, true, true, false],
    [true, true, true, true, true],
    [true, true, true, true, false],
    [true, true, false, false, false],
  ],

  // Triangular (5x5)
  triangle: [
    [false, false, true, false, false],
    [false, true, true, true, false],
    [false, true, true, true, false],
    [true, true, true, true, true],
    [true, true, true, true, true],
  ],

  // Alcoved rectangle (7x5) - rectangle with alcoves
  alcoved: [
    [false, true, true, true, true, true, false],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
  ],
};

/** List of all available template names */
export const TEMPLATE_NAMES = Object.keys(ROOM_TEMPLATES);

/**
 * Get a template by name
 */
export function getTemplate(name: string): TemplateMask | undefined {
  return ROOM_TEMPLATES[name];
}

/**
 * Scale a template to fit within target dimensions
 * Uses nearest-neighbor scaling
 */
export function scaleTemplate(
  template: TemplateMask,
  targetWidth: number,
  targetHeight: number
): TemplateMask {
  const srcHeight = template.length;
  const srcWidth = template[0]?.length ?? 0;

  if (srcWidth === 0 || srcHeight === 0) {
    return [];
  }

  // Don't scale if already the right size
  if (srcWidth === targetWidth && srcHeight === targetHeight) {
    return template.map((row) => [...row]);
  }

  const result: TemplateMask = [];
  const xRatio = srcWidth / targetWidth;
  const yRatio = srcHeight / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      row.push(template[srcY]?.[srcX] ?? false);
    }
    result.push(row);
  }

  return result;
}

/**
 * Rotate a template by 90-degree increments
 * @param template The template to rotate
 * @param rotation Rotation in degrees (0, 90, 180, 270)
 */
export function rotateTemplate(template: TemplateMask, rotation: 0 | 90 | 180 | 270): TemplateMask {
  if (rotation === 0) {
    return template.map((row) => [...row]);
  }

  const height = template.length;
  const width = template[0]?.length ?? 0;

  if (rotation === 180) {
    // Flip both axes
    return template
      .slice()
      .reverse()
      .map((row) => row.slice().reverse());
  }

  // 90 or 270 degree rotation - swap dimensions
  const result: TemplateMask = [];
  const newHeight = width;
  const newWidth = height;

  for (let y = 0; y < newHeight; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < newWidth; x++) {
      if (rotation === 90) {
        // 90 degrees clockwise
        row.push(template[height - 1 - x]?.[y] ?? false);
      } else {
        // 270 degrees clockwise (90 counter-clockwise)
        row.push(template[x]?.[width - 1 - y] ?? false);
      }
    }
    result.push(row);
  }

  return result;
}

/**
 * Mirror a template horizontally
 */
export function mirrorTemplateHorizontal(template: TemplateMask): TemplateMask {
  return template.map((row) => row.slice().reverse());
}

/**
 * Mirror a template vertically
 */
export function mirrorTemplateVertical(template: TemplateMask): TemplateMask {
  return template
    .slice()
    .reverse()
    .map((row) => [...row]);
}

/**
 * Get the dimensions of a template
 */
export function getTemplateDimensions(template: TemplateMask): { width: number; height: number } {
  return {
    width: template[0]?.length ?? 0,
    height: template.length,
  };
}

/**
 * Count floor tiles in a template
 */
export function countTemplateTiles(template: TemplateMask): number {
  let count = 0;
  for (const row of template) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

/**
 * Generate a template shape that fits within the given bounds
 */
export function generateTemplateShape(
  bounds: Rect,
  templateName?: string,
  allowedTemplates?: string[]
): TemplateShape {
  // Select template
  let name: string;
  if (templateName && ROOM_TEMPLATES[templateName]) {
    name = templateName;
  } else {
    const available = allowedTemplates?.filter((t) => ROOM_TEMPLATES[t]) ?? TEMPLATE_NAMES;
    name = available[randomInt(available.length, 0)];
  }

  const baseTemplate = ROOM_TEMPLATES[name];
  if (!baseTemplate) {
    // Fallback to cross if template not found
    name = "cross";
  }

  const template = ROOM_TEMPLATES[name];

  // Optionally rotate the template
  const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
  const rotation = rotations[randomInt(4, 0)];
  let rotatedTemplate = rotateTemplate(template, rotation);

  // Optionally mirror
  if (randomInt(2, 0) === 1) {
    rotatedTemplate = mirrorTemplateHorizontal(rotatedTemplate);
  }

  // Scale to fit bounds
  const scaledTemplate = scaleTemplate(rotatedTemplate, bounds.width, bounds.height);

  return {
    type: RoomShapeType.TEMPLATE,
    mask: scaledTemplate,
    templateName: name,
    boundingBox: bounds,
  };
}

/**
 * Check if bounds are large enough for template shapes
 */
export function canFitTemplateShape(bounds: Rect, minSize: number = 3): boolean {
  return bounds.width >= minSize && bounds.height >= minSize;
}
