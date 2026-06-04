'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { IMemory } from '@/types/memory';
import type { ISolarSystem } from '@/types/solarsystem';
import Planet from '@/components/Planet/Planet';
import { CONTENT } from '@/lib/content';
import styles from './UniverseCanvas.module.scss';

const CANVAS_SIZE = 1200;
const CENTER = CANVAS_SIZE / 2;
const ORBIT_RADII = [160, 280, 400, 520];
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4.0;

const PLANET_COLORS = [
  '#8B5CF6', '#38BDF8', '#F472B6', '#FB923C', '#34D399',
  '#FBBF24', '#A78BFA', '#60A5FA', '#F87171', '#4ADE80',
];
const TEXTURE_TYPES = ['rocky', 'gaseous', 'oceanic', 'magma'];

const STAR_RENDER_PROPS = {
  dwarf:      { size: 52, pulseSpeed: '8s',  glowSize: 120, pulseSize: 180, isNebula: false, isPulsar: false },
  giant:      { size: 68, pulseSpeed: '9s',  glowSize: 170, pulseSize: 250, isNebula: false, isPulsar: false },
  supergiant: { size: 88, pulseSpeed: '12s', glowSize: 240, pulseSize: 340, isNebula: false, isPulsar: false },
  nebula:     { size: 58, pulseSpeed: '10s', glowSize: 190, pulseSize: 270, isNebula: true,  isPulsar: false },
  pulsar:     { size: 36, pulseSpeed: '6s',  glowSize: 130, pulseSize: 180, isNebula: false, isPulsar: true  },
};

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0,2),16)}, ${parseInt(c.slice(2,4),16)}, ${parseInt(c.slice(4,6),16)}`;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  return Math.abs(hash);
}

function clamp(val: number, min: number, max: number) { return Math.min(Math.max(val, min), max); }

interface UniverseCanvasProps {
  solarSystem: ISolarSystem;
  memories: IMemory[];
  onPlanetClick: (memory: IMemory) => void;
}

export default function UniverseCanvas({ solarSystem, memories, onPlanetClick }: UniverseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [baseScale, setBaseScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  // Live refs — avoid stale closures in native event listeners
  const zoomRef = useRef(zoomLevel);
  const panRef  = useRef(panOffset);
  const baseRef = useRef(baseScale);
  useEffect(() => { zoomRef.current = zoomLevel; }, [zoomLevel]);
  useEffect(() => { panRef.current  = panOffset;  }, [panOffset]);
  useEffect(() => { baseRef.current = baseScale;  }, [baseScale]);

  // Pointer tracking (used for multi-touch pinch via Pointer Events)
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist   = useRef<number | null>(null);
  const lastPinchMid    = useRef<{ x: number; y: number } | null>(null);
  const lastSinglePos   = useRef<{ x: number; y: number } | null>(null);
  const wasDragRef      = useRef(false);
  const preventClickRef = useRef(false);
  const gesturingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Responsive base scale ────────────────────────────────────────────────
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const minDim = Math.min(width, height);
      setBaseScale((minDim < 600 ? minDim * 0.92 : Math.min(minDim * 0.96, CANVAS_SIZE)) / CANVAS_SIZE);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const finalScale = useMemo(() => baseScale * zoomLevel, [baseScale, zoomLevel]);
  const finalScaleRef = useRef(finalScale);
  useEffect(() => { finalScaleRef.current = finalScale; }, [finalScale]);

  // ── Pan clamping ─────────────────────────────────────────────────────────
  const clampPan = (x: number, y: number, scale: number) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const { width, height } = container.getBoundingClientRect();
    const half = (CANVAS_SIZE * scale) / 2;
    return {
      x: clamp(x, -(half + width / 2 - 60),  (half + width / 2 - 60)),
      y: clamp(y, -(half + height / 2 - 60), (half + height / 2 - 60)),
    };
  };

  // ── Zoom-to-focal-point ───────────────────────────────────────────────────
  // Given a screen-space focal point, compute new pan so the focal content stays pinned.
  const applyZoom = (
    focalX: number,
    focalY: number,
    scaleDelta: number,   // multiplicative
    curZoom: number,
    curPan: { x: number; y: number },
    curBase: number,
  ) => {
    const newZoom = clamp(curZoom * scaleDelta, MIN_ZOOM, MAX_ZOOM);
    const container = containerRef.current;
    if (!container) return { zoom: newZoom, pan: curPan };

    const rect = container.getBoundingClientRect();
    // Focal point relative to container center
    const fpx = focalX - (rect.left + rect.width / 2);
    const fpy = focalY - (rect.top  + rect.height / 2);

    const oldScale = curBase * curZoom;
    const newFullScale = curBase * newZoom;

    // Adjust pan so point under focal stays fixed
    const newPanX = fpx - (fpx - curPan.x) * (newFullScale / oldScale);
    const newPanY = fpy - (fpy - curPan.y) * (newFullScale / oldScale);

    return {
      zoom: newZoom,
      pan: clampPan(newPanX, newPanY, newFullScale),
    };
  };

  // ── Mark gesturing (suppress CSS transition during gesture) ──────────────
  const startGesture = () => {
    if (gesturingTimerRef.current) clearTimeout(gesturingTimerRef.current);
    setIsGesturing(true);
  };
  const endGesture = () => {
    if (gesturingTimerRef.current) clearTimeout(gesturingTimerRef.current);
    gesturingTimerRef.current = setTimeout(() => setIsGesturing(false), 150);
  };

  // ── Native wheel + touchpad pinch (needs passive:false) ──────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      startGesture();

      // ctrlKey=true → touchpad pinch (small deltaY, fractional); false → mouse wheel
      const isTouchpadPinch = e.ctrlKey;
      const sensitivity = isTouchpadPinch ? 0.015 : 0.0008;
      const scaleDelta = 1 - e.deltaY * sensitivity;

      const { zoom, pan } = applyZoom(
        e.clientX, e.clientY,
        scaleDelta,
        zoomRef.current,
        panRef.current,
        baseRef.current,
      );
      setZoomLevel(zoom);
      setPanOffset(pan);
      endGesture();
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Native touch events (passive:false to allow preventDefault) ──────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      // Do NOT call e.preventDefault() unconditionally here.
      // CSS `touch-action: none` already prevents browser scroll/zoom.
      // Calling preventDefault() on touchstart blocks synthetic click events,
      // which breaks planet taps on mobile.
      // We only prevent default for multi-touch to suppress browser pinch-zoom UI.
      for (const t of Array.from(e.changedTouches)) {
        activePointers.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }

      if (activePointers.current.size === 2) {
        e.preventDefault(); // Block browser's native pinch-zoom overlay for 2-finger gesture
        startGesture();
        const [a, b] = Array.from(activePointers.current.values());
        lastPinchDist.current = Math.hypot(b.x - a.x, b.y - a.y);
        lastPinchMid.current  = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        lastSinglePos.current = null; // cancel single-finger pan
      } else if (activePointers.current.size === 1) {
        startGesture();
        const [p] = Array.from(activePointers.current.values());
        lastSinglePos.current = { x: p.x, y: p.y };
        wasDragRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        activePointers.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }

      if (activePointers.current.size >= 2) {
        const [a, b] = Array.from(activePointers.current.values());
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const mid  = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

        if (lastPinchDist.current !== null && lastPinchMid.current !== null) {
          const scaleDelta = dist / lastPinchDist.current;

          // Zoom at pinch midpoint, then also shift by mid movement
          const { zoom, pan: panAfterZoom } = applyZoom(
            mid.x, mid.y,
            scaleDelta,
            zoomRef.current,
            panRef.current,
            baseRef.current,
          );

          const midDx = mid.x - lastPinchMid.current.x;
          const midDy = mid.y - lastPinchMid.current.y;
          const newPan = clampPan(
            panAfterZoom.x + midDx,
            panAfterZoom.y + midDy,
            baseRef.current * zoom,
          );

          setZoomLevel(zoom);
          setPanOffset(newPan);
        }
        lastPinchDist.current = dist;
        lastPinchMid.current  = mid;

      } else if (activePointers.current.size === 1 && lastSinglePos.current !== null) {
        const [p] = Array.from(activePointers.current.values());
        const dx = p.x - lastSinglePos.current.x;
        const dy = p.y - lastSinglePos.current.y;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) wasDragRef.current = true;

        setPanOffset((prev) => {
          const newPan = clampPan(prev.x + dx, prev.y + dy, finalScaleRef.current);
          panRef.current = newPan;
          return newPan;
        });
        lastSinglePos.current = { x: p.x, y: p.y };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        activePointers.current.delete(t.identifier);
      }
      if (activePointers.current.size < 2) {
        lastPinchDist.current = null;
        lastPinchMid.current  = null;
      }
      if (activePointers.current.size === 1) {
        // Transitioning from pinch to single-finger: reset single pan origin
        const [p] = Array.from(activePointers.current.values());
        lastSinglePos.current = { x: p.x, y: p.y };
        wasDragRef.current = false;
      }
      if (activePointers.current.size === 0) {
        lastSinglePos.current = null;
        if (wasDragRef.current) {
          preventClickRef.current = true;
          setTimeout(() => { preventClickRef.current = false; }, 100);
        }
        endGesture();
      }
    };

    container.addEventListener('touchstart',  onTouchStart,  { passive: false });
    container.addEventListener('touchmove',   onTouchMove,   { passive: false });
    container.addEventListener('touchend',    onTouchEnd,    { passive: false });
    container.addEventListener('touchcancel', onTouchEnd,    { passive: false });

    return () => {
      container.removeEventListener('touchstart',  onTouchStart);
      container.removeEventListener('touchmove',   onTouchMove);
      container.removeEventListener('touchend',    onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse pointer drag handlers (non-touch) ───────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return; // handled by touch events above
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    startGesture();
    lastSinglePos.current = { x: e.clientX, y: e.clientY };
    wasDragRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (!lastSinglePos.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - lastSinglePos.current.x;
    const dy = e.clientY - lastSinglePos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragRef.current = true;

    setPanOffset((prev) => {
      const newPan = clampPan(prev.x + dx, prev.y + dy, finalScaleRef.current);
      panRef.current = newPan;
      return newPan;
    });
    lastSinglePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (!lastSinglePos.current) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    lastSinglePos.current = null;
    endGesture();

    if (wasDragRef.current) {
      preventClickRef.current = true;
      setTimeout(() => { preventClickRef.current = false; }, 60);
    }
  };

  const handlePlanetClick = (memory: IMemory) => {
    if (preventClickRef.current) return;
    onPlanetClick(memory);
  };

  // ── Button controls ───────────────────────────────────────────────────────
  const handleZoomIn = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const { zoom, pan } = applyZoom(cx, cy, 1.25, zoomRef.current, panRef.current, baseRef.current);
    setZoomLevel(zoom);
    setPanOffset(pan);
  };

  const handleZoomOut = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const { zoom, pan } = applyZoom(cx, cy, 1 / 1.25, zoomRef.current, panRef.current, baseRef.current);
    setZoomLevel(zoom);
    setPanOffset(pan);
  };

  const handleRecenter = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // ── Planet positions ──────────────────────────────────────────────────────
  const planetPositions = useMemo(() => {
    const orbitGroups: Record<number, IMemory[]> = { 1: [], 2: [], 3: [], 4: [] };
    memories.forEach((m) => { const o = m.orbit || 1; if (orbitGroups[o]) orbitGroups[o].push(m); });

    const list: { memory: IMemory; x: number; y: number; color: string; textureType: string }[] = [];
    Object.keys(orbitGroups).forEach((orbitStr) => {
      const orbit = parseInt(orbitStr, 10);
      const group = orbitGroups[orbit];
      if (!group.length) return;
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const N = group.length;
      const radius = ORBIT_RADII[orbit - 1];
      group.forEach((memory, index) => {
        const angle   = (index / N) * 360;
        const radians = ((angle - 90) * Math.PI) / 180;
        const seed    = hashString(memory._id || memory.title);
        list.push({
          memory: { ...memory, angle },
          x: CENTER + radius * Math.cos(radians),
          y: CENTER + radius * Math.sin(radians),
          color:       PLANET_COLORS[seed % PLANET_COLORS.length],
          textureType: TEXTURE_TYPES[seed % TEXTURE_TYPES.length],
        });
      });
    });
    return list;
  }, [memories]);

  const activeOrbits = useMemo(() => new Set(memories.map((m) => m.orbit)), [memories]);

  // ── Star render config ────────────────────────────────────────────────────
  const starColor   = solarSystem.starColor || '#FBBF24';
  const starGlowRgb = hexToRgb(starColor);
  const renderProps = STAR_RENDER_PROPS[solarSystem.starType as keyof typeof STAR_RENDER_PROPS] ?? STAR_RENDER_PROPS.dwarf;
  const { size } = renderProps;
  const centerOffset = size / 2;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={styles.container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: isGesturing ? 'grabbing' : 'grab' }}
      aria-label={`${solarSystem.name} canvas`}
      role="region"
    >
      {/* Zoomable & pannable canvas layer */}
      <div
        className={`${styles.canvas} ${zoomLevel < 0.65 ? styles.zoomedOut : ''}`}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${finalScale})`,
          transformOrigin: 'center center',
          // Disable transition while gesture is active so it doesn't fight real-time input
          transition: isGesturing ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Concentric Orbit Rings */}
        {ORBIT_RADII.map((radius, i) => {
          const orbit    = i + 1;
          const diameter = radius * 2;
          const isActive = activeOrbits.has(orbit);
          return (
            <div
              key={`orbit-${orbit}`}
              className={`${styles.orbitRing} ${isActive ? styles.orbitActive : ''}`}
              style={{
                width: diameter, height: diameter,
                top: CENTER - radius, left: CENTER - radius,
                borderColor: isActive ? `rgba(${starGlowRgb}, 0.24)` : undefined,
                boxShadow:   isActive ? `0 0 6px rgba(${starGlowRgb}, 0.08)` : undefined,
              }}
              aria-hidden="true"
            />
          );
        })}

        {/* Central Sun / Star */}
        <div
          className={styles.sun}
          style={{ width: size, height: size, top: CENTER - centerOffset, left: CENTER - centerOffset }}
          aria-hidden="true"
        >
          <div
            className={styles.sunCore}
            style={{
              background: renderProps.isNebula
                ? `radial-gradient(circle at 50% 50%, #ffffff 0%, ${starColor} 45%, rgba(${starGlowRgb}, 0.35) 75%, rgba(${starGlowRgb}, 0) 100%)`
                : `radial-gradient(circle at 35% 35%, #ffffff 0%, ${starColor} 60%, rgba(${starGlowRgb}, 0.2) 100%)`,
              boxShadow: `0 0 24px rgba(${starGlowRgb}, 0.45), 0 0 48px rgba(${starGlowRgb}, 0.15)`,
            }}
          />
          <div
            className={styles.sunGlow}
            style={{
              width: renderProps.glowSize, height: renderProps.glowSize,
              background: `radial-gradient(circle, rgba(${starGlowRgb}, 0.35) 0%, rgba(${starGlowRgb}, 0.1) 50%, rgba(${starGlowRgb}, 0) 80%)`,
              '--pulse-speed': renderProps.pulseSpeed,
            } as React.CSSProperties}
          />
          <div
            className={styles.sunPulse}
            style={{
              width: renderProps.pulseSize, height: renderProps.pulseSize,
              borderColor: `rgba(${starGlowRgb}, 0.08)`,
              '--pulse-speed': renderProps.pulseSpeed,
            } as React.CSSProperties}
          />
          {renderProps.isPulsar && (
            <div
              className={styles.pulsarBeacon}
              style={{ background: `linear-gradient(90deg, rgba(${starGlowRgb}, 0) 0%, rgba(255, 255, 255, 0.75) 50%, rgba(${starGlowRgb}, 0) 100%)` }}
            />
          )}
          {renderProps.isNebula && (
            <div
              className={styles.nebulaCloud}
              style={{
                width:  renderProps.glowSize * 1.25,
                height: renderProps.glowSize * 1.25,
                background: `radial-gradient(circle, rgba(${starGlowRgb}, 0.1) 0%, rgba(139, 92, 246, 0.03) 60%, rgba(${starGlowRgb}, 0) 90%)`,
                border: `1px dashed rgba(${starGlowRgb}, 0.15)`,
              }}
            />
          )}
        </div>

        {/* Planets */}
        {planetPositions.map(({ memory, x, y, color, textureType }) => (
          <div key={memory._id} className={styles.planetWrapper} style={{ top: y, left: x }}>
            <Planet memory={memory} onClick={handlePlanetClick} color={color} textureType={textureType} />
          </div>
        ))}
      </div>

      {/* Glassmorphic Zoom Controls */}
      <div className={styles.controls} aria-label="System controls">
        <button onClick={handleZoomIn}  title={CONTENT.canvas.zoomIn}  type="button" aria-label={CONTENT.canvas.zoomIn}>＋</button>
        <button onClick={handleZoomOut} title={CONTENT.canvas.zoomOut} type="button" aria-label={CONTENT.canvas.zoomOut}>－</button>
        <button onClick={handleRecenter} className={styles.recenterBtn} title={CONTENT.canvas.recenter} type="button" aria-label={CONTENT.canvas.recenter}>⟲</button>
      </div>
    </div>
  );
}
