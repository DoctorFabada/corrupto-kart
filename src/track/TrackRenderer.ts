import { Track } from './Track';
import { NEON_CYAN, NEON_MAGENTA, NEON_YELLOW, TRACK_WIDTH } from '../utils/constants';

export class TrackRenderer {
  private track: Track;
  private trackCanvas: OffscreenCanvas | null = null;
  private trackCtx: OffscreenCanvasRenderingContext2D | null = null;
  private rendered = false;
  private bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  private padding = 500;

  constructor(track: Track) {
    this.track = track;
    this.calculateBounds();
  }

  private calculateBounds(): void {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of [...this.track.leftBoundary, ...this.track.rightBoundary]) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    this.bounds = {
      minX: minX - this.padding,
      minY: minY - this.padding,
      maxX: maxX + this.padding,
      maxY: maxY + this.padding,
    };
  }

  private prerenderTrack(): void {
    const width = this.bounds.maxX - this.bounds.minX;
    const height = this.bounds.maxY - this.bounds.minY;

    // Cap size for performance
    const maxDim = 4096;
    const scale = Math.min(1, maxDim / Math.max(width, height));

    this.trackCanvas = new OffscreenCanvas(width * scale, height * scale);
    this.trackCtx = this.trackCanvas.getContext('2d')!;
    const ctx = this.trackCtx;

    ctx.scale(scale, scale);
    ctx.translate(-this.bounds.minX, -this.bounds.minY);

    // --- Background ---
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(this.bounds.minX, this.bounds.minY, width, height);

    // Background grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    for (let x = Math.floor(this.bounds.minX / gridSize) * gridSize; x < this.bounds.maxX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, this.bounds.minY);
      ctx.lineTo(x, this.bounds.maxY);
      ctx.stroke();
    }
    for (let y = Math.floor(this.bounds.minY / gridSize) * gridSize; y < this.bounds.maxY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(this.bounds.minX, y);
      ctx.lineTo(this.bounds.maxX, y);
      ctx.stroke();
    }

    // --- Track surface ---
    // Draw filled track polygon (asphalt)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    const left = this.track.leftBoundary;
    const right = this.track.rightBoundary;
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) {
      ctx.lineTo(left[i].x, left[i].y);
    }
    ctx.lineTo(left[0].x, left[0].y);
    // Go back along right boundary
    for (let i = right.length - 1; i >= 0; i--) {
      ctx.lineTo(right[i].x, right[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // --- Track surface detail: subtle noise texture ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < this.track.points.length; i += 2) {
      const p = this.track.points[i];
      const size = 3 + Math.random() * 5;
      ctx.fillRect(
        p.x - size / 2 + (Math.random() - 0.5) * TRACK_WIDTH * 0.6,
        p.y - size / 2 + (Math.random() - 0.5) * TRACK_WIDTH * 0.6,
        size, size
      );
    }

    // --- Center line (dashed) ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 30]);
    ctx.beginPath();
    for (let i = 0; i < this.track.points.length; i++) {
      const p = this.track.points[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Edge lines (neon glow) ---
    // Left edge - cyan
    this.drawNeonLine(ctx, left, NEON_CYAN, 3);
    // Right edge - magenta
    this.drawNeonLine(ctx, right, NEON_MAGENTA, 3);

    // --- Finish line ---
    const fl = this.track.getFinishLinePoints();
    this.drawFinishLine(ctx, fl.x1, fl.y1, fl.x2, fl.y2);

    // --- Checkpoints (subtle) ---
    const cpCount = this.track.getCheckpointCount();
    for (let i = 0; i < cpCount; i++) {
      const cp = this.track.getCheckpointLinePoints(i);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(cp.x1, cp.y1);
      ctx.lineTo(cp.x2, cp.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.rendered = true;
  }

  private drawNeonLine(
    ctx: OffscreenCanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    color: string,
    width: number
  ): void {
    // Glow layer
    ctx.strokeStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
    ctx.lineWidth = width + 8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Solid line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  private drawFinishLine(
    ctx: OffscreenCanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number
  ): void {
    // Checkered pattern finish line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const segments = 12;
    const segLen = len / segments;
    const nx = dx / len;
    const ny = dy / len;
    // Perpendicular for thickness
    const px = -ny * 8;
    const py = nx * 8;

    for (let i = 0; i < segments; i++) {
      const sx = x1 + nx * segLen * i;
      const sy = y1 + ny * segLen * i;
      const ex = x1 + nx * segLen * (i + 1);
      const ey = y1 + ny * segLen * (i + 1);

      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.moveTo(sx + px, sy + py);
      ctx.lineTo(ex + px, ey + py);
      ctx.lineTo(ex - px, ey - py);
      ctx.lineTo(sx - px, sy - py);
      ctx.closePath();
      ctx.fill();
    }

    // Neon glow around finish
    ctx.shadowColor = NEON_YELLOW;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = NEON_YELLOW;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.rendered) {
      this.prerenderTrack();
    }

    if (this.trackCanvas) {
      const width = this.bounds.maxX - this.bounds.minX;
      const height = this.bounds.maxY - this.bounds.minY;
      ctx.drawImage(this.trackCanvas, this.bounds.minX, this.bounds.minY, width, height);
    }
  }
}
