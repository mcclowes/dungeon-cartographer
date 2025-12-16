"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { placeFurniture, type Grid } from "dungeon-cartographer";
import { drawGrid, type RenderStyle } from "dungeon-cartographer/render";
import {
  AIMapGenerator,
  ErrorBoundary,
  GeneratorSelector,
  ParameterControls,
  PresetSelector,
  RenderControls,
  MapCanvas,
  SeedControl,
  StatsDisplay,
} from "./components";
import type { GeneratorType, GeneratorParams, RenderParams, Preset } from "./types";
import { GENERATORS, CATEGORIES, DEFAULT_PARAMS, PRESETS } from "./config";
import { createSeededRandom, generateSeed } from "./utils";
import { parseUrlState, useUrlSync } from "./hooks";
import { useRevealAnimation } from "./hooks/useRevealAnimation";
import styles from "./page.module.scss";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [generatorType, setGeneratorType] = useState<GeneratorType>("bsp");
  const [size, setSize] = useState(32);
  const [style, setStyle] = useState<RenderStyle>("parchment");
  const [seed, setSeed] = useState(() => generateSeed());
  const [currentGrid, setCurrentGrid] = useState<Grid | null>(null);
  const [params, setParams] = useState<GeneratorParams>(DEFAULT_PARAMS.bsp);
  const [renderParams, setRenderParams] = useState<RenderParams>({
    showGrid: false,
    animateReveal: false,
    showTitle: false,
    mapTitle: "The Forgotten Dungeon",
  });
  const [generationTime, setGenerationTime] = useState<number | undefined>();
  const [showControls, setShowControls] = useState(false);

  const currentConfig = GENERATORS[generatorType];

  // URL sync
  const { copyUrl } = useUrlSync({
    generator: generatorType,
    size,
    style,
    seed,
    params,
    isInitialized,
  });

  // Load state from URL on mount
  useEffect(() => {
    const urlState = parseUrlState();

    if (urlState.generator) {
      setGeneratorType(urlState.generator);
      setParams({
        ...DEFAULT_PARAMS[urlState.generator],
        ...urlState.params,
      });
    }
    if (urlState.size) setSize(urlState.size);
    if (urlState.style) setStyle(urlState.style);
    if (urlState.seed) setSeed(urlState.seed);

    setIsInitialized(true);
  }, []);

  // Update style when generator changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    if (!currentConfig.availableStyles.includes(style)) {
      setStyle(currentConfig.defaultStyle);
    }
  }, [generatorType, currentConfig, style, isInitialized]);

  // Reset params when generator changes (only if not from URL)
  const handleGeneratorChange = useCallback((newGenerator: GeneratorType) => {
    setGeneratorType(newGenerator);
    setParams(DEFAULT_PARAMS[newGenerator]);
    setSeed(generateSeed());
  }, []);

  const generateGrid = useCallback(() => {
    // Override Math.random with seeded version
    const originalRandom = Math.random;
    Math.random = createSeededRandom(seed);

    try {
      const config = GENERATORS[generatorType];
      const startTime = performance.now();
      let grid = config.generate(size, params);

      // Add furniture if enabled
      if (params.addFurniture) {
        grid = placeFurniture(grid, {
          furnitureDensity: params.furnitureDensity ?? 0.15,
        });
      }

      const endTime = performance.now();
      setGenerationTime(endTime - startTime);
      setCurrentGrid(grid);
      return grid;
    } finally {
      // Restore original Math.random
      Math.random = originalRandom;
    }
  }, [generatorType, size, params, seed]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setGeneratorType(preset.generator);
    setSize(preset.size);
    setParams({ ...DEFAULT_PARAMS[preset.generator], ...preset.params });
    setSeed(generateSeed());
  }, []);

  const draw = useCallback(
    (grid: Grid, revealProgress = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const renderOptions = {
        style,
        showGrid: renderParams.showGrid,
        titleCartouche: renderParams.showTitle && style === "parchment"
          ? { title: renderParams.mapTitle || "Untitled Map" }
          : undefined,
      };

      // If we're animating, create a partial grid with only revealed tiles
      if (revealProgress < 1) {
        const height = grid.length;
        const width = grid[0]?.length ?? 0;

        // Create a mask grid showing only revealed tiles (radial reveal from center)
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        const partialGrid = grid.map((row, y) =>
          row.map((tile, x) => {
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const normalizedDist = dist / maxDist;
            return normalizedDist <= revealProgress ? tile : 0; // 0 = WALL (hidden)
          })
        );

        drawGrid(ctx, partialGrid, canvas.width, canvas.height, renderOptions);
      } else {
        drawGrid(ctx, grid, canvas.width, canvas.height, renderOptions);
      }
    },
    [style, renderParams.showGrid, renderParams.showTitle, renderParams.mapTitle]
  );

  const { animateReveal } = useRevealAnimation(draw);

  // Generate new grid when generator, size, params, or seed change
  useEffect(() => {
    if (!isInitialized) return;
    // AI generator handles its own generation asynchronously
    if (generatorType === "ai") return;

    const grid = generateGrid();
    if (renderParams.animateReveal) {
      animateReveal(grid);
    } else {
      draw(grid);
    }
  }, [generatorType, size, params, seed, isInitialized]);

  // Redraw when style or render params change (same grid)
  useEffect(() => {
    if (currentGrid) {
      draw(currentGrid);
    }
  }, [style, renderParams.showGrid, currentGrid, draw]);

  const handleRegenerate = () => {
    setSeed(generateSeed());
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${generatorType}-${size}x${size}-${seed}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleAIMapGenerated = useCallback(
    (grid: Grid) => {
      const startTime = performance.now();
      setCurrentGrid(grid);
      setGenerationTime(performance.now() - startTime);
      if (renderParams.animateReveal) {
        animateReveal(grid);
      } else {
        draw(grid);
      }
    },
    [draw, animateReveal, renderParams.animateReveal]
  );

  return (
    <div className={styles.fullscreen}>
      <ErrorBoundary>
        <MapCanvas canvasRef={canvasRef} width={size * 44} height={size * 44} />

        {/* Mobile toggle button */}
        <button
          className={styles.mobileToggle}
          onClick={() => setShowControls(!showControls)}
          aria-label={showControls ? "Hide controls" : "Show controls"}
        >
          {showControls ? "×" : "☰"}
        </button>

        {/* Mobile overlay backdrop */}
        {showControls && (
          <div
            className={styles.backdrop}
            onClick={() => setShowControls(false)}
          />
        )}

        <div className={`${styles.controls} ${showControls ? styles.controlsOpen : ""}`}>
          <h1 className={styles.title}>Dungeon Cartographer</h1>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>Quick Presets</h3>
            <PresetSelector presets={PRESETS} onSelect={handlePresetSelect} />
          </div>

          <div className={styles.panel}>
            <GeneratorSelector
              generators={GENERATORS}
              categories={CATEGORIES}
              selectedGenerator={generatorType}
              onSelect={handleGeneratorChange}
            />
          </div>

          {generatorType === "ai" && (
            <div className={styles.panel}>
              <h3 className={styles.sectionTitle}>AI Map Generator</h3>
              <AIMapGenerator onMapGenerated={handleAIMapGenerated} size={size} />
            </div>
          )}

          {generatorType !== "ai" && (
            <>
              <div className={styles.panel}>
                <SeedControl
                  seed={seed}
                  onSeedChange={setSeed}
                  onRandomize={handleRegenerate}
                  onCopyUrl={copyUrl}
                />
              </div>

              <div className={styles.panel}>
                <ParameterControls
                  generatorType={generatorType}
                  params={params}
                  onChange={setParams}
                />
              </div>
            </>
          )}

          <div className={styles.panel}>
            <RenderControls
              config={currentConfig}
              size={size}
              style={style}
              renderParams={renderParams}
              onSizeChange={setSize}
              onStyleChange={setStyle}
              onRenderParamsChange={setRenderParams}
              onRegenerate={handleRegenerate}
              onExport={handleExport}
            />
          </div>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>Statistics</h3>
            <StatsDisplay grid={currentGrid} generationTime={generationTime} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
