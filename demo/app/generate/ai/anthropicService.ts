/**
 * Anthropic API Service for Map Generation
 * Handles API communication, response parsing, and retry logic
 */

import type { Grid } from "dungeon-cartographer";
import {
  validateGrid,
  enforceGridBoundaries,
  createEmptyGrid,
  type AIMapResponse,
  type AIGenerationOptions,
  type LocationArchetype,
} from "./schema";
import {
  buildSystemPrompt,
  buildUserMessage,
  buildRepairPrompt,
} from "./systemPrompt";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 2;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
  stop_reason: string;
}

/** Parse JSON from Claude's response, handling potential markdown wrapping */
function parseJsonResponse(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    throw new Error("Could not find valid JSON in response");
  }
}

/** Validate the parsed response structure */
function validateResponse(
  data: unknown,
  width: number,
  height: number
): { valid: true; response: AIMapResponse } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Response is not an object" };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.grid) {
    return { valid: false, error: "Response missing 'grid' field" };
  }

  if (!validateGrid(obj.grid)) {
    return {
      valid: false,
      error: "Grid validation failed: must be a 2D array of valid tile values",
    };
  }

  const grid = obj.grid as Grid;

  if (grid.length !== height) {
    return {
      valid: false,
      error: `Grid has ${grid.length} rows, expected ${height}`,
    };
  }

  if (grid[0]?.length !== width) {
    return {
      valid: false,
      error: `Grid has ${grid[0]?.length} columns, expected ${width}`,
    };
  }

  return {
    valid: true,
    response: {
      grid: enforceGridBoundaries(grid),
      metadata: {
        interpretation:
          typeof obj.interpretation === "string"
            ? obj.interpretation
            : "Map generated from description",
        archetype:
          typeof obj.archetype === "string"
            ? (obj.archetype as LocationArchetype)
            : undefined,
        features: Array.isArray(obj.features)
          ? obj.features.filter((f): f is string => typeof f === "string")
          : [],
        roomCount:
          typeof obj.roomCount === "number" ? obj.roomCount : undefined,
        corridorCount:
          typeof obj.corridorCount === "number" ? obj.corridorCount : undefined,
      },
    },
  };
}

/** Call the Anthropic API */
async function callAnthropicAPI(
  apiKey: string,
  systemPrompt: string,
  messages: AnthropicMessage[]
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as AnthropicResponse;

  const textContent = data.content.find((c) => c.type === "text");
  if (!textContent?.text) {
    throw new Error("No text content in API response");
  }

  return textContent.text;
}

/** Generate a map using the Anthropic API */
export async function generateMapWithAI(
  apiKey: string,
  description: string,
  options: AIGenerationOptions = {}
): Promise<AIMapResponse> {
  const width = options.width ?? 32;
  const height = options.height ?? 32;
  const onProgress = options.onProgress ?? (() => {});

  const systemPrompt = buildSystemPrompt(width, height);
  const userMessage = buildUserMessage(description, options.archetype);

  const messages: AnthropicMessage[] = [{ role: "user", content: userMessage }];

  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt === 0) {
        onProgress("Generating map...");
      } else {
        onProgress(`Retrying (attempt ${attempt + 1})...`);
      }

      const responseText = await callAnthropicAPI(
        apiKey,
        systemPrompt,
        messages
      );

      onProgress("Parsing response...");

      const parsed = parseJsonResponse(responseText);
      const validation = validateResponse(parsed, width, height);

      if (validation.valid) {
        onProgress("Map generated successfully!");
        return validation.response;
      }

      // Validation failed, prepare for retry
      lastError = validation.error;
      onProgress(`Validation error: ${lastError}`);

      if (attempt < MAX_RETRIES) {
        // Add the failed response and repair prompt for next attempt
        messages.push({ role: "assistant", content: responseText });
        messages.push({
          role: "user",
          content: buildRepairPrompt(description, lastError, width, height),
        });
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      onProgress(`Error: ${lastError}`);

      if (attempt >= MAX_RETRIES) {
        break;
      }
    }
  }

  // All retries failed, return a fallback grid
  onProgress("Generation failed, using fallback grid");
  return {
    grid: createFallbackGrid(width, height),
    metadata: {
      interpretation: `Failed to generate: ${lastError}`,
      features: ["fallback"],
    },
  };
}

/** Create a simple fallback grid when AI generation fails */
function createFallbackGrid(width: number, height: number): Grid {
  const grid = createEmptyGrid(width, height);

  // Create a simple room in the center
  const roomX = Math.floor(width / 4);
  const roomY = Math.floor(height / 4);
  const roomW = Math.floor(width / 2);
  const roomH = Math.floor(height / 2);

  for (let y = roomY; y < roomY + roomH; y++) {
    for (let x = roomX; x < roomX + roomW; x++) {
      if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
        grid[y][x] = 1; // FLOOR
      }
    }
  }

  return grid;
}
