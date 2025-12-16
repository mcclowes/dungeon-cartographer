import type { Grid } from "../types";

/**
 * Symmetry modes available for dungeon generation
 */
export type SymmetryMode =
  | "none"
  | "horizontal"
  | "vertical"
  | "both"
  | "rotational-2"
  | "rotational-4";

/**
 * Apply horizontal symmetry (mirror left-right)
 * Generates left half and mirrors to right
 */
function applyHorizontalSymmetry(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const midX = Math.floor(width / 2);

  const result = grid.map((row) => [...row]);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < midX; x++) {
      const mirrorX = width - 1 - x;
      result[y][mirrorX] = result[y][x];
    }
  }

  return result;
}

/**
 * Apply vertical symmetry (mirror top-bottom)
 * Generates top half and mirrors to bottom
 */
function applyVerticalSymmetry(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const midY = Math.floor(height / 2);

  const result = grid.map((row) => [...row]);

  for (let y = 0; y < midY; y++) {
    const mirrorY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      result[mirrorY][x] = result[y][x];
    }
  }

  return result;
}

/**
 * Apply both horizontal and vertical symmetry (4-way mirror)
 * Generates top-left quadrant and mirrors to other quadrants
 */
function applyBothSymmetry(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  const result = grid.map((row) => [...row]);

  // First, mirror horizontally within top half
  for (let y = 0; y < midY; y++) {
    for (let x = 0; x < midX; x++) {
      const mirrorX = width - 1 - x;
      result[y][mirrorX] = result[y][x];
    }
  }

  // Then mirror the entire top half to bottom
  for (let y = 0; y < midY; y++) {
    const mirrorY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      result[mirrorY][x] = result[y][x];
    }
  }

  return result;
}

/**
 * Apply 180-degree rotational symmetry
 * Point at (x, y) is same as point at (width-1-x, height-1-y)
 */
function applyRotational2Symmetry(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  const result = grid.map((row) => [...row]);

  // Copy top half rotated 180 degrees to bottom half
  const midY = Math.floor(height / 2);

  for (let y = 0; y < midY; y++) {
    for (let x = 0; x < width; x++) {
      const rotX = width - 1 - x;
      const rotY = height - 1 - y;
      result[rotY][rotX] = result[y][x];
    }
  }

  return result;
}

/**
 * Apply 90-degree rotational symmetry (4-fold rotation)
 * Uses top-left quadrant as source, rotates to other quadrants
 */
function applyRotational4Symmetry(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // This only works well for square grids
  if (height !== width) {
    // Fall back to both symmetry for non-square grids
    return applyBothSymmetry(grid);
  }

  const result = grid.map((row) => [...row]);
  const mid = Math.floor(height / 2);

  // Use top-left quadrant as source
  for (let y = 0; y < mid; y++) {
    for (let x = 0; x < mid; x++) {
      const tile = result[y][x];

      // Top-right: rotate 90° clockwise
      result[x][height - 1 - y] = tile;

      // Bottom-right: rotate 180°
      result[height - 1 - y][height - 1 - x] = tile;

      // Bottom-left: rotate 270° (90° counter-clockwise)
      result[height - 1 - x][y] = tile;
    }
  }

  return result;
}

/**
 * Apply symmetry transformation to a grid
 *
 * @param grid - The input grid
 * @param mode - The symmetry mode to apply
 * @returns A new grid with the symmetry applied
 *
 * @example
 * ```ts
 * const grid = generateBSP(32);
 * const symmetricGrid = applySymmetry(grid, "horizontal");
 * ```
 */
export function applySymmetry(grid: Grid, mode: SymmetryMode): Grid {
  switch (mode) {
    case "horizontal":
      return applyHorizontalSymmetry(grid);
    case "vertical":
      return applyVerticalSymmetry(grid);
    case "both":
      return applyBothSymmetry(grid);
    case "rotational-2":
      return applyRotational2Symmetry(grid);
    case "rotational-4":
      return applyRotational4Symmetry(grid);
    case "none":
    default:
      return grid.map((row) => [...row]);
  }
}

/**
 * Check if a grid has horizontal symmetry
 */
export function hasHorizontalSymmetry(grid: Grid): boolean {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const midX = Math.floor(width / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < midX; x++) {
      const mirrorX = width - 1 - x;
      if (grid[y][x] !== grid[y][mirrorX]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a grid has vertical symmetry
 */
export function hasVerticalSymmetry(grid: Grid): boolean {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const midY = Math.floor(height / 2);

  for (let y = 0; y < midY; y++) {
    const mirrorY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      if (grid[y][x] !== grid[mirrorY][x]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a grid has 180-degree rotational symmetry
 */
export function hasRotational2Symmetry(grid: Grid): boolean {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 0; y < Math.ceil(height / 2); y++) {
    for (let x = 0; x < width; x++) {
      const rotX = width - 1 - x;
      const rotY = height - 1 - y;

      // Skip center tile in odd-sized grids
      if (y === rotY && x === rotX) continue;

      if (grid[y][x] !== grid[rotY][rotX]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Detect what symmetry a grid has
 */
export function detectSymmetry(grid: Grid): SymmetryMode[] {
  const modes: SymmetryMode[] = [];

  if (hasHorizontalSymmetry(grid)) {
    modes.push("horizontal");
  }

  if (hasVerticalSymmetry(grid)) {
    modes.push("vertical");
  }

  if (hasRotational2Symmetry(grid)) {
    modes.push("rotational-2");
  }

  // Check for both (implies horizontal + vertical)
  if (modes.includes("horizontal") && modes.includes("vertical")) {
    modes.push("both");
  }

  if (modes.length === 0) {
    modes.push("none");
  }

  return modes;
}
