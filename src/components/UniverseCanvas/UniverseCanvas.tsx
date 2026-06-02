'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { IMemory } from '@/types/memory';
import { polarToCartesian, getOrbitRadius } from '@/lib/orbit';
import Planet from '@/components/Planet/Planet';
import styles from './UniverseCanvas.module.scss';

const ORBIT_COUNT = 4;
const CANVAS_SIZE = 1200; // logical px
const CENTER = CANVAS_SIZE / 2;

interface UniverseCanvasProps {
  memories: IMemory[];
  onPlanetClick: (memory: IMemory) => void;
}

export default function UniverseCanvas({ memories, onPlanetClick }: UniverseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Responsive: scale canvas to fit viewport
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const minDim = Math.min(width, height);
      // On mobile, make the canvas a bit smaller to show context
      const targetSize = minDim < 600 ? minDim * 0.92 : Math.min(minDim * 0.96, CANVAS_SIZE);
      setScale(targetSize / CANVAS_SIZE);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Pre-compute planet positions
  const planetPositions = useMemo(() => {
    return memories.map((memory) => {
      const { x, y } = polarToCartesian(memory.orbit, memory.angle);
      return { memory, x: CENTER + x, y: CENTER + y };
    });
  }, [memories]);

  // Which orbits are occupied?
  const activeOrbits = useMemo(() => {
    const set = new Set(memories.map((m) => m.orbit));
    return set;
  }, [memories]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      aria-label="Universe canvas — your memory planets"
      role="region"
    >
      <div
        className={styles.canvas}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Orbit rings */}
        {Array.from({ length: ORBIT_COUNT }, (_, i) => {
          const orbit = i + 1;
          const radius = getOrbitRadius(orbit);
          const diameter = radius * 2;
          const isActive = activeOrbits.has(orbit);

          return (
            <div
              key={orbit}
              className={`${styles.orbitRing} ${isActive ? styles.orbitActive : ''}`}
              style={{
                width: diameter,
                height: diameter,
                top: CENTER - radius,
                left: CENTER - radius,
              }}
              aria-hidden="true"
            />
          );
        })}

        {/* Sun / core */}
        <div
          className={styles.sun}
          style={{ top: CENTER - 18, left: CENTER - 18 }}
          aria-hidden="true"
        >
          <div className={styles.sunCore} />
          <div className={styles.sunGlow} />
          <div className={styles.sunPulse} />
        </div>

        {/* Planets */}
        {planetPositions.map(({ memory, x, y }) => (
          <div
            key={memory._id}
            className={styles.planetWrapper}
            style={{ top: y, left: x }}
          >
            <Planet memory={memory} onClick={onPlanetClick} />
          </div>
        ))}
      </div>
    </div>
  );
}
