import type { Rect } from "../types";
import type { CompositeShape, CompositeVariant } from "./types";
import { RoomShapeType } from "./types";
import { calculateCompositeBoundingBox } from "./draw";
import { randomInt } from "../utils/random";

/**
 * Create an L-shaped room within the given bounds
 */
export function createLShape(
  bounds: Rect,
  minArmWidth: number = 2
): CompositeShape {
  const maxArmWidth = Math.min(
    Math.floor(bounds.width / 2),
    Math.floor(bounds.height / 2)
  );
  const armWidth = Math.max(minArmWidth, randomInt(maxArmWidth, minArmWidth));

  // Randomly choose L orientation (4 possible)
  const orientation = randomInt(4, 0);

  let rects: Rect[];

  switch (orientation) {
    case 0: // ┘ (bottom-left corner)
      rects = [
        // Horizontal arm (bottom)
        {
          x: bounds.x,
          y: bounds.y + bounds.height - armWidth,
          width: bounds.width,
          height: armWidth,
        },
        // Vertical arm (left)
        {
          x: bounds.x,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
      ];
      break;
    case 1: // └ (bottom-right corner)
      rects = [
        // Horizontal arm (bottom)
        {
          x: bounds.x,
          y: bounds.y + bounds.height - armWidth,
          width: bounds.width,
          height: armWidth,
        },
        // Vertical arm (right)
        {
          x: bounds.x + bounds.width - armWidth,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
      ];
      break;
    case 2: // ┐ (top-left corner)
      rects = [
        // Horizontal arm (top)
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: armWidth,
        },
        // Vertical arm (left)
        {
          x: bounds.x,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
      ];
      break;
    case 3: // ┌ (top-right corner)
    default:
      rects = [
        // Horizontal arm (top)
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: armWidth,
        },
        // Vertical arm (right)
        {
          x: bounds.x + bounds.width - armWidth,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
      ];
      break;
  }

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "L",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Create a T-shaped room within the given bounds
 */
export function createTShape(
  bounds: Rect,
  minStemWidth: number = 2
): CompositeShape {
  const maxStemWidth = Math.min(
    Math.floor(bounds.width / 2),
    Math.floor(bounds.height / 2)
  );
  const stemWidth = Math.max(minStemWidth, randomInt(maxStemWidth, minStemWidth));

  // Randomly choose T orientation (4 possible)
  const orientation = randomInt(4, 0);

  let rects: Rect[];
  const crossbarHeight = stemWidth;

  switch (orientation) {
    case 0: // T pointing down (┬)
      rects = [
        // Horizontal crossbar (top)
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: crossbarHeight,
        },
        // Vertical stem (center, going down)
        {
          x: bounds.x + Math.floor((bounds.width - stemWidth) / 2),
          y: bounds.y,
          width: stemWidth,
          height: bounds.height,
        },
      ];
      break;
    case 1: // T pointing up (┴)
      rects = [
        // Horizontal crossbar (bottom)
        {
          x: bounds.x,
          y: bounds.y + bounds.height - crossbarHeight,
          width: bounds.width,
          height: crossbarHeight,
        },
        // Vertical stem (center, going up)
        {
          x: bounds.x + Math.floor((bounds.width - stemWidth) / 2),
          y: bounds.y,
          width: stemWidth,
          height: bounds.height,
        },
      ];
      break;
    case 2: // T pointing right (├)
      rects = [
        // Vertical crossbar (left)
        {
          x: bounds.x,
          y: bounds.y,
          width: crossbarHeight,
          height: bounds.height,
        },
        // Horizontal stem (center, going right)
        {
          x: bounds.x,
          y: bounds.y + Math.floor((bounds.height - stemWidth) / 2),
          width: bounds.width,
          height: stemWidth,
        },
      ];
      break;
    case 3: // T pointing left (┤)
    default:
      rects = [
        // Vertical crossbar (right)
        {
          x: bounds.x + bounds.width - crossbarHeight,
          y: bounds.y,
          width: crossbarHeight,
          height: bounds.height,
        },
        // Horizontal stem (center, going left)
        {
          x: bounds.x,
          y: bounds.y + Math.floor((bounds.height - stemWidth) / 2),
          width: bounds.width,
          height: stemWidth,
        },
      ];
      break;
  }

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "T",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Create a cross/plus-shaped room within the given bounds
 */
export function createCrossShape(
  bounds: Rect,
  minArmWidth: number = 2
): CompositeShape {
  const maxArmWidth = Math.min(
    Math.floor(bounds.width / 2),
    Math.floor(bounds.height / 2)
  );
  const armWidth = Math.max(minArmWidth, randomInt(maxArmWidth, minArmWidth));

  const rects: Rect[] = [
    // Horizontal bar
    {
      x: bounds.x,
      y: bounds.y + Math.floor((bounds.height - armWidth) / 2),
      width: bounds.width,
      height: armWidth,
    },
    // Vertical bar
    {
      x: bounds.x + Math.floor((bounds.width - armWidth) / 2),
      y: bounds.y,
      width: armWidth,
      height: bounds.height,
    },
  ];

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "CROSS",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Create a U-shaped room within the given bounds
 */
export function createUShape(
  bounds: Rect,
  minArmWidth: number = 2
): CompositeShape {
  const maxArmWidth = Math.floor(bounds.width / 3);
  const armWidth = Math.max(minArmWidth, randomInt(maxArmWidth, minArmWidth));
  const baseHeight = Math.max(minArmWidth, randomInt(Math.floor(bounds.height / 3), minArmWidth));

  // Randomly choose U orientation (4 possible)
  const orientation = randomInt(4, 0);

  let rects: Rect[];

  switch (orientation) {
    case 0: // U opening up (∪)
      rects = [
        // Left arm
        {
          x: bounds.x,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
        // Right arm
        {
          x: bounds.x + bounds.width - armWidth,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
        // Bottom connector
        {
          x: bounds.x,
          y: bounds.y + bounds.height - baseHeight,
          width: bounds.width,
          height: baseHeight,
        },
      ];
      break;
    case 1: // U opening down (∩)
      rects = [
        // Left arm
        {
          x: bounds.x,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
        // Right arm
        {
          x: bounds.x + bounds.width - armWidth,
          y: bounds.y,
          width: armWidth,
          height: bounds.height,
        },
        // Top connector
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: baseHeight,
        },
      ];
      break;
    case 2: // U opening right (⊃)
      rects = [
        // Top arm
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: armWidth,
        },
        // Bottom arm
        {
          x: bounds.x,
          y: bounds.y + bounds.height - armWidth,
          width: bounds.width,
          height: armWidth,
        },
        // Left connector
        {
          x: bounds.x,
          y: bounds.y,
          width: baseHeight,
          height: bounds.height,
        },
      ];
      break;
    case 3: // U opening left (⊂)
    default:
      rects = [
        // Top arm
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: armWidth,
        },
        // Bottom arm
        {
          x: bounds.x,
          y: bounds.y + bounds.height - armWidth,
          width: bounds.width,
          height: armWidth,
        },
        // Right connector
        {
          x: bounds.x + bounds.width - baseHeight,
          y: bounds.y,
          width: baseHeight,
          height: bounds.height,
        },
      ];
      break;
  }

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "U",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Create a Z-shaped room within the given bounds
 */
export function createZShape(
  bounds: Rect,
  minArmWidth: number = 2
): CompositeShape {
  const maxArmWidth = Math.floor(Math.min(bounds.width, bounds.height) / 3);
  const armWidth = Math.max(minArmWidth, randomInt(maxArmWidth, minArmWidth));

  // Randomly choose Z orientation (2 possible: Z or S)
  const isZ = randomInt(2, 0) === 0;

  let rects: Rect[];

  if (isZ) {
    // Z shape
    rects = [
      // Top horizontal
      {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: armWidth,
      },
      // Diagonal connector (represented as middle section)
      {
        x: bounds.x + Math.floor((bounds.width - armWidth) / 2),
        y: bounds.y,
        width: armWidth,
        height: bounds.height,
      },
      // Bottom horizontal
      {
        x: bounds.x,
        y: bounds.y + bounds.height - armWidth,
        width: bounds.width,
        height: armWidth,
      },
    ];
  } else {
    // S shape (mirrored Z)
    rects = [
      // Top horizontal (right side)
      {
        x: bounds.x + Math.floor(bounds.width / 2) - armWidth,
        y: bounds.y,
        width: Math.floor(bounds.width / 2) + armWidth,
        height: armWidth,
      },
      // Middle vertical
      {
        x: bounds.x + Math.floor((bounds.width - armWidth) / 2),
        y: bounds.y,
        width: armWidth,
        height: bounds.height,
      },
      // Bottom horizontal (left side)
      {
        x: bounds.x,
        y: bounds.y + bounds.height - armWidth,
        width: Math.floor(bounds.width / 2) + armWidth,
        height: armWidth,
      },
    ];
  }

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "Z",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Create a random composite shape with multiple rectangles
 */
export function createRandomComposite(
  bounds: Rect,
  minRects: number = 2,
  maxRects: number = 4
): CompositeShape {
  const numRects = randomInt(maxRects + 1, minRects);
  const rects: Rect[] = [];

  // Start with a base rectangle
  const baseWidth = randomInt(bounds.width, Math.floor(bounds.width / 2));
  const baseHeight = randomInt(bounds.height, Math.floor(bounds.height / 2));
  const baseX = bounds.x + randomInt(bounds.width - baseWidth + 1, 0);
  const baseY = bounds.y + randomInt(bounds.height - baseHeight + 1, 0);

  rects.push({ x: baseX, y: baseY, width: baseWidth, height: baseHeight });

  // Add additional overlapping rectangles
  for (let i = 1; i < numRects; i++) {
    const existingRect = rects[randomInt(rects.length - 1, 0)];

    // Create a rectangle that overlaps with an existing one
    const newWidth = randomInt(
      Math.floor(bounds.width / 2),
      Math.max(2, Math.floor(bounds.width / 4))
    );
    const newHeight = randomInt(
      Math.floor(bounds.height / 2),
      Math.max(2, Math.floor(bounds.height / 4))
    );

    // Position relative to existing rectangle with overlap
    const overlapX = randomInt(
      existingRect.x + existingRect.width - 1,
      existingRect.x - newWidth + 2
    );
    const overlapY = randomInt(
      existingRect.y + existingRect.height - 1,
      existingRect.y - newHeight + 2
    );

    // Clamp to bounds
    const newX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - newWidth, overlapX));
    const newY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - newHeight, overlapY));

    rects.push({ x: newX, y: newY, width: newWidth, height: newHeight });
  }

  return {
    type: RoomShapeType.COMPOSITE,
    rects,
    variant: "RANDOM",
    boundingBox: calculateCompositeBoundingBox(rects),
  };
}

/**
 * Generate a composite shape of the specified variant within bounds
 */
export function generateCompositeShape(
  bounds: Rect,
  variant?: CompositeVariant,
  minArmWidth: number = 2
): CompositeShape {
  // If no variant specified, pick randomly
  const actualVariant =
    variant ?? (["L", "T", "CROSS", "U", "Z", "RANDOM"] as CompositeVariant[])[randomInt(6, 0)];

  switch (actualVariant) {
    case "L":
      return createLShape(bounds, minArmWidth);
    case "T":
      return createTShape(bounds, minArmWidth);
    case "CROSS":
      return createCrossShape(bounds, minArmWidth);
    case "U":
      return createUShape(bounds, minArmWidth);
    case "Z":
      return createZShape(bounds, minArmWidth);
    case "RANDOM":
    default:
      return createRandomComposite(bounds);
  }
}

/**
 * Check if bounds are large enough for composite shapes
 */
export function canFitCompositeShape(bounds: Rect, minArmWidth: number = 2): boolean {
  // Need at least 2x the arm width in each dimension
  return bounds.width >= minArmWidth * 2 && bounds.height >= minArmWidth * 2;
}
