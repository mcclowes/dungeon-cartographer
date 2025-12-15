"use client";

import { useMemo } from "react";
import type { Grid } from "dungeon-cartographer";
import styles from "./StatsDisplay.module.scss";

interface Props {
  grid: Grid | null;
  generationTime?: number;
}

interface GridStats {
  width: number;
  height: number;
  totalTiles: number;
  floorTiles: number;
  wallTiles: number;
  floorPercentage: number;
  uniqueTileTypes: number;
}

function calculateStats(grid: Grid): GridStats {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const totalTiles = width * height;

  const tileCounts = new Map<number, number>();
  let floorTiles = 0;
  let wallTiles = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      tileCounts.set(tile, (tileCounts.get(tile) ?? 0) + 1);

      // Common floor-like tiles (1, 4 = floor, corridor)
      if (tile === 1 || tile === 4) {
        floorTiles++;
      }
      // Wall tiles (0)
      if (tile === 0) {
        wallTiles++;
      }
    }
  }

  return {
    width,
    height,
    totalTiles,
    floorTiles,
    wallTiles,
    floorPercentage: totalTiles > 0 ? (floorTiles / totalTiles) * 100 : 0,
    uniqueTileTypes: tileCounts.size,
  };
}

export function StatsDisplay({ grid, generationTime }: Props) {
  const stats = useMemo(() => {
    if (!grid) return null;
    return calculateStats(grid);
  }, [grid]);

  if (!stats) return null;

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <span className={styles.label}>Size</span>
        <span className={styles.value}>{stats.width} x {stats.height}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Floor</span>
        <span className={styles.value}>{stats.floorPercentage.toFixed(1)}%</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Tiles</span>
        <span className={styles.value}>{stats.floorTiles} / {stats.totalTiles}</span>
      </div>
      {generationTime !== undefined && (
        <div className={styles.row}>
          <span className={styles.label}>Gen time</span>
          <span className={styles.value}>{generationTime.toFixed(0)}ms</span>
        </div>
      )}
    </div>
  );
}
