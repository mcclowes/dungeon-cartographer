"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  generateBSP,
  generateCave,
  generateDLA,
  generateDrunkardWalk,
  generateHybrid,
  generateMaze,
  generatePerlin,
  generateVoronoi,
  generateWFC,
  type Grid,
} from "dungeon-cartographer";
import { drawGrid, type RenderStyle } from "dungeon-cartographer/render";
import {
  ErrorBoundary,
  GeneratorSelector,
  ParameterControls,
  PresetSelector,
  RenderControls,
  MapCanvas,
  SeedControl,
  StatsDisplay,
} from "./components";
import type {
  GeneratorType,
  GeneratorConfig,
  GeneratorParams,
  RenderParams,
} from "./types";
import { DEFAULT_PARAMS, PRESETS, createSeededRandom, generateSeed } from "./types";
import styles from "./page.module.scss";

const GENERATORS: Record<GeneratorType, GeneratorConfig> = {
  bsp: {
    name: "BSP Dungeon",
    description: "Binary Space Partitioning rooms & corridors",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateBSP(size, {
        minPartitionSize: params.minPartitionSize,
        maxDepth: params.maxDepth,
        minRoomSize: params.minRoomSize,
        padding: params.padding,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
      }),
  },
  cave: {
    name: "Cellular Automata",
    description: "Organic cave-like structures",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateCave(size, {
        iterations: params.iterations,
        initialFillProbability: params.initialFillProbability,
        addFeatures: params.addFeatures,
      }),
  },
  dla: {
    name: "DLA Growth",
    description: "Diffusion-limited aggregation patterns",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDLA(size, {
        fillPercentage: params.fillPercentage,
        stickiness: params.stickiness,
        spawnMode: params.spawnMode,
        addFeatures: params.addFeatures,
      }),
  },
  voronoi: {
    name: "Voronoi Rooms",
    description: "Organic room shapes via tessellation",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateVoronoi(size, {
        numRooms: params.numRooms,
        minRoomDistance: params.minRoomDistance,
        relaxation: params.relaxation,
        addDoors: params.addDoors,
        addFeatures: params.addFeatures,
      }),
  },
  wfc: {
    name: "Wave Function Collapse",
    description: "Constraint-based procedural generation",
    category: "Dungeon",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateWFC(size, {
        seedRadius: params.seedRadius,
      }),
  },
  hybrid: {
    name: "Hybrid (Diagonal)",
    description: "BSP dungeon meets organic cave",
    category: "Hybrid",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateHybrid(size, {
        splitDirection: params.splitDirection ?? "diagonal",
        blendMode: params.blendMode ?? "soft",
        blendWidth: params.blendWidth ?? 4,
        connectRegions: params.connectRegions ?? true,
        addFeatures: params.addFeatures,
      }),
  },
  "hybrid-radial": {
    name: "Hybrid (Radial)",
    description: "Dungeon core with cave perimeter",
    category: "Hybrid",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateHybrid(size, {
        splitDirection: "radial",
        splitPosition: 0.4,
        blendMode: params.blendMode ?? "soft",
        blendWidth: params.blendWidth ?? 6,
        connectRegions: params.connectRegions ?? true,
        addFeatures: params.addFeatures,
      }),
  },
  drunkard: {
    name: "Drunkard's Walk",
    description: "Simple random walk",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "simple",
        fillPercentage: params.fillPercentage,
      }),
  },
  "drunkard-weighted": {
    name: "Weighted Walk",
    description: "Biased towards unexplored areas",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "weighted",
        fillPercentage: params.fillPercentage,
      }),
  },
  "drunkard-multi": {
    name: "Multi Walker",
    description: "Multiple simultaneous walkers",
    category: "Random Walk",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "classic", "dungeon", "simple"],
    generate: (size, params) =>
      generateDrunkardWalk(size, {
        variant: "multiple",
        fillPercentage: params.fillPercentage,
        numWalkers: params.numWalkers,
      }),
  },
  maze: {
    name: "Maze (Backtracking)",
    description: "Deep, winding passages",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "backtracking",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  "maze-prims": {
    name: "Maze (Prim's)",
    description: "Shorter dead ends",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "prims",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  "maze-division": {
    name: "Maze (Division)",
    description: "Grid-like recursive division",
    category: "Maze",
    defaultStyle: "parchment",
    availableStyles: ["parchment", "maze", "simple"],
    generate: (size, params) =>
      generateMaze(size, {
        algorithm: "division",
        addStartEnd: params.addStartEnd,
        loopChance: params.loopChance,
        openness: params.openness,
      }),
  },
  perlin: {
    name: "Perlin Island",
    description: "Island terrain with Perlin noise",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size, params) =>
      generatePerlin(size, {
        scale: params.scale,
        octaves: params.octaves,
        persistence: params.persistence,
        lacunarity: params.lacunarity,
        waterLevel: params.waterLevel,
        sandLevel: params.sandLevel,
        grassLevel: params.grassLevel,
        forestLevel: params.forestLevel,
        islandMode: params.islandMode,
        islandFalloff: params.islandFalloff,
        erosionIterations: params.erosionIterations,
      }),
  },
  "perlin-continent": {
    name: "Perlin Continent",
    description: "Large-scale terrain",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size, params) =>
      generatePerlin(size, {
        scale: params.scale,
        octaves: params.octaves,
        persistence: params.persistence,
        lacunarity: params.lacunarity,
        waterLevel: params.waterLevel,
        sandLevel: params.sandLevel,
        grassLevel: params.grassLevel,
        forestLevel: params.forestLevel,
        islandMode: params.islandMode,
        islandFalloff: params.islandFalloff,
        erosionIterations: params.erosionIterations,
      }),
  },
};

const CATEGORIES = ["Dungeon", "Hybrid", "Random Walk", "Maze", "Terrain"];

function parseUrlState(): {
  generator?: GeneratorType;
  size?: number;
  style?: RenderStyle;
  seed?: number;
  params?: Partial<GeneratorParams>;
} {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const result: ReturnType<typeof parseUrlState> = {};

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

function buildUrl(
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
  });
  const animationRef = useRef<number | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>();

  const currentConfig = GENERATORS[generatorType];

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
      const grid = config.generate(size, params);
      const endTime = performance.now();
      setGenerationTime(endTime - startTime);
      setCurrentGrid(grid);
      return grid;
    } finally {
      // Restore original Math.random
      Math.random = originalRandom;
    }
  }, [generatorType, size, params, seed]);

  const handlePresetSelect = useCallback((preset: typeof PRESETS[number]) => {
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

        drawGrid(ctx, partialGrid, canvas.width, canvas.height, {
          style,
          showGrid: renderParams.showGrid,
        });
      } else {
        drawGrid(ctx, grid, canvas.width, canvas.height, {
          style,
          showGrid: renderParams.showGrid,
        });
      }
    },
    [style, renderParams.showGrid]
  );

  const animateReveal = useCallback(
    (grid: Grid) => {
      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const duration = 800; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        draw(grid, easedProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [draw]
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Generate new grid when generator, size, params, or seed change
  useEffect(() => {
    if (!isInitialized) return;

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

  // Update URL when state changes
  useEffect(() => {
    if (!isInitialized) return;

    const url = buildUrl(generatorType, size, style, seed, params);
    window.history.replaceState({}, "", url);
  }, [generatorType, size, style, seed, params, isInitialized]);

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

  const handleCopyUrl = () => {
    const url = buildUrl(generatorType, size, style, seed, params);
    navigator.clipboard.writeText(url);
  };

  return (
    <div className={styles.fullscreen}>
      <ErrorBoundary>
        <MapCanvas canvasRef={canvasRef} width={size * 44} height={size * 44} />

        <div className={styles.controls}>
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

          <div className={styles.panel}>
            <SeedControl
              seed={seed}
              onSeedChange={setSeed}
              onRandomize={handleRegenerate}
              onCopyUrl={handleCopyUrl}
            />
          </div>

          <div className={styles.panel}>
            <ParameterControls
              generatorType={generatorType}
              params={params}
              onChange={setParams}
            />
          </div>

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
