"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  generateBSP,
  generateCave,
  generateVoronoi,
  createSimulation,
  simulateTurn,
  type Grid,
  type SimulationState,
  type SimulationEvent,
  Faction,
  UnitType,
} from "dungeon-cartographer";
import { drawGrid, drawUnits } from "dungeon-cartographer/render";
import styles from "./page.module.scss";

type GeneratorType = "bsp" | "cave" | "voronoi";

const GENERATORS: Record<GeneratorType, (size: number) => Grid> = {
  bsp: (size) =>
    generateBSP(size, {
      minPartitionSize: 8,
      maxDepth: 4,
      addDoors: true,
      addFeatures: false,
    }),
  cave: (size) =>
    generateCave(size, {
      iterations: 4,
      initialFillProbability: 0.45,
      addFeatures: false,
    }),
  voronoi: (size) =>
    generateVoronoi(size, {
      numRooms: 10,
      relaxation: 2,
      addDoors: true,
      addFeatures: false,
    }),
};

interface BattleLog {
  turn: number;
  message: string;
  type: "move" | "combat" | "death" | "victory" | "info";
}

export default function SimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per turn
  const [generatorType, setGeneratorType] = useState<GeneratorType>("bsp");
  const [size, setSize] = useState(32);
  const [unitsPerFaction, setUnitsPerFaction] = useState(3);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate new map and reset simulation
  const generateNewBattle = useCallback(() => {
    // Stop any running simulation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    // Generate new grid
    const newGrid = GENERATORS[generatorType](size);
    setGrid(newGrid);

    // Create simulation
    const newSimulation = createSimulation(newGrid, {
      unitsPerFaction,
      unitTypes: [UnitType.WARRIOR, UnitType.ARCHER, UnitType.MAGE],
      opposingSides: true,
      minSpawnDistance: 3,
    });

    setSimulation(newSimulation);
    setBattleLog([
      {
        turn: 0,
        message: `Battle begins! ${unitsPerFaction} units per faction.`,
        type: "info",
      },
    ]);
  }, [generatorType, size, unitsPerFaction]);

  // Draw the current state
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw grid
    drawGrid(ctx, grid, canvas.width, canvas.height, {
      style: "parchment",
      texture: true,
      scuffs: true,
      vignette: true,
    });

    // Draw units
    if (simulation) {
      drawUnits(
        ctx,
        simulation.units,
        canvas.width,
        canvas.height,
        grid[0].length,
        grid.length,
        {
          showHpBars: true,
          showTypeIndicators: true,
          unitScale: 0.7,
        }
      );
    }
  }, [grid, simulation]);

  // Process events into log messages
  const processEvents = useCallback(
    (events: SimulationEvent[], turn: number) => {
      const newLogs: BattleLog[] = [];

      for (const event of events) {
        switch (event.type) {
          case "move": {
            const unit = simulation?.units.get(event.data.unitId);
            if (unit) {
              newLogs.push({
                turn,
                message: `${unit.faction} ${unit.type} moves to (${event.data.to.x}, ${event.data.to.y})`,
                type: "move",
              });
            }
            break;
          }
          case "combat": {
            const attacker = simulation?.units.get(event.data.attackerId);
            const defender = simulation?.units.get(event.data.defenderId);
            if (attacker && defender) {
              newLogs.push({
                turn,
                message: `${attacker.faction} ${attacker.type} attacks ${defender.faction} ${defender.type} for ${event.data.damage} damage!`,
                type: "combat",
              });
            }
            break;
          }
          case "death": {
            const deadUnit = simulation?.units.get(event.data.unitId);
            if (deadUnit) {
              newLogs.push({
                turn,
                message: `${deadUnit.faction} ${deadUnit.type} has been defeated!`,
                type: "death",
              });
            }
            break;
          }
          case "victory": {
            newLogs.push({
              turn,
              message: `${event.data.winner.toUpperCase()} TEAM WINS!`,
              type: "victory",
            });
            break;
          }
        }
      }

      return newLogs;
    },
    [simulation]
  );

  // Run a single turn
  const runTurn = useCallback(() => {
    if (!grid || !simulation || simulation.isComplete) {
      setIsRunning(false);
      return;
    }

    const events = simulateTurn(grid, simulation, { randomizeTurnOrder: true });
    const newLogs = processEvents(events, simulation.turn);

    setBattleLog((prev) => [...prev, ...newLogs]);
    setSimulation({ ...simulation }); // Trigger re-render

    if (simulation.isComplete) {
      setIsRunning(false);
    }
  }, [grid, simulation, processEvents]);

  // Auto-run simulation
  useEffect(() => {
    if (isRunning && grid && simulation && !simulation.isComplete) {
      intervalRef.current = setInterval(runTurn, speed);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, runTurn, speed, grid, simulation]);

  // Draw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Generate initial battle on mount
  useEffect(() => {
    generateNewBattle();
  }, []);

  // Get unit counts
  const getUnitCounts = () => {
    if (!simulation) return { red: 0, blue: 0 };
    let red = 0;
    let blue = 0;
    for (const unit of simulation.units.values()) {
      if (!unit.isDead) {
        if (unit.faction === Faction.RED) red++;
        else blue++;
      }
    }
    return { red, blue };
  };

  const counts = getUnitCounts();

  return (
    <div className={styles.container}>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={size * 20}
          height={size * 20}
          className={styles.canvas}
        />
      </div>

      <div className={styles.sidebar}>
        <h1 className={styles.title}>Battle Simulator</h1>

        <div className={styles.status}>
          <div className={styles.teamStatus}>
            <span className={styles.redTeam}>RED: {counts.red}</span>
            <span className={styles.blueTeam}>BLUE: {counts.blue}</span>
          </div>
          {simulation && (
            <div className={styles.turnInfo}>
              Turn: {simulation.turn}
              {simulation.isComplete && simulation.winner && (
                <span className={styles.winner}>
                  {" "}
                  - {simulation.winner.toUpperCase()} WINS!
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Map Type</label>
            <select
              value={generatorType}
              onChange={(e) => setGeneratorType(e.target.value as GeneratorType)}
            >
              <option value="bsp">BSP Dungeon</option>
              <option value="cave">Cave</option>
              <option value="voronoi">Voronoi Rooms</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label>Map Size: {size}</label>
            <input
              type="range"
              min="24"
              max="64"
              step="8"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
            />
          </div>

          <div className={styles.controlGroup}>
            <label>Units per Team: {unitsPerFaction}</label>
            <input
              type="range"
              min="1"
              max="8"
              value={unitsPerFaction}
              onChange={(e) => setUnitsPerFaction(parseInt(e.target.value))}
            />
          </div>

          <div className={styles.controlGroup}>
            <label>Speed: {speed}ms</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
            />
          </div>

          <div className={styles.buttons}>
            <button onClick={generateNewBattle} className={styles.button}>
              New Battle
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={styles.button}
              disabled={simulation?.isComplete}
            >
              {isRunning ? "Pause" : "Play"}
            </button>
            <button
              onClick={runTurn}
              className={styles.button}
              disabled={isRunning || simulation?.isComplete}
            >
              Step
            </button>
          </div>
        </div>

        <div className={styles.legend}>
          <h3>Unit Types</h3>
          <div className={styles.legendItem}>
            <span className={styles.unitIcon}>W</span> Warrior - High HP, melee
          </div>
          <div className={styles.legendItem}>
            <span className={styles.unitIcon}>A</span> Archer - Range 4, low HP
          </div>
          <div className={styles.legendItem}>
            <span className={styles.unitIcon}>M</span> Mage - Range 3, high damage
          </div>
        </div>

        <div className={styles.logContainer}>
          <h3>Battle Log</h3>
          <div className={styles.log}>
            {battleLog
              .slice()
              .reverse()
              .map((entry, i) => (
                <div key={i} className={`${styles.logEntry} ${styles[entry.type]}`}>
                  <span className={styles.logTurn}>[{entry.turn}]</span>{" "}
                  {entry.message}
                </div>
              ))}
          </div>
        </div>

        <a href="/" className={styles.backLink}>
          Back to Map Generator
        </a>
      </div>
    </div>
  );
}
