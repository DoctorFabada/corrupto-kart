export class Input {
  private keys: Map<string, boolean> = new Map();
  private justPressed: Map<string, boolean> = new Map();

  constructor() {
    window.addEventListener('keydown', (e) => {
      // If the user is currently typing in an input or textarea, let the browser handle it naturally
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }

      if (!this.keys.get(e.code)) {
        this.justPressed.set(e.code, true);
      }
      this.keys.set(e.code, true);
      // Prevent scrolling with arrow keys/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }
      this.keys.set(e.code, false);
    });
  }

  isDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  wasJustPressed(code: string): boolean {
    return this.justPressed.get(code) === true;
  }

  // Call at END of each frame
  clearJustPressed(): void {
    this.justPressed.clear();
  }

  // Touch-controlled flags for mobile virtual controls
  accelerateTouch = false;
  brakeTouch = false;
  turnLeftTouch = false;
  turnRightTouch = false;
  handbrakeTouch = false;

  // Analog values for smooth joystick driving (-1.0 to 1.0)
  steerTouch = 0;
  throttleTouch = 0;

  // Convenience getters for driving
  get accelerate(): boolean { return this.isDown('ArrowUp') || this.isDown('KeyW') || this.accelerateTouch; }
  get brake(): boolean { return this.isDown('ArrowDown') || this.isDown('KeyS') || this.brakeTouch; }
  get turnLeft(): boolean { return this.isDown('ArrowLeft') || this.isDown('KeyA') || this.turnLeftTouch; }
  get turnRight(): boolean { return this.isDown('ArrowRight') || this.isDown('KeyD') || this.turnRightTouch; }
  get handbrake(): boolean { return this.isDown('Space') || this.handbrakeTouch; }
  get enter(): boolean { return this.wasJustPressed('Enter') || this.wasJustPressed('Space'); }
  get escape(): boolean { return this.wasJustPressed('Escape'); }

  get steerAmount(): number {
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) {
      return -1.0;
    }
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) {
      return 1.0;
    }
    return this.steerTouch;
  }

  get throttleAmount(): number {
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) {
      return 1.0;
    }
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) {
      return -1.0;
    }
    return this.throttleTouch;
  }
}
