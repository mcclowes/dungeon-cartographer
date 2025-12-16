"use client";

import styles from "./ParameterControls.module.scss";
import type { GeneratorType, GeneratorParams } from "../types";
import { PARAM_CONFIGS, GENERATOR_PARAMS } from "../config";

interface Props {
  generatorType: GeneratorType;
  params: GeneratorParams;
  onChange: (params: GeneratorParams) => void;
}

export function ParameterControls({ generatorType, params, onChange }: Props) {
  const paramKeys = GENERATOR_PARAMS[generatorType] || [];

  if (paramKeys.length === 0) {
    return null;
  }

  const handleChange = (key: string, value: number | boolean | string) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Parameters</h3>
      <div className={styles.grid}>
        {paramKeys.map((key) => {
          const config = PARAM_CONFIGS[key];
          if (!config) return null;

          const value = params[key as keyof GeneratorParams];

          if (config.type === "boolean") {
            return (
              <label key={key} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => handleChange(key, e.target.checked)}
                />
                <span>{config.label}</span>
              </label>
            );
          }

          if (config.type === "select" && config.options) {
            return (
              <div key={key} className={styles.param}>
                <label className={styles.label}>{config.label}</label>
                <select
                  value={value as string}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={styles.select}
                >
                  {config.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={key} className={styles.param}>
              <label className={styles.label}>
                {config.label}
                <span className={styles.value}>
                  {typeof value === "number" ? value.toFixed(config.step && config.step < 1 ? 2 : 0) : value}
                </span>
              </label>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value as number}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className={styles.range}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
