import { Input } from '../game/Input';
import { Track } from '../track/Track';
import {
  VEHICLE_ACCELERATION, VEHICLE_BRAKE_FORCE, VEHICLE_MAX_SPEED,
  VEHICLE_FRICTION, VEHICLE_TURN_SPEED, VEHICLE_TURN_SPEED_AT_LOW,
  VEHICLE_DRIFT_FACTOR, VEHICLE_WIDTH, VEHICLE_HEIGHT, VEHICLE_REVERSE_SPEED
} from '../utils/constants';
import { clamp, lerp } from '../utils/math';
import { sfx } from '../utils/sfx';

export class Player {
  x: number;
  y: number;
  angle: number;
  private vx = 0;
  private vy = 0;
  private speed = 0;
  speedModifier = 1.0;
  private speedModifierTimer = 0;
  private sprite: HTMLImageElement;
  private characterSprite: HTMLImageElement | null;

  // Lap tracking
  private lastCheckpoint = -1;
  private checkpointsPassed = 0;
  private lastX: number;
  private lastY: number;

  // Visual
  private drifting = false;
  private driftTrail: Array<{ x: number; y: number; age: number }> = [];
  private crashSoundTimer = 0;
  spinTimer = 0;

  get displaySpeed(): number {
    return Math.round(Math.abs(this.speed) * 22); // Convert to fake km/h
  }

  constructor(x: number, y: number, angle: number, sprite: HTMLImageElement, characterSprite?: HTMLImageElement) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.lastX = x;
    this.lastY = y;
    this.sprite = sprite;
    this.characterSprite = characterSprite || null;
  }

  triggerSpinOut(durationMs: number): void {
    this.spinTimer = durationMs;
  }

  update(input: Input, track: Track, dt: number): void {
    const dtScale = dt / 16.67; // Normalize to 60fps

    // Update crash sound cooldown
    if (this.crashSoundTimer > 0) {
      this.crashSoundTimer -= dt;
    }

    // Update speed modifier timer
    if (this.speedModifierTimer > 0) {
      this.speedModifierTimer -= dt;
      if (this.speedModifierTimer <= 0) {
        this.speedModifier = 1.0;
        this.speedModifierTimer = 0;
      }
    }

    // Store last position for line crossing detection
    this.lastX = this.x;
    this.lastY = this.y;

    // --- Acceleration / Braking ---
    if (this.spinTimer <= 0) {
      const throttle = input.throttleAmount;
      if (throttle > 0) {
        this.speed += VEHICLE_ACCELERATION * throttle * dtScale;
      } else if (throttle < 0) {
        if (this.speed > 0.1) {
          this.speed -= VEHICLE_BRAKE_FORCE * Math.abs(throttle) * dtScale;
        } else {
          this.speed += VEHICLE_ACCELERATION * 0.5 * throttle * dtScale; // Reverse
        }
      }
    }

    // Clamp speed (apply speed modifier)
    const effectiveMaxSpeed = VEHICLE_MAX_SPEED * this.speedModifier;
    this.speed = clamp(this.speed, -VEHICLE_REVERSE_SPEED, effectiveMaxSpeed);

    // --- Turning & Spin Out ---
    const absSpeed = Math.abs(this.speed);
    const turnRate = lerp(VEHICLE_TURN_SPEED_AT_LOW, VEHICLE_TURN_SPEED, Math.min(absSpeed / 3, 1));
    const steer = input.steerAmount;
    let driftFactor = VEHICLE_DRIFT_FACTOR;

    if (this.spinTimer > 0) {
      this.spinTimer -= dt;
      this.angle += 0.22 * dtScale; // Spin rapidly
      this.speed *= Math.pow(0.94, dtScale); // Lose speed rapidly
      this.drifting = false;
      sfx.stopDrift();
    } else {
      this.angle += turnRate * steer * dtScale;

      // --- Drift ---
      this.drifting = input.handbrake && absSpeed > 1;
      driftFactor = this.drifting ? VEHICLE_DRIFT_FACTOR * 0.7 : VEHICLE_DRIFT_FACTOR;

      if (this.drifting) {
        // Increase turn rate when drifting
        this.angle += turnRate * 0.8 * steer * dtScale;
        sfx.startDrift();
      } else {
        sfx.stopDrift();
      }
    }

    // --- Apply velocity ---
    const forwardX = Math.sin(this.angle);
    const forwardY = -Math.cos(this.angle);

    // Target velocity (along forward direction)
    const targetVx = forwardX * this.speed;
    const targetVy = forwardY * this.speed;

    // Lerp current velocity toward target (drift = less grip = slower lerp)
    this.vx = lerp(this.vx, targetVx, 1 - driftFactor + 0.08);
    this.vy = lerp(this.vy, targetVy, 1 - driftFactor + 0.08);

    // Apply friction
    this.speed *= Math.pow(VEHICLE_FRICTION, dtScale);

    // Move
    this.x += this.vx * dtScale;
    this.y += this.vy * dtScale;

    // --- Track collision ---
    const trackResult = track.constrainToTrack(this.x, this.y);
    if (trackResult.outside) {
      this.x = trackResult.correctedX;
      this.y = trackResult.correctedY;

      // Play crash sfx on wall collision if moving fast enough and off cooldown
      if (this.crashSoundTimer <= 0 && Math.abs(this.speed) > 2) {
        sfx.playCrash();
        this.crashSoundTimer = 700; // 700ms cooldown
      }

      this.speed *= 0.7; // Lose speed on wall hit
      this.vx *= 0.5;
      this.vy *= 0.5;
    }

    // --- Drift trail ---
    if (this.drifting && absSpeed > 2) {
      // Add trail points at rear wheels
      const rearX = this.x - forwardX * VEHICLE_HEIGHT * 0.35;
      const rearY = this.y - forwardY * VEHICLE_HEIGHT * 0.35;
      const perpX = Math.cos(this.angle);
      const perpY = Math.sin(this.angle);
      this.driftTrail.push(
        { x: rearX + perpX * VEHICLE_WIDTH * 0.3, y: rearY + perpY * VEHICLE_WIDTH * 0.3, age: 0 },
        { x: rearX - perpX * VEHICLE_WIDTH * 0.3, y: rearY - perpY * VEHICLE_WIDTH * 0.3, age: 0 }
      );
    }

    // Age and remove old trail points
    for (const point of this.driftTrail) {
      point.age += dt;
    }
    this.driftTrail = this.driftTrail.filter(p => p.age < 2000);

    // --- Checkpoint tracking ---
    track.checkCheckpoints(this.x, this.y, this.lastX, this.lastY, this);

    // --- Update continuous engine pitch ---
    const speedRatio = Math.abs(this.speed) / VEHICLE_MAX_SPEED;
    sfx.updateEngine(speedRatio);
  }

  checkLapComplete(track: Track): boolean {
    const crossed = track.checkFinishLine(this.x, this.y, this.lastX, this.lastY);
    if (crossed && this.checkpointsPassed >= track.getCheckpointCount()) {
      // Lap complete!
      this.checkpointsPassed = 0;
      this.lastCheckpoint = -1;
      return true;
    }
    return false;
  }

  applySlowdown(duration: number, factor: number): void {
    this.speedModifier = factor;
    this.speedModifierTimer = duration;
    // Immediately reduce current speed if above new cap
    const newMax = VEHICLE_MAX_SPEED * factor;
    if (this.speed > newMax) {
      this.speed = newMax;
    }
  }

  passCheckpoint(index: number): void {
    if (index === this.lastCheckpoint + 1 || (index === 0 && this.lastCheckpoint === -1)) {
      this.lastCheckpoint = index;
      this.checkpointsPassed++;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw drift trail
    for (const point of this.driftTrail) {
      const alpha = 1 - point.age / 2000;
      ctx.fillStyle = `rgba(40, 40, 40, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw vehicle sprite
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Draw the sprite centered
    const scale = VEHICLE_HEIGHT / this.sprite.naturalHeight;
    const drawW = this.sprite.naturalWidth * scale;
    const drawH = this.sprite.naturalHeight * scale;
    ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);



    // Drift visual: glow effect
    if (this.drifting) {
      ctx.shadowColor = '#ff00e5';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(255, 0, 229, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-drawW / 2, -drawH / 2, drawW, drawH);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
