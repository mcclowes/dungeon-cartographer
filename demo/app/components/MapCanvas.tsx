"use client";

import { useRef, useCallback, useState, useEffect } from "react";
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

  // Touch state for pinch-to-zoom
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  // Reset view when canvas size changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [width, height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(0.25, z * delta), 4));
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

  // Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - start panning
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch zoom
        lastTouchDistance.current = getTouchDistance(e.touches);
        lastTouchCenter.current = getTouchCenter(e.touches);
      }
    },
    [pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isPanning) {
        // Single touch - pan
        setPan({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y,
        });
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        const newDistance = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);

        if (lastTouchDistance.current !== null && newDistance !== null) {
          const scale = newDistance / lastTouchDistance.current;
          setZoom((z) => Math.min(Math.max(0.25, z * scale), 4));
        }

        // Also pan while pinching
        if (lastTouchCenter.current !== null) {
          setPan((p) => ({
            x: p.x + (newCenter.x - lastTouchCenter.current!.x),
            y: p.y + (newCenter.y - lastTouchCenter.current!.y),
          }));
        }

        lastTouchDistance.current = newDistance;
        lastTouchCenter.current = newCenter;
      }
    },
    [isPanning, panStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`${styles.fullscreenCanvas} ${isPanning ? styles.grabbing : ""}`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={styles.canvas}
          style={{
            transform: `translate(-50%, -50%) scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          }}
        />
      </div>

      <div className={styles.zoomControls}>
        <button
          onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
          className={styles.zoomButton}
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z / 1.2))}
          className={styles.zoomButton}
        >
          −
        </button>
        <button onClick={resetView} className={styles.zoomButton}>
          Reset
        </button>
        <span className={styles.zoomInfo}>{Math.round(zoom * 100)}%</span>
      </div>
    </>
  );
}
