export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isLine?: boolean;
}

export class ParticleSystem {
  static spawnSplat(particles: Particle[], x: number, y: number, color: string, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 4,
        life: 0,
        maxLife: 300 + Math.random() * 400
      });
    }
  }

  static spawnSpark(particles: Particle[], x: number, y: number, color: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 200 + Math.random() * 200
      });
    }
  }

  static spawnSpeedTrail(particles: Particle[], x: number, y: number, angle: number, speed: number): void {
    const oppAngle = angle + Math.PI + (Math.random() - 0.5) * 0.25;
    const spawnSpeed = speed * 0.08 + Math.random() * 1.5;
    particles.push({
      x,
      y,
      vx: Math.sin(oppAngle) * spawnSpeed,
      vy: -Math.cos(oppAngle) * spawnSpeed,
      color: 'rgba(0, 255, 234, 0.4)', // cyan neon glow
      size: 1.5,
      isLine: true,
      life: 0,
      maxLife: 150 + Math.random() * 150
    });
  }
}
