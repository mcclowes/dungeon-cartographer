import {
  RoomShapeType,
  ModifierType,
  type RoomShapeOptions,
  type ShapeModifier,
} from "dungeon-cartographer";
import type { GeneratorParams } from "../types";

export function buildRoomShapeOptions(params: GeneratorParams): RoomShapeOptions | undefined {
  const allowedShapes: RoomShapeType[] = [];
  if (params.useRectangle) allowedShapes.push(RoomShapeType.RECTANGLE);
  if (params.useComposite) allowedShapes.push(RoomShapeType.COMPOSITE);
  if (params.useTemplate) allowedShapes.push(RoomShapeType.TEMPLATE);
  if (params.useCellular) allowedShapes.push(RoomShapeType.CELLULAR);
  if (params.usePolygon) allowedShapes.push(RoomShapeType.POLYGON);

  // If no shapes selected, default to rectangle
  if (allowedShapes.length === 0) {
    allowedShapes.push(RoomShapeType.RECTANGLE);
  }

  const modifiers: ShapeModifier[] = [];
  if (params.useNibbleCorners) modifiers.push({ type: ModifierType.NIBBLE_CORNERS, probability: 0.5 });
  if (params.useAddAlcoves) modifiers.push({ type: ModifierType.ADD_ALCOVES, probability: 0.4 });
  if (params.useRoundCorners) modifiers.push({ type: ModifierType.ROUND_CORNERS, probability: 0.4 });
  if (params.useAddPillars) modifiers.push({ type: ModifierType.ADD_PILLARS, probability: 0.3 });

  return {
    allowedShapes,
    modifiers: modifiers.length > 0 ? modifiers : undefined,
  };
}
