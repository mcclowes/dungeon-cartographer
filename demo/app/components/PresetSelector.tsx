"use client";

import styles from "./PresetSelector.module.scss";
import type { Preset } from "../types";

interface Props {
  presets: Preset[];
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ presets, onSelect }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = presets.find((p) => p.name === e.target.value);
    if (preset) onSelect(preset);
  };

  return (
    <div className={styles.container}>
      <select className={styles.select} onChange={handleChange} defaultValue="">
        <option value="" disabled>
          Select a preset...
        </option>
        {presets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  );
}
