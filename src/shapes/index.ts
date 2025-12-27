import type { Rect } from "../types";
import type { RoomShape, RoomShapeOptions, CompositeVariant, PolygonVariant } from "./types";
import { RoomShapeType, DEFAULT_ROOM_SHAPE_OPTIONS } from "./types";
import { createRectangleShape } from "./draw";
import { generateCompositeShape, canFitCompositeShape } from "./composite";
import { generateTemplateShape, canFitTemplateShape, TEMPLATE_NAMES } from "./templates";
import { generateCellularShape, canFitCellularShape } from "./cellular";
import { generatePolygonShape, canFitPolygonShape } from "./polygon";
import { randomInt } from "../utils/random";

// Re-export all types
export * from "./types";

// Re-export drawing utilities
export {
  drawRoomShape,
  drawRectangle,
  drawComposite,
  drawTemplate,
  drawCellular,
  drawPolygon,
  getShapeTiles,
  getShapeCenter,
  calculateCompositeBoundingBox,
  calculatePolygonBoundingBox,
  shapeFitsInBounds,
  createRectangleShape,
} from "./draw";

// Re-export composite shapes
export {
  createLShape,
  createTShape,
  createCrossShape,
  createUShape,
  createZShape,
  createRandomComposite,
  generateCompositeShape,
  canFitCompositeShape,
} from "./composite";

// Re-export templates
export {
  ROOM_TEMPLATES,
  TEMPLATE_NAMES,
  getTemplate,
  scaleTemplate,
  rotateTemplate,
  mirrorTemplateHorizontal,
  mirrorTemplateVertical,
  getTemplateDimensions,
  countTemplateTiles,
  generateTemplateShape,
  canFitTemplateShape,
} from "./templates";

// Re-export modifiers
export {
  applyModifiers,
  nibbleCorners,
  addAlcoves,
  roundCorners,
  addPillars,
  irregularEdges,
  createModifier,
} from "./modifiers";

// Re-export cellular
export {
  generateCellularShape,
  initializeCells,
  iterateCellular,
  extractLargestRegion,
  smoothCellularRegion,
  ensureMinimumSize,
  canFitCellularShape,
} from "./cellular";

// Re-export polygon
export {
  generatePolygonShape,
  createHexagon,
  createOctagon,
  createDiamond,
  createCircle,
  createEllipse,
  createRegularPolygon,
  createStar,
  createIrregularPolygon,
  scalePolygonToFit,
  rotatePolygon,
  pointInPolygon,
  rasterizePolygon,
  canFitPolygonShape,
} from "./polygon";

/**
 * Generate a room shape based on the provided options
 *
 * @param bounds The bounding rectangle for the room
 * @param options Configuration for shape generation
 * @returns A RoomShape that fits within the bounds
 */
export function generateRoomShape(bounds: Rect, options: RoomShapeOptions = {}): RoomShape {
  const {
    allowedShapes = DEFAULT_ROOM_SHAPE_OPTIONS.allowedShapes,
    shapeWeights = DEFAULT_ROOM_SHAPE_OPTIONS.shapeWeights,
    compositeVariants = DEFAULT_ROOM_SHAPE_OPTIONS.compositeVariants,
    allowedTemplates = DEFAULT_ROOM_SHAPE_OPTIONS.allowedTemplates,
    polygonVariants = DEFAULT_ROOM_SHAPE_OPTIONS.polygonVariants,
    cellularIterations = DEFAULT_ROOM_SHAPE_OPTIONS.cellularIterations,
    cellularFillProbability = DEFAULT_ROOM_SHAPE_OPTIONS.cellularFillProbability,
    minShapeSize = DEFAULT_ROOM_SHAPE_OPTIONS.minShapeSize,
  } = options;

  // Filter shapes that can fit in the bounds
  const validShapes = allowedShapes.filter((shape) => {
    switch (shape) {
      case RoomShapeType.RECTANGLE:
        return bounds.width >= 2 && bounds.height >= 2;
      case RoomShapeType.COMPOSITE:
        return canFitCompositeShape(bounds);
      case RoomShapeType.TEMPLATE:
        return canFitTemplateShape(bounds, minShapeSize);
      case RoomShapeType.CELLULAR:
        return canFitCellularShape(bounds, minShapeSize);
      case RoomShapeType.POLYGON:
        return canFitPolygonShape(bounds, minShapeSize);
      default:
        return false;
    }
  });

  // Fall back to rectangle if no shapes fit
  if (validShapes.length === 0) {
    return createRectangleShape(bounds);
  }

  // Select shape type based on weights
  const selectedType = selectWeightedShape(validShapes, shapeWeights);

  // Generate the selected shape
  switch (selectedType) {
    case RoomShapeType.RECTANGLE:
      return createRectangleShape(bounds);

    case RoomShapeType.COMPOSITE: {
      const variant = compositeVariants[randomInt(compositeVariants.length - 1, 0)];
      return generateCompositeShape(bounds, variant);
    }

    case RoomShapeType.TEMPLATE: {
      const templates = allowedTemplates.length > 0 ? allowedTemplates : TEMPLATE_NAMES;
      const templateName = templates[randomInt(templates.length - 1, 0)];
      return generateTemplateShape(bounds, templateName, templates);
    }

    case RoomShapeType.CELLULAR:
      return generateCellularShape(bounds, {
        iterations: cellularIterations,
        fillProbability: cellularFillProbability,
      });

    case RoomShapeType.POLYGON: {
      const variant = polygonVariants[randomInt(polygonVariants.length - 1, 0)];
      return generatePolygonShape(bounds, variant);
    }

    default:
      return createRectangleShape(bounds);
  }
}

/**
 * Select a shape type based on weights
 */
function selectWeightedShape(
  validShapes: RoomShapeType[],
  weights: Partial<Record<RoomShapeType, number>>
): RoomShapeType {
  // Calculate total weight for valid shapes
  let totalWeight = 0;
  for (const shape of validShapes) {
    totalWeight += weights[shape] ?? 1;
  }

  // Random selection
  let random = Math.random() * totalWeight;
  for (const shape of validShapes) {
    const weight = weights[shape] ?? 1;
    random -= weight;
    if (random <= 0) {
      return shape;
    }
  }

  // Fallback
  return validShapes[0];
}

/**
 * Create default options with all shape types enabled
 */
export function createAllShapesOptions(
  overrides: Partial<RoomShapeOptions> = {}
): RoomShapeOptions {
  return {
    allowedShapes: [
      RoomShapeType.RECTANGLE,
      RoomShapeType.COMPOSITE,
      RoomShapeType.TEMPLATE,
      RoomShapeType.CELLULAR,
      RoomShapeType.POLYGON,
    ],
    ...overrides,
  };
}

/**
 * Create options for only composite shapes
 */
export function createCompositeOnlyOptions(variants?: CompositeVariant[]): RoomShapeOptions {
  return {
    allowedShapes: [RoomShapeType.COMPOSITE],
    compositeVariants: variants,
  };
}

/**
 * Create options for organic shapes (cellular + polygon)
 */
export function createOrganicShapesOptions(): RoomShapeOptions {
  return {
    allowedShapes: [RoomShapeType.CELLULAR, RoomShapeType.POLYGON],
  };
}

/**
 * Create options for geometric shapes (template + polygon)
 */
export function createGeometricShapesOptions(polygonVariants?: PolygonVariant[]): RoomShapeOptions {
  return {
    allowedShapes: [RoomShapeType.TEMPLATE, RoomShapeType.POLYGON],
    polygonVariants,
  };
}
