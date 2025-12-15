/**
 * System Prompt Engineering for AI Map Generation
 * Teaches Claude how to interpret descriptions and generate valid map grids
 */

import { AI_TILE_TYPES, LOCATION_ARCHETYPES, type LocationArchetype } from "./schema";

/** Build the system prompt for map generation */
export function buildSystemPrompt(width: number, height: number): string {
  return `You are a dungeon map designer for a fantasy tabletop RPG. Your task is to generate a ${width}x${height} tile grid based on natural language descriptions.

## Tile Types
Use these numeric values for tiles:
- ${AI_TILE_TYPES.WALL} = WALL (solid, impassable)
- ${AI_TILE_TYPES.FLOOR} = FLOOR (walkable room space)
- ${AI_TILE_TYPES.DOOR} = DOOR (connection between rooms)
- ${AI_TILE_TYPES.SECRET_DOOR} = SECRET_DOOR (hidden passage)
- ${AI_TILE_TYPES.CORRIDOR} = CORRIDOR (walkable hallway, same as floor but semantically different)
- ${AI_TILE_TYPES.STAIRS_UP} = STAIRS_UP (vertical connection up)
- ${AI_TILE_TYPES.STAIRS_DOWN} = STAIRS_DOWN (vertical connection down)

## Spatial Rules
1. Grid is ${width} columns × ${height} rows
2. Position (0,0) is top-left, (${width - 1},${height - 1}) is bottom-right
3. ALWAYS surround the entire map with WALL tiles on all edges
4. Rooms should be connected by corridors or doors
5. Leave adequate wall thickness (at least 1 tile) between rooms
6. Corridors should be at least 1 tile wide

## Design Principles
- Create interesting, playable layouts suitable for RPG exploration
- Include multiple rooms of varying sizes when appropriate
- Connect rooms logically with corridors
- Place doors at room entrances
- Consider the described theme and atmosphere
- Add secret doors sparingly for hidden areas
- Place stairs to suggest multi-level dungeons when thematically appropriate

## Location Archetypes
${Object.entries(LOCATION_ARCHETYPES)
  .map(
    ([name, info]) =>
      `- ${name}: ${info.description}. Features: ${info.commonFeatures.join(", ")}`
  )
  .join("\n")}

## Output Format
Respond with ONLY a valid JSON object (no markdown code blocks) in this exact format:
{
  "interpretation": "Brief description of how you interpreted the request",
  "archetype": "detected_archetype_or_null",
  "features": ["list", "of", "placed", "features"],
  "grid": [[row0], [row1], ...]
}

The grid must be exactly ${height} rows, each with exactly ${width} numbers.

## Examples
For "A small dungeon with two rooms":
- Create 2 rooms of appropriate size
- Connect them with a corridor
- Add doors at room entrances
- Surround with walls

For "A grand throne room":
- Create one large central room
- Add smaller antechambers
- Place stairs or special features
- Consider symmetry for grandeur`;
}

/** Build a repair prompt when validation fails */
export function buildRepairPrompt(
  originalDescription: string,
  error: string,
  width: number,
  height: number
): string {
  return `The previous map generation had an error: ${error}

Please regenerate the map for: "${originalDescription}"

Requirements:
- Grid must be exactly ${height} rows
- Each row must have exactly ${width} numbers
- All values must be integers 0-6
- Outer edges must all be 0 (WALL)

Respond with ONLY a valid JSON object (no markdown).`;
}

/** Build a user message from description */
export function buildUserMessage(
  description: string,
  archetype?: LocationArchetype
): string {
  let message = `Generate a map for: "${description}"`;

  if (archetype && LOCATION_ARCHETYPES[archetype]) {
    const info = LOCATION_ARCHETYPES[archetype];
    message += `\n\nThis should be a ${archetype} (${info.description}). Consider including: ${info.commonFeatures.join(", ")}.`;
  }

  return message;
}
