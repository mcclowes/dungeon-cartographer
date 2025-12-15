"use client";

import styles from "./PresetSelector.module.scss";
import type { Preset } from "../types";

interface Props {
  presets: Preset[];
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ presets, onSelect }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelect(preset)}
            className={styles.preset}
          >
            <span className={styles.name}>{preset.name}</span>
            <span className={styles.description}>{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
