"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grid } from "dungeon-cartographer";
import {
  generateMapWithAI,
  EXAMPLE_PROMPTS,
  type AIMapResponse,
  type LocationArchetype,
} from "../generate/ai";
import styles from "./AIMapGenerator.module.scss";

interface Props {
  onMapGenerated: (grid: Grid, metadata?: AIMapResponse["metadata"]) => void;
  size: number;
}

const API_KEY_STORAGE_KEY = "anthropic-api-key";

export function AIMapGenerator({ onMapGenerated, size }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastMetadata, setLastMetadata] = useState<AIMapResponse["metadata"] | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  // Save API key to localStorage
  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(API_KEY_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a map description");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress("Starting generation...");

    try {
      const result = await generateMapWithAI(apiKey, description, {
        width: size,
        height: size,
        onProgress: setProgress,
      });

      setLastMetadata(result.metadata);
      onMapGenerated(result.grid, result.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  }, [apiKey, description, size, onMapGenerated]);

  const handleExampleClick = useCallback(
    (prompt: string, archetype?: LocationArchetype) => {
      setDescription(prompt);
      setError(null);
    },
    []
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.label}>
          Anthropic API Key
          <div className={styles.apiKeyContainer}>
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              className={styles.input}
              disabled={isGenerating}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className={styles.toggleButton}
              title={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <p className={styles.hint}>
          Get your API key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          Map Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your map... e.g., 'A mysterious underground temple with a central altar room, surrounded by meditation chambers and connected by narrow passages.'"
            className={styles.textarea}
            rows={4}
            disabled={isGenerating}
          />
        </label>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Example Prompts</span>
        <div className={styles.exampleGrid}>
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example.name}
              onClick={() => handleExampleClick(example.prompt, example.archetype)}
              className={styles.exampleButton}
              disabled={isGenerating}
              title={example.description}
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !apiKey.trim() || !description.trim()}
        className={styles.generateButton}
      >
        {isGenerating ? "Generating..." : "Generate Map"}
      </button>

      {progress && (
        <div className={styles.progress}>
          <div className={styles.spinner} />
          <span>{progress}</span>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {lastMetadata && !isGenerating && (
        <div className={styles.metadata}>
          <div className={styles.metadataSection}>
            <strong>AI Interpretation:</strong>
            <p>{lastMetadata.interpretation}</p>
          </div>
          {lastMetadata.archetype && (
            <div className={styles.metadataSection}>
              <strong>Detected Archetype:</strong> {lastMetadata.archetype}
            </div>
          )}
          {lastMetadata.features.length > 0 && (
            <div className={styles.metadataSection}>
              <strong>Features:</strong>
              <ul className={styles.featureList}>
                {lastMetadata.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
