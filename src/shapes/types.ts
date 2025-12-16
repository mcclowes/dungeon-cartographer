import type { Point, Rect } from "../types";

/** Shape type discriminator */
export enum RoomShapeType {
  RECTANGLE = "rectangle",
  COMPOSITE = "composite",
  TEMPLATE = "template",
  CELLULAR = "cellular",
  POLYGON = "polygon",
}

/** Base room shape that all shapes extend */
export interface BaseRoomShape {
  type: RoomShapeType;
  /** Bounding box for collision detection and placement */
  boundingBox: Rect;
}

/** Simple rectangle (existing behavior) */
export interface RectangleShape extends BaseRoomShape {
  type: RoomShapeType.RECTANGLE;
  rect: Rect;
}

/** Composite shape variant types */
export type CompositeVariant = "L" | "T" | "CROSS" | "U" | "Z" | "RANDOM";

/** Composite: multiple overlapping rectangles forming L, T, +, U, Z shapes */
export interface CompositeShape extends BaseRoomShape {
  type: RoomShapeType.COMPOSITE;
  rects: Rect[];
  variant: CompositeVariant;
}

/** Template: boolean mask defining shape */
export interface TemplateShape extends BaseRoomShape {
  type: RoomShapeType.TEMPLATE;
  /** 2D boolean mask where true = floor tile */
  mask: boolean[][];
  templateName: string;
}

/** Cellular: organic room from cellular automata */
export interface CellularShape extends BaseRoomShape {
  type: RoomShapeType.CELLULAR;
  /** List of floor tile positions relative to bounding box origin */
  tiles: Point[];
}

/** Polygon variant types */
export type PolygonVariant =
  | "hexagon"
  | "octagon"
  | "circle"
  | "ellipse"
  | "diamond"
  | "custom";

/** Polygon: defined by vertices, rasterized to grid */
export interface PolygonShape extends BaseRoomShape {
  type: RoomShapeType.POLYGON;
  /** Vertices defining the polygon outline */
  vertices: Point[];
  variant: PolygonVariant;
}

/** Union type for all room shapes */
export type RoomShape =
  | RectangleShape
  | CompositeShape
  | TemplateShape
  | CellularShape
  | PolygonShape;

/** Shape modifier types */
export enum ModifierType {
  NIBBLE_CORNERS = "nibble_corners",
  ADD_ALCOVES = "add_alcoves",
  ROUND_CORNERS = "round_corners",
  ADD_PILLARS = "add_pillars",
  IRREGULAR_EDGES = "irregular_edges",
}

/** Shape modifier configuration */
export interface ShapeModifier {
  type: ModifierType;
  /** Probability of applying this modifier (0-1, default: 1) */
  probability?: number;
  /** Modifier-specific parameters */
  params?: Record<string, number>;
}

/** Configuration for room shape generation */
export interface RoomShapeOptions {
  /** Which shape types to use (default: [RECTANGLE]) */
  allowedShapes?: RoomShapeType[];

  /** Weights for shape selection when multiple allowed (default: equal) */
  shapeWeights?: Partial<Record<RoomShapeType, number>>;

  /** Composite shape variants to use (default: all) */
  compositeVariants?: CompositeVariant[];

  /** Template names to use (default: all available) */
  allowedTemplates?: string[];

  /** Polygon variants to use (default: all) */
  polygonVariants?: PolygonVariant[];

  /** Post-processing modifiers to apply */
  modifiers?: ShapeModifier[];

  /** Cellular automata iterations (default: 4) */
  cellularIterations?: number;

  /** Cellular initial fill probability (default: 0.45) */
  cellularFillProbability?: number;

  /** Minimum room dimension for non-rectangular shapes (default: 5) */
  minShapeSize?: number;
}

/** Default room shape options */
export const DEFAULT_ROOM_SHAPE_OPTIONS: Required<
  Omit<RoomShapeOptions, "modifiers" | "shapeWeights">
> & {
  modifiers: ShapeModifier[];
  shapeWeights: Record<RoomShapeType, number>;
} = {
  allowedShapes: [RoomShapeType.RECTANGLE],
  shapeWeights: {
    [RoomShapeType.RECTANGLE]: 1,
    [RoomShapeType.COMPOSITE]: 1,
    [RoomShapeType.TEMPLATE]: 1,
    [RoomShapeType.CELLULAR]: 1,
    [RoomShapeType.POLYGON]: 1,
  },
  compositeVariants: ["L", "T", "CROSS", "U", "Z"],
  allowedTemplates: [],
  polygonVariants: ["hexagon", "octagon", "circle", "diamond"],
  modifiers: [],
  cellularIterations: 4,
  cellularFillProbability: 0.45,
  minShapeSize: 5,
};
