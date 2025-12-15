"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  generateBSP,
  generateCave,
  generateDrunkardWalk,
  generateMaze,
  generatePerlin,
  generateWFC,
  type Grid,
} from "dungeon-cartographer";
import { drawGrid, type RenderStyle } from "dungeon-cartographer/render";

type GeneratorType =
  | "bsp"
  | "cave"
  | "drunkard"
  | "drunkard-weighted"
  | "drunkard-multi"
  | "maze"
  | "maze-prims"
  | "maze-division"
  | "perlin"
  | "perlin-continent"
  | "wfc";

interface GeneratorConfig {
  name: string;
  description: string;
  category: string;
  defaultStyle: RenderStyle;
  availableStyles: RenderStyle[];
  generate: (size: number) => Grid;
}

const GENERATORS: Record<GeneratorType, GeneratorConfig> = {
  bsp: {
    name: "BSP Dungeon",
    description: "Binary Space Partitioning rooms & corridors",
    category: "Dungeon",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateBSP(size),
  },
  cave: {
    name: "Cellular Automata",
    description: "Organic cave-like structures",
    category: "Dungeon",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateCave(size),
  },
  wfc: {
    name: "Wave Function Collapse",
    description: "Constraint-based procedural generation",
    category: "Dungeon",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateWFC(size),
  },
  drunkard: {
    name: "Drunkard's Walk",
    description: "Simple random walk",
    category: "Random Walk",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateDrunkardWalk(size, { variant: "simple" }),
  },
  "drunkard-weighted": {
    name: "Weighted Walk",
    description: "Biased towards unexplored areas",
    category: "Random Walk",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateDrunkardWalk(size, { variant: "weighted" }),
  },
  "drunkard-multi": {
    name: "Multi Walker",
    description: "Multiple simultaneous walkers",
    category: "Random Walk",
    defaultStyle: "classic",
    availableStyles: ["classic", "parchment", "dungeon", "simple"],
    generate: (size) => generateDrunkardWalk(size, { variant: "multiple", numWalkers: 6 }),
  },
  maze: {
    name: "Maze (Backtracking)",
    description: "Deep, winding passages",
    category: "Maze",
    defaultStyle: "maze",
    availableStyles: ["maze", "parchment", "simple"],
    generate: (size) => generateMaze(size, { algorithm: "backtracking" }),
  },
  "maze-prims": {
    name: "Maze (Prim's)",
    description: "Shorter dead ends",
    category: "Maze",
    defaultStyle: "maze",
    availableStyles: ["maze", "parchment", "simple"],
    generate: (size) => generateMaze(size, { algorithm: "prims" }),
  },
  "maze-division": {
    name: "Maze (Division)",
    description: "Grid-like recursive division",
    category: "Maze",
    defaultStyle: "maze",
    availableStyles: ["maze", "parchment", "simple"],
    generate: (size) => generateMaze(size, { algorithm: "division" }),
  },
  perlin: {
    name: "Perlin Island",
    description: "Island terrain with Perlin noise",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size) => generatePerlin(size, { islandMode: true }),
  },
  "perlin-continent": {
    name: "Perlin Continent",
    description: "Large-scale terrain",
    category: "Terrain",
    defaultStyle: "terrain",
    availableStyles: ["terrain", "simple"],
    generate: (size) => generatePerlin(size, { islandMode: false, scale: 0.04 }),
  },
};

const CATEGORIES = ["Dungeon", "Random Walk", "Maze", "Terrain"];

const STYLE_LABELS: Record<RenderStyle, string> = {
  classic: "Classic",
  parchment: "Parchment",
  dungeon: "Dungeon",
  terrain: "Terrain",
  maze: "Maze",
  simple: "Simple",
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [generatorType, setGeneratorType] = useState<GeneratorType>("bsp");
  const [size, setSize] = useState(32);
  const [style, setStyle] = useState<RenderStyle>("classic");
  const [currentGrid, setCurrentGrid] = useState<Grid | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const currentConfig = GENERATORS[generatorType];

  // Update style when generator changes
  useEffect(() => {
    if (!currentConfig.availableStyles.includes(style)) {
      setStyle(currentConfig.defaultStyle);
    }
  }, [generatorType, currentConfig, style]);

  const generateGrid = useCallback(() => {
    const config = GENERATORS[generatorType];
    const grid = config.generate(size);
    setCurrentGrid(grid);
    return grid;
  }, [generatorType, size]);

  const draw = useCallback((grid: Grid) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx, grid, canvas.width, canvas.height, { style });
  }, [style]);

  // Generate new grid when generator or size changes
  useEffect(() => {
    const grid = generateGrid();
    draw(grid);
  }, [generatorType, size]);

  // Redraw when style changes (same grid)
  useEffect(() => {
    if (currentGrid) {
      draw(currentGrid);
    }
  }, [style, currentGrid, draw]);

  const handleRegenerate = () => {
    const grid = generateGrid();
    draw(grid);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(0.5, z * delta), 4));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ margin: "0 0 20px", fontSize: 24 }}>
        Dungeon Cartographer
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
        {CATEGORIES.map((category) => (
          <div
            key={category}
            style={{
              background: "#f5f5f5",
              borderRadius: 8,
              padding: 12,
              minWidth: 180,
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {category}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(GENERATORS)
                .filter(([_, config]) => config.category === category)
                .map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setGeneratorType(type as GeneratorType)}
                    style={{
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 4,
                      background: generatorType === type ? "#4a90d9" : "#fff",
                      color: generatorType === type ? "#fff" : "#333",
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {config.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 20,
          padding: "12px 16px",
          background: "#e8f4fd",
          borderRadius: 8,
          borderLeft: "4px solid #4a90d9",
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600 }}>{currentConfig.name}</span>
          <span style={{ color: "#666", marginLeft: 8 }}>
            — {currentConfig.description}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 14 }}>
            Size:
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ marginLeft: 6, padding: 4 }}
            >
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={48}>48</option>
              <option value={64}>64</option>
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            Style:
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as RenderStyle)}
              style={{ marginLeft: 6, padding: 4 }}
            >
              {currentConfig.availableStyles.map((s) => (
                <option key={s} value={s}>
                  {STYLE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleRegenerate}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 6,
              background: "#4a90d9",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Regenerate
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
          style={{
            padding: "6px 12px",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          + Zoom In
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}
          style={{
            padding: "6px 12px",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          - Zoom Out
        </button>
        <button
          onClick={resetView}
          style={{
            padding: "6px 12px",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Reset View
        </button>
        <span style={{ fontSize: 13, color: "#666" }}>
          {Math.round(zoom * 100)}% — Scroll to zoom, drag to pan
        </span>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: "inline-block",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: isPanning ? "grabbing" : "grab",
        }}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={700}
          style={{
            display: "block",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
}
