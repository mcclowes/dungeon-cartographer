import { describe, it, expect } from "vitest";
import {
  createSeededRandom,
  randomItem,
  randomInt,
  shuffle,
  weightedRandom,
  withSeededRandom,
} from "../random";

describe("createSeededRandom", () => {
  it("produces deterministic output with same seed", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);

    const values1 = [rng1(), rng1(), rng1()];
    const values2 = [rng2(), rng2(), rng2()];

    expect(values1).toEqual(values2);
  });

  it("produces different output with different seeds", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(54321);

    expect(rng1()).not.toEqual(rng2());
  });

  it("produces values between 0 and 1", () => {
    const rng = createSeededRandom(42);

    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("uses random seed when no seed provided", () => {
    const rng1 = createSeededRandom();
    const rng2 = createSeededRandom();

    // Very unlikely to be equal with random seeds
    const values1 = [rng1(), rng1(), rng1()];
    const values2 = [rng2(), rng2(), rng2()];

    expect(values1).not.toEqual(values2);
  });
});

describe("randomItem", () => {
  it("returns an item from the list", () => {
    const items = ["a", "b", "c", "d"];

    for (let i = 0; i < 50; i++) {
      const result = randomItem(items);
      expect(items).toContain(result);
    }
  });

  it("returns the only item in single-element list", () => {
    const items = ["only"];
    expect(randomItem(items)).toBe("only");
  });
});

describe("randomInt", () => {
  it("returns integers within range", () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(10, 5);
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it("uses 0 as default min", () => {
    for (let i = 0; i < 50; i++) {
      const result = randomInt(5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(5);
    }
  });

  it("returns exact value when min equals max", () => {
    expect(randomInt(7, 7)).toBe(7);
  });
});

describe("shuffle", () => {
  it("returns the same array (mutates in place)", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });

  it("preserves all elements", () => {
    const original = [1, 2, 3, 4, 5];
    const arr = [...original];
    shuffle(arr);

    expect(arr.sort()).toEqual(original.sort());
  });

  it("maintains array length", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    shuffle(arr);
    expect(arr.length).toBe(10);
  });

  it("handles empty array", () => {
    const arr: number[] = [];
    expect(shuffle(arr)).toEqual([]);
  });

  it("handles single element array", () => {
    const arr = [42];
    expect(shuffle(arr)).toEqual([42]);
  });
});

describe("weightedRandom", () => {
  it("returns item from the list", () => {
    const items = ["a", "b", "c"];
    const weights = [1, 1, 1];

    for (let i = 0; i < 50; i++) {
      const result = weightedRandom(items, weights);
      expect(items).toContain(result);
    }
  });

  it("heavily favors high-weight items", () => {
    const items = ["rare", "common"];
    const weights = [1, 99];

    let commonCount = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      if (weightedRandom(items, weights) === "common") {
        commonCount++;
      }
    }

    // Should be common most of the time
    expect(commonCount).toBeGreaterThan(iterations * 0.9);
  });

  it("returns first item when weights are all zero", () => {
    const items = ["a", "b", "c"];
    const weights = [0, 0, 0];

    // When all weights are zero, random * 0 = 0, so first item with weight >= 0 triggers
    expect(weightedRandom(items, weights)).toBe("a");
  });
});

describe("withSeededRandom", () => {
  it("uses seeded random within function", () => {
    const result1 = withSeededRandom(42, () => {
      return [Math.random(), Math.random(), Math.random()];
    });

    const result2 = withSeededRandom(42, () => {
      return [Math.random(), Math.random(), Math.random()];
    });

    expect(result1).toEqual(result2);
  });

  it("restores original Math.random after execution", () => {
    const originalRandom = Math.random;

    withSeededRandom(42, () => {
      // Do something
    });

    expect(Math.random).toBe(originalRandom);
  });

  it("restores Math.random even if function throws", () => {
    const originalRandom = Math.random;

    expect(() => {
      withSeededRandom(42, () => {
        throw new Error("test error");
      });
    }).toThrow("test error");

    expect(Math.random).toBe(originalRandom);
  });

  it("skips seeding when seed is undefined", () => {
    const originalRandom = Math.random;

    withSeededRandom(undefined, () => {
      // Should use original Math.random
    });

    expect(Math.random).toBe(originalRandom);
  });

  it("returns function result", () => {
    const result = withSeededRandom(42, () => {
      return "hello world";
    });

    expect(result).toBe("hello world");
  });
});
