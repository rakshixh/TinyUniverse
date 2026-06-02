import { ORBIT_THRESHOLDS, ORBIT_RADII } from './constants';

/**
 * Returns the orbit ring number (1–4) for a given total memory count.
 * Based on the thresholds: 0-10 → orbit 1, 11-25 → orbit 2, etc.
 */
export function getOrbitForCount(count: number): number {
  if (count <= ORBIT_THRESHOLDS[0]) return 1;
  if (count <= ORBIT_THRESHOLDS[1]) return 2;
  if (count <= ORBIT_THRESHOLDS[2]) return 3;
  return 4;
}

/**
 * Returns the pixel radius for a given orbit ring number.
 */
export function getOrbitRadius(orbit: number): number {
  return ORBIT_RADII[Math.min(orbit - 1, ORBIT_RADII.length - 1)];
}

/**
 * Uses the golden angle (137.508°) to distribute planets aesthetically
 * within an orbit ring. Prevents clustering.
 *
 * @param index   - 0-based index of this planet within the orbit ring
 * @returns angle in degrees [0, 360)
 */
export function getGoldenAngle(index: number): number {
  const GOLDEN_ANGLE = 137.50776405003785; // degrees
  return (index * GOLDEN_ANGLE) % 360;
}

/**
 * Converts polar coordinates (orbit + angle) to Cartesian (x, y)
 * relative to the center of the canvas.
 *
 * @param orbit  - orbit ring number 1-4
 * @param angle  - angle in degrees
 * @returns { x, y } in pixels from center
 */
export function polarToCartesian(
  orbit: number,
  angle: number
): { x: number; y: number } {
  const radius = getOrbitRadius(orbit);
  const radians = ((angle - 90) * Math.PI) / 180; // -90 to start at top
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  };
}

/**
 * Assigns orbit and angle to a new memory being created.
 * Call this BEFORE inserting the document.
 *
 * @param currentCount - total number of memories currently in the universe (0-indexed)
 */
export function assignOrbitAndAngle(currentCount: number): {
  orbit: number;
  angle: number;
} {
  const orbit = getOrbitForCount(currentCount);

  // Determine the index within this orbit ring
  let indexInOrbit = currentCount;
  if (orbit >= 2) indexInOrbit -= ORBIT_THRESHOLDS[0];
  if (orbit >= 3) indexInOrbit -= (ORBIT_THRESHOLDS[1] - ORBIT_THRESHOLDS[0]);
  if (orbit >= 4) indexInOrbit -= (ORBIT_THRESHOLDS[2] - ORBIT_THRESHOLDS[1]);

  const angle = getGoldenAngle(indexInOrbit);

  return { orbit, angle };
}
