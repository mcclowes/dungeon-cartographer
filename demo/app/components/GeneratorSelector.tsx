"use client";

import styles from "./GeneratorSelector.module.scss";
import type { GeneratorType, GeneratorConfig } from "../types";

interface Props {
  generators: Record<GeneratorType, GeneratorConfig>;
  categories: string[];
  selectedGenerator: GeneratorType;
  onSelect: (generator: GeneratorType) => void;
}

export function GeneratorSelector({
  generators,
  categories,
  selectedGenerator,
  onSelect,
}: Props) {
  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={selectedGenerator}
        onChange={(e) => onSelect(e.target.value as GeneratorType)}
      >
        {categories.map((category) => (
          <optgroup key={category} label={category}>
            {Object.entries(generators)
              .filter(([_, config]) => config.category === category)
              .map(([type, config]) => (
                <option key={type} value={type}>
                  {config.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
