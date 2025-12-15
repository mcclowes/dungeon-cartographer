Architecture Overview
1. Schema Layer (generate/ai/schema.js)
Defines the vocabulary and structure the AI uses to understand and generate maps:

Tile Types: WALL(0), FLOOR(1), DOOR(2), SECRET_DOOR(3), START(4), END(5)
Spatial Concepts: Positions (north, center, etc.), sizes (tiny→huge), shapes
Feature Primitives: Rooms, corridors, pillars, doors, special areas
Location Archetypes: 10 pre-defined types (dungeon, castle, cave, temple, tavern, prison, maze, mansion, library, arena)
Validation utilities for grid integrity
2. Prompt Engineering (generate/ai/systemPrompt.js)
Crafted system prompt that teaches Claude how to:

Interpret natural language descriptions
Map concepts to tile IDs
Follow spatial reasoning rules
Output valid JSON with metadata
Self-correct with repair prompts
3. API Service (generate/ai/anthropicService.js)
Handles Anthropic API communication:

Message construction with system prompts
Response parsing and JSON extraction
Automatic retry with repair prompts on validation failure
Grid validation and boundary enforcement
Progress callbacks for UI feedback
4. Generator Module (generate/ai/index.js)
Main entry point providing:

generateAIMap(tiles, options) function
Example prompts for common locations
State management for API key and history
Fallback grid on generation failure
5. UI Component (AIMapGenerator.js)
React component with:

API key input (with localStorage persistence)
Natural language description textarea
Example prompt buttons (8 pre-built scenarios)
Generation progress indicator
Error display
Metadata visualization (AI interpretation, features)
Integration
The AI generator is integrated into Tiled.js as a new category, appearing alongside existing procedural generators.

How It Works
User describes a location (e.g., "A medieval castle with a throne room and dungeon")
System sends description to Claude with comprehensive map-design instructions
Claude interprets the description, plans layout, and outputs a 32×32 tile grid as JSON
System validates the grid and renders using existing dungeon tile renderer
Metadata shows AI's interpretation and placed features