/** Pick a random item from an array */
export function randomItem<T>(list: T[]): T {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

/** Generate a random integer between min and max (inclusive) */
export function randomInt(max: number, min = 0): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/** Shuffle an array in place using Fisher-Yates algorithm */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** Weighted random selection */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}
