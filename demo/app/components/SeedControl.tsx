"use client";

import { useState } from "react";
import styles from "./SeedControl.module.scss";

interface Props {
  seed: number;
  onSeedChange: (seed: number) => void;
  onRandomize: () => void;
  onCopyUrl: () => void;
}

export function SeedControl({ seed, onSeedChange, onRandomize, onCopyUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Seed:
        <input
          type="number"
          value={seed}
          onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
          className={styles.input}
        />
      </label>
      <button onClick={onRandomize} className={styles.button}>
        Random
      </button>
      <button onClick={handleCopy} className={styles.button}>
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
