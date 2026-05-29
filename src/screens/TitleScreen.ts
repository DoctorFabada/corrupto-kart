// TitleScreen is currently managed via HTML overlays in Game.ts
// This module will be expanded in Phase 2 with character/vehicle selection

export class TitleScreen {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('title-screen')!;
  }

  show(): void {
    this.container.classList.add('active');
  }

  hide(): void {
    this.container.classList.remove('active');
  }
}
