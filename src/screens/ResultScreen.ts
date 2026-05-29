// ResultScreen display logic is currently in Game.ts
// This module will be expanded in Phase 4 with full stats, ranks, viral copy button, etc.

export class ResultScreen {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('result-screen')!;
  }

  show(): void {
    this.container.classList.add('active');
  }

  hide(): void {
    this.container.classList.remove('active');
  }
}
