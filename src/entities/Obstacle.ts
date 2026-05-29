import { NEON_MAGENTA, NEON_YELLOW } from '../utils/constants';

export interface TrackObstacle {
  x: number;
  y: number;
  type: 'oil' | 'money';
  radius: number;
  collected: boolean;
}

export class ObstacleRenderer {
  static render(ctx: CanvasRenderingContext2D, obstacle: TrackObstacle, time: number): void {
    if (obstacle.collected) return;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    if (obstacle.type === 'oil') {
      // Draw oil spill: dark puddle with neon magenta border
      ctx.fillStyle = 'rgba(20, 10, 30, 0.95)';
      ctx.strokeStyle = NEON_MAGENTA;
      ctx.lineWidth = 2.5;

      // Draw irregular puddle using sine wave offset
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const offsetRadius = obstacle.radius + Math.sin(angle * 3 + time * 0.003) * 3;
        const px = Math.cos(angle) * offsetRadius;
        const py = Math.sin(angle) * offsetRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Neon glow border
      ctx.shadowColor = NEON_MAGENTA;
      ctx.shadowBlur = 8;
      ctx.stroke();
    } else {
      // Draw money envelope: glowing yellow case
      const floatY = Math.sin(time * 0.005) * 4;
      ctx.translate(0, floatY);

      // Draw suitcase/envelope shape
      ctx.fillStyle = NEON_YELLOW;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      // Outer glow
      ctx.shadowColor = NEON_YELLOW;
      ctx.shadowBlur = 10;

      // Case body
      const w = 18;
      const h = 12;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // Handle
      ctx.beginPath();
      ctx.arc(0, -h / 2, 4, Math.PI, 0);
      ctx.stroke();

      // Suitcase lock/details
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0; // disable shadow for small details
      ctx.fillRect(-2, -2, 4, 4);

      // Suitcase label or symbol
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px Courier New';
      ctx.fillText('$', -3, 3);
    }

    ctx.restore();
  }
}
