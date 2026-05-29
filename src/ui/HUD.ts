import { formatTime } from '../utils/math';

export class HUD {
  private timerEl: HTMLElement;
  private lapEl: HTMLElement;
  private speedEl: HTMLElement;

  constructor() {
    this.timerEl = document.getElementById('hud-timer')!;
    this.lapEl = document.getElementById('hud-lap')!;
    this.speedEl = document.getElementById('hud-speed')!;
  }

  update(raceTime: number, currentLap: number, totalLaps: number, speed: number): void {
    this.timerEl.textContent = formatTime(raceTime);
    this.lapEl.textContent = `${currentLap}/${totalLaps}`;
    this.speedEl.textContent = String(Math.round(speed));
  }
}
