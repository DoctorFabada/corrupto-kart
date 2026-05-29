export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
export function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
export function distance(x1: number, y1: number, x2: number, y2: number): number { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}
export function angleDiff(a: number, b: number): number { return normalizeAngle(b - a); }

// Point-to-segment distance for track boundary collision
export function pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): { distance: number; closestX: number; closestY: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { distance: distance(px, py, ax, ay), closestX: ax, closestY: ay };
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return { distance: distance(px, py, closestX, closestY), closestX, closestY };
}

// Catmull-Rom spline interpolation for smooth track curves
export function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}
