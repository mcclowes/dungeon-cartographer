import { describe, it, expect } from "vitest";
import {
  generateRoomShape,
  createRectangleShape,
  drawRoomShape,
  getShapeTiles,
  getShapeCenter,
  generateCompositeShape,
  generateTemplateShape,
  generateCellularShape,
  generatePolygonShape,
  createLShape,
  createTShape,
  createCrossShape,
  TEMPLATE_NAMES,
  RoomShapeType,
} from "../index";
import { createGrid } from "../../utils/grid";
import { TileType } from "../../types";
import type { Rect } from "../../types";

describe("Room Shapes", () => {
  const bounds: Rect = { x: 5, y: 5, width: 10, height: 10 };

  describe("Rectangle Shape", () => {
    it("creates a rectangle shape with correct bounding box", () => {
      const shape = createRectangleShape(bounds);
      expect(shape.type).toBe(RoomShapeType.RECTANGLE);
      expect(shape.boundingBox).toEqual(bounds);
      expect(shape.rect).toEqual(bounds);
    });

    it("returns correct tiles for rectangle", () => {
      const shape = createRectangleShape(bounds);
      const tiles = getShapeTiles(shape);
      expect(tiles.length).toBe(bounds.width * bounds.height);
    });

    it("calculates center correctly", () => {
      const shape = createRectangleShape(bounds);
      const center = getShapeCenter(shape);
      expect(center.x).toBe(10); // 5 + 10/2
      expect(center.y).toBe(10); // 5 + 10/2
    });
  });

  describe("Composite Shapes", () => {
    it("creates L-shaped room", () => {
      const shape = createLShape(bounds);
      expect(shape.type).toBe(RoomShapeType.COMPOSITE);
      expect(shape.variant).toBe("L");
      expect(shape.rects.length).toBe(2);
    });

    it("creates T-shaped room", () => {
      const shape = createTShape(bounds);
      expect(shape.type).toBe(RoomShapeType.COMPOSITE);
      expect(shape.variant).toBe("T");
      expect(shape.rects.length).toBe(2);
    });

    it("creates cross-shaped room", () => {
      const shape = createCrossShape(bounds);
      expect(shape.type).toBe(RoomShapeType.COMPOSITE);
      expect(shape.variant).toBe("CROSS");
      expect(shape.rects.length).toBe(2);
    });

    it("generateCompositeShape creates valid shape", () => {
      const shape = generateCompositeShape(bounds);
      expect(shape.type).toBe(RoomShapeType.COMPOSITE);
      expect(shape.rects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Template Shapes", () => {
    it("has available templates", () => {
      expect(TEMPLATE_NAMES.length).toBeGreaterThan(0);
    });

    it("creates template shape", () => {
      const shape = generateTemplateShape(bounds);
      expect(shape.type).toBe(RoomShapeType.TEMPLATE);
      expect(shape.mask).toBeDefined();
      expect(shape.templateName).toBeDefined();
    });

    it("template mask has correct dimensions", () => {
      const shape = generateTemplateShape(bounds);
      expect(shape.mask.length).toBe(bounds.height);
      expect(shape.mask[0].length).toBe(bounds.width);
    });
  });

  describe("Cellular Shapes", () => {
    it("creates cellular shape", () => {
      const shape = generateCellularShape(bounds);
      expect(shape.type).toBe(RoomShapeType.CELLULAR);
      expect(shape.tiles).toBeDefined();
      expect(shape.tiles.length).toBeGreaterThan(0);
    });

    it("cellular tiles are within bounds", () => {
      const shape = generateCellularShape(bounds);
      for (const tile of shape.tiles) {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.x).toBeLessThan(bounds.width);
        expect(tile.y).toBeGreaterThanOrEqual(0);
        expect(tile.y).toBeLessThan(bounds.height);
      }
    });
  });

  describe("Polygon Shapes", () => {
    it("creates hexagon shape", () => {
      const shape = generatePolygonShape(bounds, "hexagon");
      expect(shape.type).toBe(RoomShapeType.POLYGON);
      expect(shape.variant).toBe("hexagon");
      expect(shape.vertices.length).toBe(6);
    });

    it("creates octagon shape", () => {
      const shape = generatePolygonShape(bounds, "octagon");
      expect(shape.type).toBe(RoomShapeType.POLYGON);
      expect(shape.variant).toBe("octagon");
      expect(shape.vertices.length).toBe(8);
    });

    it("creates circle shape", () => {
      const shape = generatePolygonShape(bounds, "circle");
      expect(shape.type).toBe(RoomShapeType.POLYGON);
      expect(shape.variant).toBe("circle");
      expect(shape.vertices.length).toBe(16); // Default segments
    });
  });

  describe("Shape Factory", () => {
    it("generates rectangle by default", () => {
      const shape = generateRoomShape(bounds);
      expect(shape.type).toBe(RoomShapeType.RECTANGLE);
    });

    it("respects allowedShapes option", () => {
      const shape = generateRoomShape(bounds, {
        allowedShapes: [RoomShapeType.COMPOSITE],
      });
      expect(shape.type).toBe(RoomShapeType.COMPOSITE);
    });

    it("falls back to rectangle for small bounds", () => {
      const smallBounds: Rect = { x: 0, y: 0, width: 3, height: 3 };
      const shape = generateRoomShape(smallBounds, {
        allowedShapes: [RoomShapeType.CELLULAR],
        minShapeSize: 5,
      });
      expect(shape.type).toBe(RoomShapeType.RECTANGLE);
    });
  });

  describe("Drawing Shapes", () => {
    it("draws rectangle shape on grid", () => {
      const grid = createGrid(20, 20, TileType.WALL);
      const shape = createRectangleShape({ x: 2, y: 2, width: 5, height: 5 });

      drawRoomShape(grid, shape);

      // Check that floor tiles are placed
      expect(grid[2][2]).toBe(TileType.FLOOR);
      expect(grid[6][6]).toBe(TileType.FLOOR);
      // Check that outside is still wall
      expect(grid[0][0]).toBe(TileType.WALL);
      expect(grid[10][10]).toBe(TileType.WALL);
    });

    it("draws composite shape on grid", () => {
      const grid = createGrid(20, 20, TileType.WALL);
      const shape = generateCompositeShape({ x: 2, y: 2, width: 10, height: 10 });

      drawRoomShape(grid, shape);

      // At least some floor tiles should exist
      let floorCount = 0;
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (grid[y][x] === TileType.FLOOR) floorCount++;
        }
      }
      expect(floorCount).toBeGreaterThan(0);
    });
  });
});
