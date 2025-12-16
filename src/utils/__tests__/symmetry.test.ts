import { describe, it, expect } from "vitest";
import {
  applySymmetry,
  hasHorizontalSymmetry,
  hasVerticalSymmetry,
  hasRotational2Symmetry,
  detectSymmetry,
} from "../symmetry";
import { generateBSP } from "../../generators/bsp";
import type { Grid } from "../../types";

// Helper to create a simple asymmetric grid
function createAsymmetricGrid(): Grid {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

// Helper to create a horizontally symmetric grid
function createHSymmetricGrid(): Grid {
  return [
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [1, 0, 0, 1],
  ];
}

// Helper to create a vertically symmetric grid
function createVSymmetricGrid(): Grid {
  return [
    [1, 0, 0, 1],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [1, 0, 0, 1],
  ];
}

describe("Symmetry Utilities", () => {
  describe("applySymmetry", () => {
    it("returns copy for 'none' mode", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "none");

      expect(result).toEqual(grid);
      expect(result).not.toBe(grid); // Should be a new array
    });

    it("applies horizontal symmetry correctly", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "horizontal");

      // Left half should be mirrored to right
      expect(result[0][0]).toBe(result[0][3]);
      expect(result[0][1]).toBe(result[0][2]);
      expect(result[1][0]).toBe(result[1][3]);
      expect(result[1][1]).toBe(result[1][2]);

      // Result should have horizontal symmetry
      expect(hasHorizontalSymmetry(result)).toBe(true);
    });

    it("applies vertical symmetry correctly", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "vertical");

      // Top half should be mirrored to bottom
      expect(result[0][0]).toBe(result[3][0]);
      expect(result[0][1]).toBe(result[3][1]);
      expect(result[1][0]).toBe(result[2][0]);

      // Result should have vertical symmetry
      expect(hasVerticalSymmetry(result)).toBe(true);
    });

    it("applies both symmetry correctly", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "both");

      // Result should have both symmetries
      expect(hasHorizontalSymmetry(result)).toBe(true);
      expect(hasVerticalSymmetry(result)).toBe(true);
    });

    it("applies 180-degree rotational symmetry", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "rotational-2");

      // Result should have rotational symmetry
      expect(hasRotational2Symmetry(result)).toBe(true);
    });

    it("applies 4-fold rotational symmetry", () => {
      const grid = createAsymmetricGrid();
      const result = applySymmetry(grid, "rotational-4");

      // For square grid, corners should all be the same
      expect(result[0][0]).toBe(result[0][3]);
      expect(result[0][0]).toBe(result[3][0]);
      expect(result[0][0]).toBe(result[3][3]);
    });

    it("works with generated dungeons", () => {
      const grid = generateBSP(32);
      const symmetric = applySymmetry(grid, "horizontal");

      expect(hasHorizontalSymmetry(symmetric)).toBe(true);
    });
  });

  describe("hasHorizontalSymmetry", () => {
    it("returns true for horizontally symmetric grid", () => {
      const grid = createHSymmetricGrid();
      expect(hasHorizontalSymmetry(grid)).toBe(true);
    });

    it("returns false for asymmetric grid", () => {
      const grid = createAsymmetricGrid();
      expect(hasHorizontalSymmetry(grid)).toBe(false);
    });
  });

  describe("hasVerticalSymmetry", () => {
    it("returns true for vertically symmetric grid", () => {
      const grid = createVSymmetricGrid();
      expect(hasVerticalSymmetry(grid)).toBe(true);
    });

    it("returns false for asymmetric grid", () => {
      const grid = createAsymmetricGrid();
      expect(hasVerticalSymmetry(grid)).toBe(false);
    });
  });

  describe("hasRotational2Symmetry", () => {
    it("returns true for 180-degree symmetric grid", () => {
      const grid: Grid = [
        [1, 0, 0, 1],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [1, 0, 0, 1],
      ];
      expect(hasRotational2Symmetry(grid)).toBe(true);
    });

    it("returns false for asymmetric grid", () => {
      const grid = createAsymmetricGrid();
      expect(hasRotational2Symmetry(grid)).toBe(false);
    });
  });

  describe("detectSymmetry", () => {
    it("detects no symmetry in asymmetric grid", () => {
      const grid = createAsymmetricGrid();
      const modes = detectSymmetry(grid);

      expect(modes).toContain("none");
    });

    it("detects horizontal symmetry", () => {
      const grid = applySymmetry(createAsymmetricGrid(), "horizontal");
      const modes = detectSymmetry(grid);

      expect(modes).toContain("horizontal");
    });

    it("detects vertical symmetry", () => {
      const grid = applySymmetry(createAsymmetricGrid(), "vertical");
      const modes = detectSymmetry(grid);

      expect(modes).toContain("vertical");
    });

    it("detects 'both' when horizontal and vertical present", () => {
      const grid = applySymmetry(createAsymmetricGrid(), "both");
      const modes = detectSymmetry(grid);

      expect(modes).toContain("horizontal");
      expect(modes).toContain("vertical");
      expect(modes).toContain("both");
    });
  });

  describe("Edge Cases", () => {
    it("handles odd-sized grids", () => {
      const grid: Grid = [
        [1, 0, 0, 0, 1],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [1, 0, 0, 0, 1],
      ];

      expect(hasHorizontalSymmetry(grid)).toBe(true);
      expect(hasVerticalSymmetry(grid)).toBe(true);
    });

    it("handles 1x1 grid", () => {
      const grid: Grid = [[1]];

      expect(hasHorizontalSymmetry(grid)).toBe(true);
      expect(hasVerticalSymmetry(grid)).toBe(true);
    });

    it("handles non-square grids for rotational-4", () => {
      const grid: Grid = [
        [1, 0, 0, 1],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
      ];

      // Should fall back to 'both' symmetry for non-square
      const result = applySymmetry(grid, "rotational-4");

      expect(hasHorizontalSymmetry(result)).toBe(true);
      expect(hasVerticalSymmetry(result)).toBe(true);
    });
  });
});
