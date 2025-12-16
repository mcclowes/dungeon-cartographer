/**
 * AI Map Generator Module
 * Main entry point for AI-powered map generation
 */

export {
  AI_TILE_TYPES,
  MAX_TILE_VALUE,
  POSITIONS,
  SIZES,
  SHAPES,
  LOCATION_ARCHETYPES,
  FURNITURE_TYPES,
  HAZARD_TYPES,
  LOOT_TYPES,
  DEBRIS_TYPES,
  validateGrid,
  enforceGridBoundaries,
  createEmptyGrid,
  getTileTypeName,
  type AITileType,
  type Position,
  type Size,
  type Shape,
  type LocationArchetype,
  type FurnitureType,
  type HazardType,
  type LootType,
  type DebrisType,
  type RoomFeature,
  type CorridorFeature,
  type DoorFeature,
  type StairsFeature,
  type HazardFeature,
  type LootFeature,
  type FurnitureFeature,
  type DebrisFeature,
  type MapFeature,
  type AIMapResponse,
  type AIGenerationOptions,
} from "./schema";

export { generateMapWithAI } from "./anthropicService";

export { buildSystemPrompt, buildUserMessage } from "./systemPrompt";

/** Example prompts for common scenarios */
export const EXAMPLE_PROMPTS = [
  {
    name: "Classic Dungeon",
    description: "A traditional dungeon layout",
    prompt:
      "A classic dungeon with multiple interconnected rooms, winding corridors, and a few secret passages. Include a large central chamber.",
    archetype: "dungeon" as const,
  },
  {
    name: "Throne Room",
    description: "A grand royal chamber",
    prompt:
      "A grand throne room with a large central hall, flanked by guard chambers. Include an antechamber at the entrance and a private passage behind the throne.",
    archetype: "castle" as const,
  },
  {
    name: "Cavern System",
    description: "Natural cave network",
    prompt:
      "A natural cave system with irregular chambers connected by narrow passages. Include an underground pool area and multiple dead ends.",
    archetype: "cave" as const,
  },
  {
    name: "Temple Complex",
    description: "A sacred religious site",
    prompt:
      "An ancient temple with a central sanctuary, meditation chambers around the perimeter, and a hidden crypt accessible via secret door.",
    archetype: "temple" as const,
  },
  {
    name: "Prison Block",
    description: "A holding facility",
    prompt:
      "A prison with rows of small cells along corridors, a guard station at the entrance, an interrogation room, and a warden's office.",
    archetype: "prison" as const,
  },
  {
    name: "Tavern",
    description: "A welcoming inn",
    prompt:
      "A cozy tavern with a large common room, a bar area, kitchen in the back, and several private rooms upstairs accessible by stairs.",
    archetype: "tavern" as const,
  },
  {
    name: "Library",
    description: "A repository of knowledge",
    prompt:
      "A grand library with a central reading room surrounded by book stacks, a restricted archives section, and a scholar's private study.",
    archetype: "library" as const,
  },
  {
    name: "Arena",
    description: "A combat arena",
    prompt:
      "A gladiatorial arena with a large central fighting pit, spectator areas around the edges, and champion quarters with an armory.",
    archetype: "arena" as const,
  },
] as const;

/** Get a random example prompt */
export function getRandomExamplePrompt(): (typeof EXAMPLE_PROMPTS)[number] {
  return EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
}
