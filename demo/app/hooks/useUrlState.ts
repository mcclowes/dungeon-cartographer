"use client";

import { useEffect, useCallback } from "react";
import type { RenderStyle } from "dungeon-cartographer/render";
import type { GeneratorType, GeneratorParams } from "../types";
import { GENERATORS, DEFAULT_PARAMS } from "../config";

interface UrlState {
  generator?: GeneratorType;
  size?: number;
  style?: RenderStyle;
  seed?: number;
  params?: Partial<GeneratorParams>;
}

export function parseUrlState(): UrlState {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const result: UrlState = {};

  const generator = params.get("g");
  if (generator && generator in GENERATORS) {
    result.generator = generator as GeneratorType;
  }

  const size = params.get("s");
  if (size) {
    const sizeNum = parseInt(size);
    if ([16, 32, 48, 64].includes(sizeNum)) {
      result.size = sizeNum;
    }
  }

  const style = params.get("st");
  if (style) {
    result.style = style as RenderStyle;
  }

  const seed = params.get("seed");
  if (seed) {
    result.seed = parseInt(seed);
  }

  const paramsJson = params.get("p");
  if (paramsJson) {
    try {
      result.params = JSON.parse(decodeURIComponent(paramsJson));
    } catch {
      // Invalid params, ignore
    }
  }

  return result;
}

export function buildUrl(
  generator: GeneratorType,
  size: number,
  style: RenderStyle,
  seed: number,
  params: GeneratorParams
): string {
  const url = new URL(window.location.href);
  url.search = "";

  url.searchParams.set("g", generator);
  url.searchParams.set("s", size.toString());
  url.searchParams.set("st", style);
  url.searchParams.set("seed", seed.toString());

  // Only include non-default params
  const defaults = DEFAULT_PARAMS[generator];
  const changedParams: Partial<GeneratorParams> = {};
  for (const [key, value] of Object.entries(params)) {
    if (defaults[key as keyof GeneratorParams] !== value) {
      changedParams[key as keyof GeneratorParams] = value;
    }
  }

  if (Object.keys(changedParams).length > 0) {
    url.searchParams.set("p", encodeURIComponent(JSON.stringify(changedParams)));
  }

  return url.toString();
}

interface UseUrlStateOptions {
  generator: GeneratorType;
  size: number;
  style: RenderStyle;
  seed: number;
  params: GeneratorParams;
  isInitialized: boolean;
}

export function useUrlSync({
  generator,
  size,
  style,
  seed,
  params,
  isInitialized,
}: UseUrlStateOptions) {
  useEffect(() => {
    if (!isInitialized) return;

    const url = buildUrl(generator, size, style, seed, params);
    window.history.replaceState({}, "", url);
  }, [generator, size, style, seed, params, isInitialized]);

  const copyUrl = useCallback(async (): Promise<boolean> => {
    const url = buildUrl(generator, size, style, seed, params);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [generator, size, style, seed, params]);

  return { copyUrl };
}
