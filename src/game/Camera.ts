import { lerp } from '../utils/math';
import { CAMERA_LERP, CAMERA_ZOOM } from '../utils/constants';

export class Camera {
  x = 0;
  y = 0;
  rotation = 0;
  zoom = CAMERA_ZOOM;
  private targetX = 0;
  private targetY = 0;
  private targetRotation = 0;

  setTarget(x: number, y: number, rotation: number): void {
    this.targetX = x;
    this.targetY = y;
    this.targetRotation = rotation;
  }

  update(canvasWidth?: number, canvasHeight?: number): void {
    this.x = lerp(this.x, this.targetX, CAMERA_LERP);
    this.y = lerp(this.y, this.targetY, CAMERA_LERP);
    // Smoothly interpolate rotation (handle wrapping)
    let diff = this.targetRotation - this.rotation;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    this.rotation += diff * CAMERA_LERP;

    // Dynamically adjust zoom based on screen size so it never feels too close
    if (canvasWidth && canvasHeight) {
      const minDimension = Math.min(canvasWidth, canvasHeight);
      if (minDimension < 500) {
        // Mobile / Small screens: Zoom in slightly more so the car doesn't look too small
        this.zoom = 0.36;
      } else if (minDimension < 800) {
        // Small tablets / landscape mobile
        this.zoom = 0.46;
      } else {
        this.zoom = 0.62; // Desktop zoom level for clear visibility of tracks and obstacles
      }
    } else {
      this.zoom = CAMERA_ZOOM;
    }
  }

  applyTransform(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.rotate(-this.rotation);
    ctx.translate(-this.x, -this.y);
  }

  restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  // Snap camera instantly (no lerp) — used for initial placement
  snapTo(x: number, y: number, rotation: number): void {
    this.x = this.targetX = x;
    this.y = this.targetY = y;
    this.rotation = this.targetRotation = rotation;
  }
}
