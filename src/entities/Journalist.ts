// ─────────────────────────────────────────────────────────────
// Journalist.ts — Periodistas zombi que persiguen al jugador
// Aparecen en grupos, corren hacia el kart y mueren al impacto
// ─────────────────────────────────────────────────────────────

import { TrackPoint } from '../track/Track';

export type JournalistState = 'idle' | 'asking' | 'dying';

const DEATH_SCREAMS = [
  '¡AAAGH!',
  '¡NOOOO!',
  '¡MI MICRO!',
  '¡LIBERTAD DE PRENSA!',
  '¡ATROPELLOOOO!',
  '¡EXCLUSIVAAAA!',
  '¡ME LLEVAN POR DELANTE!',
];

/** Max characters per line in the speech bubble */
const BUBBLE_CHARS_PER_LINE = 30;
/** Max total characters shown in bubble */
const BUBBLE_MAX_CHARS = 80;
/** Range at which the bubble is shown (before collision) */
const BUBBLE_RANGE = 250;
/** Range at which the journalist starts chasing the player */
const CHASE_RANGE = 800;
/** Chase speed (px per ms) — scaled by dt — 3x faster for aggressive zombie chase */
const CHASE_SPEED_MIN = 1.8 / 16.67; // ~0.11 px/ms
const CHASE_SPEED_MAX = 3.2 / 16.67; // ~0.19 px/ms

export class Journalist {
  x: number;
  y: number;
  readonly id: string;
  readonly question: string;
  readonly deathScreamText: string;
  hasAsked = false;

  private state: JournalistState = 'idle';
  private lifetime = 0;
  private maxLifetime = 25000; // Persist longer so they can complete their chase!
  private bobPhase: number;

  // Dying animation state
  private dyingTimer = 0;
  private readonly dyingDuration = 800;
  private knockbackVx = 0;
  private knockbackVy = 0;
  private spinAngle = 0;
  private spinSpeed = 0;

  // Chase speed for this journalist (randomised)
  private readonly chaseSpeed: number;

  /** Has this journalist already interacted with the player? */
  private hasTriggered = false;
  private dead = false;

  constructor(x: number, y: number, question: string) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.question = question;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.deathScreamText = DEATH_SCREAMS[Math.floor(Math.random() * DEATH_SCREAMS.length)];
    this.chaseSpeed = CHASE_SPEED_MIN + Math.random() * (CHASE_SPEED_MAX - CHASE_SPEED_MIN);
  }

  // ── Getters ──────────────────────────────────────────────

  get isAlive(): boolean {
    return !this.dead;
  }

  get triggered(): boolean {
    return this.hasTriggered;
  }

  get isDying(): boolean {
    return this.state === 'dying';
  }

  // ── Actions ──────────────────────────────────────────────

  /**
   * Trigger death animation. `playerAngle` is the direction the player is
   * moving (radians) — the journalist is knocked away in that direction.
   */
  trigger(playerAngle: number): void {
    if (this.hasTriggered) return;
    this.hasTriggered = true;
    this.state = 'dying';
    this.dyingTimer = 0;

    // Knockback velocity in player's movement direction
    const knockbackSpeed = 0.35; // px/ms
    this.knockbackVx = Math.cos(playerAngle) * knockbackSpeed;
    this.knockbackVy = Math.sin(playerAngle) * knockbackSpeed;

    // Random spin direction
    this.spinSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.01 + Math.random() * 0.015);
  }

  // ── Update ───────────────────────────────────────────────

  update(dt: number, playerX?: number, playerY?: number): void {
    this.lifetime += dt;
    this.bobPhase += dt * 0.003;

    if (this.state === 'dying') {
      this.dyingTimer += dt;
      // Apply knockback (decelerating)
      const progress = Math.min(this.dyingTimer / this.dyingDuration, 1);
      const decel = 1 - progress;
      this.x += this.knockbackVx * dt * decel;
      this.y += this.knockbackVy * dt * decel;
      this.spinAngle += this.spinSpeed * dt;

      if (this.dyingTimer >= this.dyingDuration) {
        this.dead = true;
      }
      return;
    }

    // Lifetime expiry — mark dead immediately (no fade, just gone)
    if (this.lifetime > this.maxLifetime && !this.hasTriggered) {
      this.dead = true;
      return;
    }

    // Chase the player if in range
    if (
      this.state === 'idle' &&
      playerX !== undefined &&
      playerY !== undefined
    ) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CHASE_RANGE && dist > 1) {
        const nx = dx / dist;
        const ny = dy / dist;
        this.x += nx * this.chaseSpeed * dt;
        this.y += ny * this.chaseSpeed * dt;
      }
    }
  }

  // ── Proximity helpers ────────────────────────────────────

  /** Check proximity to player (collision radius) */
  isNearPlayer(px: number, py: number, radius = 42): boolean {
    const dx = this.x - px;
    const dy = this.y - py;
    return dx * dx + dy * dy < radius * radius;
  }

  /** Check if the player is close enough to show the speech bubble (~200px) */
  isInBubbleRange(px: number, py: number): boolean {
    const dx = this.x - px;
    const dy = this.y - py;
    return dx * dx + dy * dy < BUBBLE_RANGE * BUBBLE_RANGE;
  }

  // ── Render ───────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return;

    // Compute alpha + scale for dying state
    let alpha = 1;
    let scale = 1;
    if (this.state === 'dying') {
      const progress = Math.min(this.dyingTimer / this.dyingDuration, 1);
      alpha = 1 - progress;
      scale = 1 - progress * 0.6; // shrink to 40% size
      if (alpha <= 0) return;
    }

    const bobY = this.state === 'dying' ? 0 : Math.sin(this.bobPhase) * 4;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y + bobY);

    if (this.state === 'dying') {
      ctx.rotate(this.spinAngle);
      ctx.scale(scale, scale);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (dark suit)
    ctx.fillStyle = '#2a2a4a';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f0d0b0';
    ctx.beginPath();
    ctx.arc(0, -12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(0, -16, 8, Math.PI, Math.PI * 2);
    ctx.fill();

    // Microphone
    ctx.fillStyle = '#888';
    ctx.fillRect(10, -4, 3, 14);
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(11.5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mic red dot
    ctx.fillStyle = '#ff3344';
    ctx.beginPath();
    ctx.arc(11.5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Press badge glow
    const glowPhase = Math.sin(this.bobPhase * 2) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 230, 0, ${0.6 * glowPhase})`;
    ctx.beginPath();
    ctx.arc(0, 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 0, 6);

    // Death scream text while dying
    if (this.state === 'dying') {
      this.renderDeathScream(ctx);
    }

    ctx.restore();

    // Render bubble OUTSIDE the dying rotation transform — we render it
    // in its own save/restore block so it's always upright.
    if (this.state !== 'dying') {
      // Show bubble when asking OR when idle (if flagged externally via showBubble)
      // The caller should set _showBubble via isInBubbleRange check, but we
      // also always show when in 'asking' state.
      if (this.state === 'asking' || this._showBubble) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + bobY);
        this.renderBubble(ctx);
        ctx.restore();
      }
    }
  }

  /**
   * External flag set by the game loop when isInBubbleRange returns true.
   * This keeps the bubble visible while idle and near the player.
   */
  _showBubble = false;

  // ── Bubble rendering (multi-line, bigger) ────────────────

  private renderBubble(ctx: CanvasRenderingContext2D): void {
    const text = this.question.length > BUBBLE_MAX_CHARS
      ? this.question.substring(0, BUBBLE_MAX_CHARS - 3) + '...'
      : this.question;

    // Word-wrap into lines of ~BUBBLE_CHARS_PER_LINE chars
    const lines = this.wrapText(text, BUBBLE_CHARS_PER_LINE);

    ctx.font = '14px Orbitron, sans-serif';
    const padding = 14;
    const lineHeight = 18;

    // Measure widest line
    let maxWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
    }

    const bw = maxWidth + padding * 2;
    const bh = lines.length * lineHeight + padding * 2;
    const bx = -bw / 2;
    const by = -38 - bh;

    // Bubble background
    ctx.fillStyle = 'rgba(10, 10, 30, 0.9)';
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
    ctx.lineWidth = 1.5;

    // Rounded rect
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    ctx.lineTo(bx + r, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.fillStyle = 'rgba(10, 10, 30, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-5, by + bh);
    ctx.lineTo(5, by + bh);
    ctx.lineTo(0, by + bh + 8);
    ctx.closePath();
    ctx.fill();

    // Text (multi-line)
    ctx.fillStyle = '#ffe600';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, by + padding + i * lineHeight);
    }
  }

  /** Word-wrap helper: breaks text into lines of approximately maxChars */
  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      if (current.length === 0) {
        current = word;
      } else if (current.length + 1 + word.length <= maxChars) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current.length > 0) {
      lines.push(current);
    }
    return lines.length > 0 ? lines : [''];
  }

  // ── Death scream floating text ───────────────────────────

  private renderDeathScream(ctx: CanvasRenderingContext2D): void {
    const progress = Math.min(this.dyingTimer / this.dyingDuration, 1);
    // Float upward and fade
    const floatY = -30 - progress * 40;
    const screamAlpha = 1 - progress;

    ctx.save();
    // Undo the spin so text stays readable
    ctx.rotate(-this.spinAngle);
    ctx.globalAlpha = screamAlpha;
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.deathScreamText, 0, floatY);

    // Fill
    ctx.fillStyle = '#ff2222';
    ctx.fillText(this.deathScreamText, 0, floatY);
    ctx.restore();
  }

  // ── Spawn helpers ────────────────────────────────────────

  /**
   * Creates a group of 2-4 journalists clustered near the player on the track.
   */
  static spawnGroupNearPlayer(
    playerX: number,
    playerY: number,
    playerAngle: number,
    trackPoints: TrackPoint[],
    question: string,
  ): Journalist[] {
    // Find nearest track point to player
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < trackPoints.length; i += 5) {
      const p = trackPoints[i];
      const d = (playerX - p.x) ** 2 + (playerY - p.y) ** 2;
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    // Place cluster 70-140 track points ahead so they don't appear out of thin air
    const offset = 70 + Math.floor(Math.random() * 70);
    const spawnIdx = (nearestIdx + offset) % trackPoints.length;
    const tp = trackPoints[spawnIdx];

    // Cluster of 2-4 journalists
    const count = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
    const group: Journalist[] = [];

    for (let i = 0; i < count; i++) {
      // Spread them in a small area around the anchor point
      const side = Math.random() > 0.5 ? 1 : -1;
      
      // The first journalist spawns directly in the middle of the track
      // The others spawn on the edges or outside (shoulders) to converge as a horde
      let lateralOffset = 0;
      if (i === 0) {
        lateralOffset = (Math.random() - 0.5) * 35; // Close to center
      } else {
        lateralOffset = 45 + Math.random() * 125; // Sides/outer area
      }
      
      const along = (Math.random() - 0.5) * 60; // scatter along the track

      // Use the track normal for lateral offset and tangent for along-track
      const sx = tp.x + tp.nx * lateralOffset * side + Math.cos(playerAngle) * along;
      const sy = tp.y + tp.ny * lateralOffset * side + Math.sin(playerAngle) * along;

      group.push(new Journalist(sx, sy, question));
    }

    return group;
  }

  /**
   * Legacy single-spawn helper (returns one journalist).
   * Prefer spawnGroupNearPlayer for the zombie invasion mechanic.
   */
  static spawnNearPlayer(
    playerX: number,
    playerY: number,
    playerAngle: number,
    trackPoints: TrackPoint[],
    question: string,
  ): Journalist {
    const group = Journalist.spawnGroupNearPlayer(
      playerX, playerY, playerAngle, trackPoints, question,
    );
    return group[0];
  }
}
