import { describe, it, expect } from "vitest";
import { generateThemedDungeon, getThemeInfo } from "../generator";
import { getTheme, getThemeNames } from "../configs";
import { TileType } from "../../types";
import type { ThemeName } from "../types";

describe("Theme System", () => {
  describe("Theme Configs", () => {
    it("has all expected themes", () => {
      const names = getThemeNames();
      expect(names).toContain("crypt");
      expect(names).toContain("castle");
      expect(names).toContain("cave");
      expect(names).toContain("temple");
      expect(names).toContain("prison");
      expect(names).toContain("sewer");
      expect(names).toContain("mine");
      expect(names).toContain("library");
    });

    it("all themes have required properties", () => {
      for (const name of getThemeNames()) {
        const theme = getTheme(name);
        expect(theme.name).toBe(name);
        expect(theme.displayName).toBeDefined();
        expect(theme.description).toBeDefined();
        expect(theme.generator).toBeDefined();
        expect(theme.postProcess).toBeDefined();
        expect(theme.prefabs).toBeDefined();
        expect(theme.features).toBeDefined();
      }
    });

    it("getTheme returns correct theme", () => {
      const crypt = getTheme("crypt");
      expect(crypt.name).toBe("crypt");
      expect(crypt.generator).toBe("bsp");
    });
  });

  describe("generateThemedDungeon", () => {
    it("generates dungeon with correct size", () => {
      const result = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 12345,
      });

      expect(result.grid.length).toBe(32);
      expect(result.grid[0].length).toBe(32);
    });

    it("returns theme name in result", () => {
      const result = generateThemedDungeon({
        size: 32,
        theme: "castle",
        seed: 12345,
      });

      expect(result.theme).toBe("castle");
    });

    it("returns seed in result", () => {
      const result = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 99999,
      });

      expect(result.seed).toBe(99999);
    });

    it("generates deterministic results with same seed", () => {
      const result1 = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 12345,
      });

      const result2 = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 12345,
      });

      expect(result1.grid).toEqual(result2.grid);
    });

    it("generates different results with different seeds", () => {
      const result1 = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 11111,
      });

      const result2 = generateThemedDungeon({
        size: 32,
        theme: "crypt",
        seed: 22222,
      });

      expect(result1.grid).not.toEqual(result2.grid);
    });

    it("includes metadata", () => {
      const result = generateThemedDungeon({
        size: 48,
        theme: "temple",
        seed: 12345,
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.generator).toBeDefined();
      expect(typeof result.metadata.prefabsPlaced).toBe("number");
      expect(typeof result.metadata.featuresAdded).toBe("number");
    });

    it("throws for unknown theme", () => {
      expect(() => {
        generateThemedDungeon({
          size: 32,
          theme: "nonexistent" as ThemeName,
        });
      }).toThrow("Unknown theme");
    });

    // Test each theme generates successfully
    const allThemes: ThemeName[] = [
      "crypt",
      "castle",
      "cave",
      "temple",
      "prison",
      "sewer",
      "mine",
      "library",
    ];

    for (const themeName of allThemes) {
      it(`generates ${themeName} theme successfully`, () => {
        const result = generateThemedDungeon({
          size: 48,
          theme: themeName,
          seed: 12345,
        });

        expect(result.grid.length).toBe(48);
        expect(result.theme).toBe(themeName);

        // Should have some walkable tiles
        let walkableCount = 0;
        for (const row of result.grid) {
          for (const tile of row) {
            if (tile !== TileType.WALL) walkableCount++;
          }
        }
        expect(walkableCount).toBeGreaterThan(0);
      });
    }
  });

  describe("Theme Features", () => {
    it("crypt theme adds doors", () => {
      const result = generateThemedDungeon({
        size: 48,
        theme: "crypt",
        seed: 12345,
      });

      let doorCount = 0;
      for (const row of result.grid) {
        for (const tile of row) {
          if (tile === TileType.DOOR) doorCount++;
        }
      }

      expect(doorCount).toBeGreaterThan(0);
    });

    it("cave theme adds water", () => {
      const result = generateThemedDungeon({
        size: 48,
        theme: "cave",
        seed: 12345,
      });

      let waterCount = 0;
      for (const row of result.grid) {
        for (const tile of row) {
          if (tile === TileType.WATER) waterCount++;
        }
      }

      expect(waterCount).toBeGreaterThan(0);
    });

    it("temple theme adds altars and statues", () => {
      const result = generateThemedDungeon({
        size: 64,
        theme: "temple",
        seed: 12345,
      });

      let altarCount = 0;
      let statueCount = 0;
      for (const row of result.grid) {
        for (const tile of row) {
          if (tile === TileType.ALTAR) altarCount++;
          if (tile === TileType.STATUE) statueCount++;
        }
      }

      // Should have at least some decorations
      expect(altarCount + statueCount).toBeGreaterThan(0);
    });

    it("library theme adds furniture", () => {
      const result = generateThemedDungeon({
        size: 64,
        theme: "library",
        seed: 12345,
      });

      let furnitureCount = 0;
      const furnitureTypes = [
        TileType.TABLE,
        TileType.CHAIR,
        TileType.BOOKSHELF,
        TileType.CRATE,
        TileType.BARREL,
      ];

      for (const row of result.grid) {
        for (const tile of row) {
          if (furnitureTypes.includes(tile)) furnitureCount++;
        }
      }

      expect(furnitureCount).toBeGreaterThan(0);
    });
  });

  describe("Option Overrides", () => {
    it("can override prefab settings", () => {
      const result = generateThemedDungeon({
        size: 64,
        theme: "crypt",
        seed: 12345,
        prefabs: {
          enabled: false,
        },
      });

      expect(result.metadata.prefabsPlaced).toBe(0);
    });

    it("can override feature settings", () => {
      const result = generateThemedDungeon({
        size: 48,
        theme: "crypt",
        seed: 12345,
        features: {
          treasure: 0,
          traps: 0,
        },
      });

      // Should have fewer features
      let treasureCount = 0;
      let trapCount = 0;
      for (const row of result.grid) {
        for (const tile of row) {
          if (tile === TileType.TREASURE || tile === TileType.CHEST) treasureCount++;
          if (tile === TileType.TRAP) trapCount++;
        }
      }

      expect(treasureCount).toBe(0);
      expect(trapCount).toBe(0);
    });
  });

  describe("getThemeInfo", () => {
    it("returns info for all themes", () => {
      const info = getThemeInfo();

      expect(info.length).toBe(8);

      for (const theme of info) {
        expect(theme.name).toBeDefined();
        expect(theme.displayName).toBeDefined();
        expect(theme.description).toBeDefined();
      }
    });
  });
});
