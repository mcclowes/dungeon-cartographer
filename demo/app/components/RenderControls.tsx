"use client";

import styles from "./RenderControls.module.scss";
import type { RenderStyle } from "dungeon-cartographer/render";
import type { GeneratorConfig, RenderParams } from "../types";
import { STYLE_LABELS } from "../config";

interface Props {
  config: GeneratorConfig;
  size: number;
  style: RenderStyle;
  renderParams: RenderParams;
  onSizeChange: (size: number) => void;
  onStyleChange: (style: RenderStyle) => void;
  onRenderParamsChange: (params: RenderParams) => void;
  onRegenerate: () => void;
  onExport: () => void;
}

export function RenderControls({
  config,
  size,
  style,
  renderParams,
  onSizeChange,
  onStyleChange,
  onRenderParamsChange,
  onRegenerate,
  onExport,
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span className={styles.name}>{config.name}</span>
        <span className={styles.description}>— {config.description}</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          Size:
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className={styles.select}
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={48}>48</option>
            <option value={64}>64</option>
          </select>
        </label>
        <label className={styles.control}>
          Style:
          <select
            value={style}
            onChange={(e) => onStyleChange(e.target.value as RenderStyle)}
            className={styles.select}
          >
            {config.availableStyles.map((s) => (
              <option key={s} value={s}>
                {STYLE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={renderParams.showGrid}
            onChange={(e) =>
              onRenderParamsChange({ ...renderParams, showGrid: e.target.checked })
            }
          />
          Grid
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={renderParams.animateReveal}
            onChange={(e) =>
              onRenderParamsChange({ ...renderParams, animateReveal: e.target.checked })
            }
          />
          Animate
        </label>
        {style === "parchment" && (
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={renderParams.showTitle}
              onChange={(e) =>
                onRenderParamsChange({ ...renderParams, showTitle: e.target.checked })
              }
            />
            Title
          </label>
        )}
        {style === "parchment" && renderParams.showTitle && (
          <input
            type="text"
            value={renderParams.mapTitle}
            onChange={(e) =>
              onRenderParamsChange({ ...renderParams, mapTitle: e.target.value })
            }
            placeholder="Map title..."
            className={styles.textInput}
          />
        )}
        <button onClick={onRegenerate} className={styles.primaryButton}>
          Regenerate
        </button>
        <button onClick={onExport} className={styles.secondaryButton}>
          Export PNG
        </button>
      </div>
    </div>
  );
}
