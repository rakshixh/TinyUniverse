'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { IMemory } from '@/types/memory';
import type { ISolarSystem } from '@/types/solarsystem';
import Planet from '@/components/Planet/Planet';
import styles from './UniverseCanvas.module.scss';

const CANVAS_SIZE = 1200; // logical px
const CENTER = CANVAS_SIZE / 2;

// Orbit Radii per ring
const ORBIT_RADII = [160, 280, 400, 520];

const PLANET_COLORS = [
  '#8B5CF6', // Purple
  '#38BDF8', // Sky Blue
  '#F472B6', // Pink
  '#FB923C', // Orange
  '#34D399', // Emerald Green
  '#FBBF24', // Amber/Yellow
  '#A78BFA', // Light Violet
  '#60A5FA', // Blue
  '#F87171', // Red
  '#4ADE80', // Mint Green
];

const TEXTURE_TYPES = ['rocky', 'gaseous', 'oceanic', 'magma'];

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

interface UniverseCanvasProps {
  solarSystem: ISolarSystem;
  memories: IMemory[];
  onPlanetClick: (memory: IMemory) => void;
}

export default function UniverseCanvas({ solarSystem, memories, onPlanetClick }: UniverseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Base scale (responsive viewport scale)
  const [baseScale, setBaseScale] = useState(1);
  
  // User interactive states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Refs for dragging math
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPanOffset = useRef({ x: 0, y: 0 });
  const wasDraggingRef = useRef(false);
  const preventClickRef = useRef(false);

  // Responsive: scale canvas base size to fit container viewport
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const minDim = Math.min(width, height);
      const targetSize = minDim < 600 ? minDim * 0.92 : Math.min(minDim * 0.96, CANVAS_SIZE);
      setBaseScale(targetSize / CANVAS_SIZE);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Compute final combined scale
  const finalScale = useMemo(() => baseScale * zoomLevel, [baseScale, zoomLevel]);

  // Group memories, sort by date ascending, and distribute angles evenly per orbit
  const planetPositions = useMemo(() => {
    const orbitGroups: Record<number, IMemory[]> = { 1: [], 2: [], 3: [], 4: [] };
    memories.forEach((memory) => {
      const o = memory.orbit || 1;
      if (!orbitGroups[o]) {
        orbitGroups[o] = [];
      }
      orbitGroups[o].push(memory);
    });

    const list: Array<{
      memory: IMemory;
      x: number;
      y: number;
      color: string;
      textureType: string;
      hasRing: boolean;
    }> = [];

    // Distribute planets evenly per orbit ring
    Object.keys(orbitGroups).forEach((orbitStr) => {
      const orbit = parseInt(orbitStr, 10);
      const group = orbitGroups[orbit];
      if (group.length === 0) return;

      // Sort by memory date ascending
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const N = group.length;
      const radius = ORBIT_RADII[orbit - 1];

      group.forEach((memory, index) => {
        // Calculate even angular spacing
        const angle = (index / N) * 360;
        
        // Convert polar coordinates to Cartesian relative to CENTER (600, 600)
        const radians = ((angle - 90) * Math.PI) / 180;
        const x = CENTER + radius * Math.cos(radians);
        const y = CENTER + radius * Math.sin(radians);

        // Assign colors sequentially to avoid adjacent duplicate colors
        const color = PLANET_COLORS[index % PLANET_COLORS.length];
        
        // Distribute textures sequentially
        const textureType = TEXTURE_TYPES[index % TEXTURE_TYPES.length];
        
        // Give rings to every third planet
        const hasRing = index % 3 === 0;

        // Override angle locally on the memory object so child components know their position
        const memoryWithUpdatedAngle = { ...memory, angle };

        list.push({
          memory: memoryWithUpdatedAngle,
          x,
          y,
          color,
          textureType,
          hasRing,
        });
      });
    });

    return list;
  }, [memories]);

  // Track active orbits globally
  const activeOrbits = useMemo(() => {
    return new Set(memories.map((m) => m.orbit));
  }, [memories]);

  // Zoom controls handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.4));
  }, []);

  const handleRecenter = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Wheel Zoom event handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1 - e.deltaY * 0.001;
    setZoomLevel((prev) => Math.max(0.4, Math.min(3.0, prev * scaleFactor)));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  // Pointer dragging handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click / single touch
    
    // Do not initiate drag if clicking on a button (planet), link, or input
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('select') ||
      target.closest('input')
    ) {
      return;
    }
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPanOffset.current = panOffset;
    wasDraggingRef.current = false;
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      wasDraggingRef.current = true;
    }
    
    setPanOffset({
      x: initialPanOffset.current.x + dx,
      y: initialPanOffset.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDragging.current = false;
    
    if (wasDraggingRef.current) {
      preventClickRef.current = true;
      setTimeout(() => {
        preventClickRef.current = false;
      }, 50);
    }
  };

  // Safe wrapper for planet clicking to ignore clicks that were actually drags
  const handlePlanetClick = useCallback((memory: IMemory) => {
    if (preventClickRef.current) return;
    onPlanetClick(memory);
  }, [onPlanetClick]);

const STAR_RENDER_PROPS = {
  dwarf: { size: 52, pulseSpeed: '8s', glowSize: 120, pulseSize: 180, isNebula: false, isPulsar: false },
  giant: { size: 68, pulseSpeed: '9s', glowSize: 170, pulseSize: 250, isNebula: false, isPulsar: false },
  supergiant: { size: 88, pulseSpeed: '12s', glowSize: 240, pulseSize: 340, isNebula: false, isPulsar: false },
  nebula: { size: 58, pulseSpeed: '10s', glowSize: 190, pulseSize: 270, isNebula: true, isPulsar: false },
  pulsar: { size: 36, pulseSpeed: '6s', glowSize: 130, pulseSize: 180, isNebula: false, isPulsar: true },
};

const starColor = solarSystem.starColor || '#FBBF24';
const starGlowRgb = hexToRgb(starColor);
const renderProps = STAR_RENDER_PROPS[solarSystem.starType as keyof typeof STAR_RENDER_PROPS] || STAR_RENDER_PROPS.dwarf;
const size = renderProps.size;
const centerOffset = size / 2;

return (
  <div
    ref={containerRef}
    className={styles.container}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    aria-label={`${solarSystem.name} canvas`}
    role="region"
  >
    <div
      className={`${styles.canvas} ${zoomLevel < 0.65 ? styles.zoomedOut : ''}`}
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${finalScale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Concentric Orbit Rings */}
      {ORBIT_RADII.map((radius, i) => {
        const orbit = i + 1;
        const diameter = radius * 2;
        const isActive = activeOrbits.has(orbit);

        return (
          <div
            key={`orbit-${orbit}`}
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

      {/* Central Sun / Star */}
      <div
        className={styles.sun}
        style={{
          width: size,
          height: size,
          top: CENTER - centerOffset,
          left: CENTER - centerOffset,
        }}
        aria-hidden="true"
      >
        <div
          className={styles.sunCore}
          style={{
            background: renderProps.isNebula
              ? `radial-gradient(circle at 50% 50%, #ffffff 0%, ${starColor} 45%, rgba(${starGlowRgb}, 0.35) 75%, rgba(${starGlowRgb}, 0) 100%)`
              : `radial-gradient(circle at 35% 35%, #ffffff 0%, ${starColor} 60%, rgba(${starGlowRgb}, 0.2) 100%)`,
            boxShadow: `
              0 0 24px rgba(${starGlowRgb}, 0.45),
              0 0 48px rgba(${starGlowRgb}, 0.15)
            `,
          }}
        />
        <div
          className={styles.sunGlow}
          style={{
            width: renderProps.glowSize,
            height: renderProps.glowSize,
            background: `radial-gradient(circle, rgba(${starGlowRgb}, 0.35) 0%, rgba(${starGlowRgb}, 0.1) 50%, rgba(${starGlowRgb}, 0) 80%)`,
            '--pulse-speed': renderProps.pulseSpeed,
          } as React.CSSProperties}
        />
        <div
          className={styles.sunPulse}
          style={{
            width: renderProps.pulseSize,
            height: renderProps.pulseSize,
            borderColor: `rgba(${starGlowRgb}, 0.08)`,
            '--pulse-speed': renderProps.pulseSpeed,
          } as React.CSSProperties}
        />
        
        {solarSystem.starType === 'giant' && (
          <div
            className={styles.starRing}
            style={{
              width: size * 1.5,
              height: size * 1.5,
              borderColor: `rgba(${starGlowRgb}, 0.15)`,
            }}
          />
        )}

        {solarSystem.starType === 'supergiant' && (
          <>
            <div
              className={`${styles.starRing} ${styles.starRingInner}`}
              style={{
                width: size * 1.35,
                height: size * 1.35,
                borderColor: `rgba(${starGlowRgb}, 0.15)`,
                animation: 'rotate-slow 35s linear infinite',
              }}
            />
            <div
              className={`${styles.starRing} ${styles.starRingOuter}`}
              style={{
                width: size * 1.65,
                height: size * 1.65,
                borderColor: `rgba(${starGlowRgb}, 0.08)`,
                animation: 'rotate-counter 55s linear infinite',
              }}
            />
          </>
        )}

        {renderProps.isPulsar && (
          <div
            className={styles.pulsarBeacon}
            style={{
              background: `linear-gradient(90deg, rgba(${starGlowRgb}, 0) 0%, rgba(255, 255, 255, 0.75) 50%, rgba(${starGlowRgb}, 0) 100%)`,
            }}
          />
        )}

        {renderProps.isNebula && (
          <div
            className={styles.nebulaCloud}
            style={{
              width: renderProps.glowSize * 1.25,
              height: renderProps.glowSize * 1.25,
              background: `radial-gradient(circle, rgba(${starGlowRgb}, 0.1) 0%, rgba(139, 92, 246, 0.03) 60%, rgba(${starGlowRgb}, 0) 90%)`,
              border: `1px dashed rgba(${starGlowRgb}, 0.15)`,
            }}
          />
        )}
      </div>

        {/* Planets */}
        {planetPositions.map(({ memory, x, y, color, textureType, hasRing }) => (
          <div
            key={memory._id}
            className={styles.planetWrapper}
            style={{ top: y, left: x }}
          >
            <Planet
              memory={memory}
              onClick={handlePlanetClick}
              color={color}
              textureType={textureType}
              hasRing={hasRing}
            />
          </div>
        ))}
      </div>

      {/* Glassmorphic Zoom Controls */}
      <div className={styles.controls} aria-label="System controls">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          type="button"
          aria-label="Zoom In"
        >
          ＋
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          type="button"
          aria-label="Zoom Out"
        >
          －
        </button>
        <button
          onClick={handleRecenter}
          className={styles.recenterBtn}
          title="Recenter View"
          type="button"
          aria-label="Recenter View"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
