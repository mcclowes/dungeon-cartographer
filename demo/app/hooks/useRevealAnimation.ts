"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Grid } from "dungeon-cartographer";

type DrawFunction = (grid: Grid, revealProgress?: number) => void;

export function useRevealAnimation(draw: DrawFunction) {
  const animationRef = useRef<number | null>(null);

  const animateReveal = useCallback(
    (grid: Grid) => {
      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const duration = 800; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        draw(grid, easedProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [draw]
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { animateReveal };
}
