import { describe, it, expect } from "vitest";
import {
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  validateGridSize,
  createGrid,
  isInBounds,
  isInBoundsInner,
  countTiles,
  sumInRadius,
  cloneGrid,
} from "../grid";

describe("validateGridSize", () => {
  it("accepts valid sizes", () => {
    expect(() => validateGridSize(10, "test")).not.toThrow();
    expect(() => validateGridSize(MIN_GRID_SIZE, "test")).not.toThrow();
    expect(() => validateGridSize(MAX_GRID_SIZE, "test")).not.toThrow();
  });

  it("rejects non-finite numbers", () => {
    expect(() => validateGridSize(Infinity, "test")).toThrow("must be a finite number");
    expect(() => validateGridSize(NaN, "test")).toThrow("must be a finite number");
  });

  it("rejects non-integers", () => {
    expect(() => validateGridSize(10.5, "test")).toThrow("must be an integer");
  });

  it("rejects sizes below minimum", () => {
    expect(() => validateGridSize(MIN_GRID_SIZE - 1, "test")).toThrow(
      `must be at least ${MIN_GRID_SIZE}`
    );
  });

  it("rejects sizes above maximum", () => {
    expect(() => validateGridSize(MAX_GRID_SIZE + 1, "test")).toThrow(
      `must be at most ${MAX_GRID_SIZE}`
    );
  });

  it("includes generator name in error message", () => {
    expect(() => validateGridSize(1, "myGenerator")).toThrow("myGenerator:");
  });
});

describe("createGrid", () => {
  it("creates grid with correct dimensions", () => {
    const grid = createGrid(5, 3);
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(5);
  });

  it("fills with 0 by default", () => {
    const grid = createGrid(2, 2);
    expect(grid).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("fills with custom value", () => {
    const grid = createGrid(2, 2, 1);
    expect(grid).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });

  it("creates independent rows", () => {
    const grid = createGrid(3, 3, 0);
    grid[0][0] = 1;
    expect(grid[1][0]).toBe(0);
  });
});

describe("isInBounds", () => {
  it("returns true for coordinates within bounds", () => {
    expect(isInBounds(0, 0, 10, 10)).toBe(true);
    expect(isInBounds(5, 5, 10, 10)).toBe(true);
    expect(isInBounds(9, 9, 10, 10)).toBe(true);
  });

  it("returns false for negative coordinates", () => {
    expect(isInBounds(-1, 0, 10, 10)).toBe(false);
    expect(isInBounds(0, -1, 10, 10)).toBe(false);
  });

  it("returns false for coordinates at or beyond bounds", () => {
    expect(isInBounds(10, 5, 10, 10)).toBe(false);
    expect(isInBounds(5, 10, 10, 10)).toBe(false);
  });
});

describe("isInBoundsInner", () => {
  it("returns true for interior coordinates", () => {
    expect(isInBoundsInner(1, 1, 10, 10)).toBe(true);
    expect(isInBoundsInner(5, 5, 10, 10)).toBe(true);
    expect(isInBoundsInner(8, 8, 10, 10)).toBe(true);
  });

  it("returns false for border coordinates", () => {
    expect(isInBoundsInner(0, 5, 10, 10)).toBe(false);
    expect(isInBoundsInner(5, 0, 10, 10)).toBe(false);
    expect(isInBoundsInner(9, 5, 10, 10)).toBe(false);
    expect(isInBoundsInner(5, 9, 10, 10)).toBe(false);
  });

  it("returns false for corners", () => {
    expect(isInBoundsInner(0, 0, 10, 10)).toBe(false);
    expect(isInBoundsInner(9, 9, 10, 10)).toBe(false);
  });
});

describe("countTiles", () => {
  it("counts matching tiles", () => {
    const grid = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 1, 1],
    ];
    expect(countTiles(grid, 1)).toBe(6);
    expect(countTiles(grid, 0)).toBe(3);
  });

  it("returns 0 for no matches", () => {
    const grid = [
      [0, 0],
      [0, 0],
    ];
    expect(countTiles(grid, 1)).toBe(0);
  });

  it("handles empty grid", () => {
    expect(countTiles([], 1)).toBe(0);
  });

  it("handles null grid", () => {
    expect(countTiles(null as unknown as number[][], 1)).toBe(0);
  });
});

describe("sumInRadius", () => {
  it("sums values in radius", () => {
    const grid = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];
    expect(sumInRadius(grid, 1, 1, 1)).toBe(9);
  });

  it("handles edge positions", () => {
    const grid = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];
    expect(sumInRadius(grid, 0, 0, 1)).toBe(4);
  });

  it("handles radius 0", () => {
    const grid = [
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    expect(sumInRadius(grid, 0, 0, 0)).toBe(5);
  });

  it("handles empty grid", () => {
    expect(sumInRadius([], 0, 0, 1)).toBe(0);
  });
});

describe("cloneGrid", () => {
  it("creates independent copy", () => {
    const original = [
      [1, 2],
      [3, 4],
    ];
    const clone = cloneGrid(original);

    clone[0][0] = 99;
    expect(original[0][0]).toBe(1);
  });

  it("preserves values", () => {
    const original = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const clone = cloneGrid(original);

    expect(clone).toEqual(original);
  });

  it("handles empty grid", () => {
    expect(cloneGrid([])).toEqual([]);
  });

  it("handles null grid", () => {
    expect(cloneGrid(null as unknown as number[][])).toEqual([]);
  });
});
