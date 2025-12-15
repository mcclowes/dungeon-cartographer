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
      {categories.map((category) => (
        <div key={category} className={styles.category}>
          <h3 className={styles.categoryTitle}>{category}</h3>
          <div className={styles.buttonGroup}>
            {Object.entries(generators)
              .filter(([_, config]) => config.category === category)
              .map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => onSelect(type as GeneratorType)}
                  className={`${styles.button} ${
                    selectedGenerator === type ? styles.active : ""
                  }`}
                >
                  {config.name}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
