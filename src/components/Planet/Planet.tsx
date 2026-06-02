'use client';

import { useMemo } from 'react';
import type { IMemory } from '@/types/memory';
import styles from './Planet.module.scss';

// Deterministic color generation from title (fallback)
const PLANET_COLORS = [
  '#8B5CF6', '#38BDF8', '#F472B6', '#FB923C',
  '#34D399', '#FBBF24', '#A78BFA', '#60A5FA',
  '#F87171', '#4ADE80',
];

const TEXTURE_TYPES = ['rocky', 'gaseous', 'oceanic', 'magma'];

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function getPlanetColor(title: string): string {
  const idx = hashString(title) % PLANET_COLORS.length;
  return PLANET_COLORS[idx];
}

function getPlanetTexture(title: string): string {
  const idx = hashString(title) % TEXTURE_TYPES.length;
  return TEXTURE_TYPES[idx];
}

// Planet size based on orbit (closer = larger)
const ORBIT_SIZES: Record<number, number> = {
  1: 52,
  2: 44,
  3: 38,
  4: 32,
};

interface PlanetProps {
  memory: IMemory;
  onClick: (memory: IMemory) => void;
  color?: string;
  textureType?: string;
  hasRing?: boolean;
}

export default function Planet({ memory, onClick, color, textureType, hasRing }: PlanetProps) {
  const finalColor = useMemo(() => color || getPlanetColor(memory.title), [color, memory.title]);
  const finalTexture = useMemo(() => textureType || getPlanetTexture(memory.title), [textureType, memory.title]);
  const finalHasRing = useMemo(() => hasRing !== undefined ? hasRing : hashString(memory.title) % 3 === 0, [hasRing, memory.title]);

  const size = ORBIT_SIZES[memory.orbit] ?? 40;
  const rotationDuration = useMemo(() => `${(15 + (hashString(memory.title) % 15))}s`, [memory.title]);

  // Format date nicely (e.g. Jun 2, 2026)
  const formattedDate = useMemo(() => {
    if (!memory.date) return '';
    try {
      const d = new Date(memory.date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [memory.date]);

  return (
    <button
      className={styles.planet}
      style={{
        '--planet-color': finalColor,
        '--planet-size': `${size}px`,
        '--rotation-duration': rotationDuration,
      } as React.CSSProperties}
      onClick={() => onClick(memory)}
      aria-label={`Planet: ${memory.title}. Created on ${formattedDate}. Click to view memory.`}
      title={`${memory.title} (${formattedDate})`}
      type="button"
    >
      <span className={styles.globe} aria-hidden="true">
        <span className={`${styles.texture} ${styles[finalTexture]}`} />
        <span className={styles.shading} />
        <span className={styles.shine} />
        {finalHasRing && <span className={styles.ring} />}
      </span>
      <span className={styles.label}>
        <span className={styles.titleText}>{memory.title}</span>
        {formattedDate && <span className={styles.dateText}>{formattedDate}</span>}
      </span>
    </button>
  );
}
