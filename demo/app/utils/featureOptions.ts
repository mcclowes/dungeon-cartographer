import type { GeneratorParams } from "../types";

export interface FeatureOptions {
  rubbleChance: number;
  collapsedChance: number;
  fallenColumnChance: number;
}

export function buildFeatureOptions(params: GeneratorParams): FeatureOptions {
  return {
    rubbleChance: params.rubbleChance ?? 0,
    collapsedChance: params.collapsedChance ?? 0,
    fallenColumnChance: params.fallenColumnChance ?? 0,
  };
}
