"use client";

import { useRef, useCallback, useState } from "react";
import styles from "./MapCanvas.module.scss";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
}

export function MapCanvas({ canvasRef, width, height }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(0.5, z * delta), 4));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.zoomControls}>
        <button
          onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
          className={styles.zoomButton}
        >
          + Zoom In
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}
          className={styles.zoomButton}
        >
          - Zoom Out
        </button>
        <button onClick={resetView} className={styles.zoomButton}>
          Reset View
        </button>
        <span className={styles.zoomInfo}>
          {Math.round(zoom * 100)}% — Scroll to zoom, drag to pan
        </span>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`${styles.container} ${isPanning ? styles.grabbing : ""}`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={styles.canvas}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          }}
        />
      </div>
    </div>
  );
}
