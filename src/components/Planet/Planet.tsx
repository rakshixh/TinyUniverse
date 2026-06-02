'use client';

import { useMemo } from 'react';
import type { IMemory } from '@/types/memory';
import styles from './Planet.module.scss';

// Deterministic color generation from title
const PLANET_COLORS = [
  '#8B5CF6', '#38BDF8', '#F472B6', '#FB923C',
  '#34D399', '#FBBF24', '#A78BFA', '#60A5FA',
  '#F87171', '#4ADE80',
];

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
}

export default function Planet({ memory, onClick }: PlanetProps) {
  const color = useMemo(() => getPlanetColor(memory.title), [memory.title]);
  const size = ORBIT_SIZES[memory.orbit] ?? 40;
  const floatDelay = useMemo(() => `${(memory.angle % 3).toFixed(1)}s`, [memory.angle]);
  const floatDir = memory.angle % 2 === 0 ? styles.floatA : styles.floatB;

  return (
    <button
      className={`${styles.planet} ${floatDir}`}
      style={{
        '--planet-color': color,
        '--planet-size': `${size}px`,
        '--float-delay': floatDelay,
      } as React.CSSProperties}
      onClick={() => onClick(memory)}
      aria-label={`Planet: ${memory.title}. Click to view memory.`}
      title={memory.title}
      type="button"
    >
      <span className={styles.globe} aria-hidden="true">
        <span className={styles.shine} />
        <span className={styles.ring} />
      </span>
      <span className={styles.label}>{memory.title}</span>
    </button>
  );
}
