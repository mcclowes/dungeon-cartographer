import type { Grid } from "../types";
import { MazeTile } from "../types";
import { createGrid, isInBounds, shuffle } from "../utils";

export type MazeAlgorithm = "backtracking" | "prims" | "division";

export interface MazeOptions {
  /** Algorithm to use (default: "backtracking") */
  algorithm?: MazeAlgorithm;
  /** Add start/end markers (default: true) */
  addStartEnd?: boolean;
  /** Chance to add loops 0-1 (default: 0) */
  loopChance?: number;
  /** Additional random passage removal 0-1 (default: 0) */
  openness?: number;
}

interface MazeDirection {
  dx: number;
  dy: number;
  wx: number;
  wy: number;
}

const MAZE_DIRECTIONS: MazeDirection[] = [
  { dx: 0, dy: -2, wx: 0, wy: -1 }, // North
  { dx: 0, dy: 2, wx: 0, wy: 1 }, // South
  { dx: 2, dy: 0, wx: 1, wy: 0 }, // East
  { dx: -2, dy: 0, wx: -1, wy: 0 }, // West
];

function recursiveBacktracking(
  grid: Grid,
  startX: number,
  startY: number
): void {
  const width = grid[0].length;
  const height = grid.length;
  const stack = [{ x: startX, y: startY }];

  grid[startY][startX] = MazeTile.PASSAGE;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { x, y } = current;

    const unvisited = shuffle([...MAZE_DIRECTIONS]).filter((dir) => {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      return isInBounds(nx, ny, width, height) && grid[ny][nx] === MazeTile.WALL;
    });

    if (unvisited.length === 0) {
      stack.pop();
    } else {
      const dir = unvisited[0];
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const wx = x + dir.wx;
      const wy = y + dir.wy;

      grid[wy][wx] = MazeTile.PASSAGE;
      grid[ny][nx] = MazeTile.PASSAGE;
      stack.push({ x: nx, y: ny });
    }
  }
}

function primsAlgorithm(grid: Grid, startX: number, startY: number): void {
  const width = grid[0].length;
  const height = grid.length;

  interface FrontierCell {
    x: number;
    y: number;
    wx: number;
    wy: number;
  }

  const frontier: FrontierCell[] = [];
  grid[startY][startX] = MazeTile.PASSAGE;

  const addFrontier = (x: number, y: number) => {
    for (const dir of MAZE_DIRECTIONS) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const wx = x + dir.wx;
      const wy = y + dir.wy;

      if (isInBounds(nx, ny, width, height) && grid[ny][nx] === MazeTile.WALL) {
        frontier.push({ x: nx, y: ny, wx, wy });
      }
    }
  };

  addFrontier(startX, startY);

  while (frontier.length > 0) {
    const index = Math.floor(Math.random() * frontier.length);
    const cell = frontier[index];
    frontier.splice(index, 1);

    if (grid[cell.y][cell.x] === MazeTile.WALL) {
      grid[cell.wy][cell.wx] = MazeTile.PASSAGE;
      grid[cell.y][cell.x] = MazeTile.PASSAGE;
      addFrontier(cell.x, cell.y);
    }
  }
}

function recursiveDivision(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  orientation: "horizontal" | "vertical"
): void {
  if (width < 3 || height < 3) return;

  const horizontal = orientation === "horizontal";

  let wx: number, wy: number;
  if (horizontal) {
    wy = y + Math.floor(Math.random() * ((height - 2) / 2)) * 2 + 1;
    wx = x;
  } else {
    wx = x + Math.floor(Math.random() * ((width - 2) / 2)) * 2 + 1;
    wy = y;
  }

  let px: number, py: number;
  if (horizontal) {
    px = x + Math.floor(Math.random() * (width / 2)) * 2;
    py = wy;
  } else {
    px = wx;
    py = y + Math.floor(Math.random() * (height / 2)) * 2;
  }

  if (horizontal) {
    for (let i = x; i < x + width; i++) {
      if (
        i !== px &&
        wy >= 0 &&
        wy < grid.length &&
        i >= 0 &&
        i < grid[0].length
      ) {
        grid[wy][i] = MazeTile.WALL;
      }
    }
  } else {
    for (let i = y; i < y + height; i++) {
      if (
        i !== py &&
        i >= 0 &&
        i < grid.length &&
        wx >= 0 &&
        wx < grid[0].length
      ) {
        grid[i][wx] = MazeTile.WALL;
      }
    }
  }

  if (horizontal) {
    const topHeight = wy - y;
    const bottomHeight = height - topHeight - 1;

    const nextOrientation =
      width > topHeight * 1.5 ? "vertical" : "horizontal";
    recursiveDivision(grid, x, y, width, topHeight, nextOrientation);

    const nextOrientation2 =
      width > bottomHeight * 1.5 ? "vertical" : "horizontal";
    recursiveDivision(grid, x, wy + 1, width, bottomHeight, nextOrientation2);
  } else {
    const leftWidth = wx - x;
    const rightWidth = width - leftWidth - 1;

    const nextOrientation =
      height > leftWidth * 1.5 ? "horizontal" : "vertical";
    recursiveDivision(grid, x, y, leftWidth, height, nextOrientation);

    const nextOrientation2 =
      height > rightWidth * 1.5 ? "horizontal" : "vertical";
    recursiveDivision(grid, wx + 1, y, rightWidth, height, nextOrientation2);
  }
}

function addStartEnd(grid: Grid): void {
  const height = grid.length;
  const width = grid[0].length;

  let startFound = false;
  let endFound = false;

  for (let y = 1; y < height - 1 && !startFound; y++) {
    for (let x = 1; x < width - 1 && !startFound; x++) {
      if (grid[y][x] === MazeTile.PASSAGE) {
        grid[y][x] = MazeTile.START;
        startFound = true;
      }
    }
  }

  for (let y = height - 2; y > 0 && !endFound; y--) {
    for (let x = width - 2; x > 0 && !endFound; x--) {
      if (grid[y][x] === MazeTile.PASSAGE) {
        grid[y][x] = MazeTile.END;
        endFound = true;
      }
    }
  }
}

function addLoops(grid: Grid, loopChance: number): void {
  const height = grid.length;
  const width = grid[0].length;

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      if (grid[y][x] === MazeTile.WALL && Math.random() < loopChance) {
        grid[y][x] = MazeTile.PASSAGE;
      }
    }
  }
}

/**
 * Maze generator with multiple algorithms
 *
 * Algorithms:
 * - "backtracking": Recursive backtracking (deep, winding passages)
 * - "prims": Prim's algorithm (shorter dead ends)
 * - "division": Recursive division (regular, grid-like)
 */
export function generateMaze(size: number, options: MazeOptions = {}): Grid {
  const {
    algorithm = "backtracking",
    addStartEnd: addMarkers = true,
    loopChance = 0,
    openness = 0,
  } = options;

  // Ensure odd dimensions for proper maze algorithms
  const mazeSize = size % 2 === 0 ? size - 1 : size;
  let grid: Grid;

  if (algorithm === "division") {
    // Start with open space for recursive division
    grid = Array(mazeSize)
      .fill(0)
      .map((_, y) =>
        Array(mazeSize)
          .fill(0)
          .map((_, x) => {
            if (x === 0 || y === 0 || x === mazeSize - 1 || y === mazeSize - 1) {
              return MazeTile.WALL;
            }
            return MazeTile.PASSAGE;
          })
      );

    const orientation = mazeSize > mazeSize ? "vertical" : "horizontal";
    recursiveDivision(grid, 1, 1, mazeSize - 2, mazeSize - 2, orientation);
  } else {
    grid = createGrid(mazeSize, mazeSize, MazeTile.WALL);

    if (algorithm === "prims") {
      primsAlgorithm(grid, 1, 1);
    } else {
      recursiveBacktracking(grid, 1, 1);
    }
  }

  if (loopChance > 0) {
    addLoops(grid, loopChance);
  }

  if (openness > 0) {
    for (let y = 1; y < mazeSize - 1; y++) {
      for (let x = 1; x < mazeSize - 1; x++) {
        if (grid[y][x] === MazeTile.WALL && Math.random() < openness) {
          grid[y][x] = MazeTile.PASSAGE;
        }
      }
    }
  }

  if (addMarkers) {
    addStartEnd(grid);
  }

  return grid;
}
