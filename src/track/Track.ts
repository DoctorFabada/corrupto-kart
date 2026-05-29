import { catmullRom } from '../utils/math';
import { TRACK_WIDTH } from '../utils/constants';
import { Player } from '../entities/Player';

export interface TrackPoint {
  x: number;
  y: number;
  nx: number; // normal x (perpendicular to track direction)
  ny: number; // normal y
}

export class Track {
  private controlPoints: Array<{ x: number; y: number }>;
  points: TrackPoint[] = []; // Interpolated center points
  leftBoundary: Array<{ x: number; y: number }> = [];
  rightBoundary: Array<{ x: number; y: number }> = [];
  private finishIndex = 0;
  private checkpointIndices: number[] = [];

  constructor() {
    // Control points for the circuit – 2.5x bigger with straights, S-curves, hairpin & sweeping bends
    this.controlPoints = [
      { x: 0, y: -2000 },        // Start / finish straight
      { x: 600, y: -2050 },      // Gentle kink right
      { x: 1300, y: -2100 },     // Long top straight mid
      { x: 2100, y: -1950 },     // Top straight end
      { x: 2700, y: -1600 },     // Sweeping right entry
      { x: 3100, y: -1100 },     // Sweeping right mid (high-speed)
      { x: 3300, y: -500 },      // Sweeping right exit
      { x: 3400, y: 200 },       // Right side straight
      { x: 3200, y: 900 },       // Approaching tight hairpin
      { x: 2800, y: 1250 },      // Hairpin entry
      { x: 2400, y: 1350 },      // Hairpin apex (tight!)
      { x: 2050, y: 1200 },      // Hairpin exit
      { x: 1800, y: 850 },       // Short chute after hairpin
      { x: 1500, y: 500 },       // S-curve entry
      { x: 1100, y: 650 },       // S-curve left
      { x: 700, y: 400 },        // S-curve right
      { x: 350, y: 650 },        // S-curve exit
      { x: 0, y: 900 },          // Back straight entry
      { x: -500, y: 1100 },      // Back straight mid-1
      { x: -1100, y: 1200 },     // Back straight mid-2 (long!)
      { x: -1800, y: 1050 },     // Back straight end
      { x: -2200, y: 700 },      // Left sweeper entry
      { x: -2500, y: 200 },      // Left sweeper mid
      { x: -2400, y: -400 },     // Left side
      { x: -2000, y: -1000 },    // Left upper curve
      { x: -1300, y: -1600 },    // Approaching start from left
      { x: -700, y: -1900 },     // Final curve into start
    ];

    this.generateTrack();
  }

  private generateTrack(): void {
    const cp = this.controlPoints;
    const n = cp.length;
    const resolution = 20; // Points per segment (higher for bigger track)

    // Generate smooth points using Catmull-Rom
    this.points = [];
    for (let i = 0; i < n; i++) {
      const p0 = cp[(i - 1 + n) % n];
      const p1 = cp[i];
      const p2 = cp[(i + 1) % n];
      const p3 = cp[(i + 2) % n];

      for (let t = 0; t < resolution; t++) {
        const frac = t / resolution;
        const x = catmullRom(p0.x, p1.x, p2.x, p3.x, frac);
        const y = catmullRom(p0.y, p1.y, p2.y, p3.y, frac);
        this.points.push({ x, y, nx: 0, ny: 0 });
      }
    }

    // Calculate normals
    const total = this.points.length;
    for (let i = 0; i < total; i++) {
      const prev = this.points[(i - 1 + total) % total];
      const next = this.points[(i + 1) % total];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Normal is perpendicular to direction (rotated 90 degrees)
      this.points[i].nx = -dy / len;
      this.points[i].ny = dx / len;
    }

    // Generate boundaries
    const halfWidth = TRACK_WIDTH / 2;
    this.leftBoundary = this.points.map(p => ({
      x: p.x + p.nx * halfWidth,
      y: p.y + p.ny * halfWidth,
    }));
    this.rightBoundary = this.points.map(p => ({
      x: p.x - p.nx * halfWidth,
      y: p.y - p.ny * halfWidth,
    }));

    // Finish line at index 0
    this.finishIndex = 0;

    // Checkpoints at roughly equal intervals
    const checkpointCount = 6;
    this.checkpointIndices = [];
    for (let i = 1; i <= checkpointCount; i++) {
      this.checkpointIndices.push(Math.floor((total * i) / (checkpointCount + 1)));
    }
  }

  getStartPosition(): { x: number; y: number; angle: number } {
    const p = this.points[0];
    const next = this.points[1];
    const angle = Math.atan2(next.x - p.x, -(next.y - p.y));
    return { x: p.x, y: p.y, angle };
  }

  getCheckpointCount(): number {
    return this.checkpointIndices.length;
  }

  constrainToTrack(x: number, y: number): { outside: boolean; correctedX: number; correctedY: number } {
    // Find nearest center point
    let minDist = Infinity;
    let nearestIdx = 0;

    // Sample every few points for performance
    for (let i = 0; i < this.points.length; i += 3) {
      const p = this.points[i];
      const d = (x - p.x) ** 2 + (y - p.y) ** 2;
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    // Refine search around nearest
    const searchRange = 6;
    for (let i = nearestIdx - searchRange; i <= nearestIdx + searchRange; i++) {
      const idx = ((i % this.points.length) + this.points.length) % this.points.length;
      const p = this.points[idx];
      const d = (x - p.x) ** 2 + (y - p.y) ** 2;
      if (d < minDist) {
        minDist = d;
        nearestIdx = idx;
      }
    }

    const nearest = this.points[nearestIdx];
    const dist = Math.sqrt(minDist);
    const halfWidth = TRACK_WIDTH / 2;

    if (dist > halfWidth - 5) {
      // Outside track, push back toward center
      const dx = x - nearest.x;
      const dy = y - nearest.y;
      const len = dist || 1;
      const correctedX = nearest.x + (dx / len) * (halfWidth - 10);
      const correctedY = nearest.y + (dy / len) * (halfWidth - 10);
      return { outside: true, correctedX, correctedY };
    }

    return { outside: false, correctedX: x, correctedY: y };
  }

  checkFinishLine(x: number, y: number, lastX: number, lastY: number): boolean {
    return this.checkLineCrossing(x, y, lastX, lastY, this.finishIndex);
  }

  checkCheckpoints(x: number, y: number, lastX: number, lastY: number, player: Player): void {
    for (let i = 0; i < this.checkpointIndices.length; i++) {
      const cpIdx = this.checkpointIndices[i];
      if (this.checkLineCrossing(x, y, lastX, lastY, cpIdx)) {
        player.passCheckpoint(i);
      }
    }
  }

  private checkLineCrossing(x: number, y: number, lastX: number, lastY: number, pointIndex: number): boolean {
    // Check if the movement from (lastX,lastY) to (x,y) crosses the line at pointIndex
    const p = this.points[pointIndex];
    const halfWidth = TRACK_WIDTH / 2;

    // Line segment: perpendicular to track at this point
    const lx1 = p.x + p.nx * halfWidth;
    const ly1 = p.y + p.ny * halfWidth;
    const lx2 = p.x - p.nx * halfWidth;
    const ly2 = p.y - p.ny * halfWidth;

    return this.segmentsIntersect(lastX, lastY, x, y, lx1, ly1, lx2, ly2);
  }

  private segmentsIntersect(
    ax: number, ay: number, bx: number, by: number,
    cx: number, cy: number, dx: number, dy: number
  ): boolean {
    const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (Math.abs(denom) < 0.0001) return false;

    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
    const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  getFinishLinePoints(): { x1: number; y1: number; x2: number; y2: number } {
    const p = this.points[this.finishIndex];
    const halfWidth = TRACK_WIDTH / 2;
    return {
      x1: p.x + p.nx * halfWidth,
      y1: p.y + p.ny * halfWidth,
      x2: p.x - p.nx * halfWidth,
      y2: p.y - p.ny * halfWidth,
    };
  }

  getCheckpointLinePoints(index: number): { x1: number; y1: number; x2: number; y2: number } {
    const cpIdx = this.checkpointIndices[index];
    const p = this.points[cpIdx];
    const halfWidth = TRACK_WIDTH / 2;
    return {
      x1: p.x + p.nx * halfWidth,
      y1: p.y + p.ny * halfWidth,
      x2: p.x - p.nx * halfWidth,
      y2: p.y - p.ny * halfWidth,
    };
  }
}
