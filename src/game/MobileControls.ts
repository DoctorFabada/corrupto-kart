import { Input } from './Input';

export class MobileControls {
  private input: Input;
  private container: HTMLElement | null = null;
  private boundary: HTMLElement | null = null;
  private knob: HTMLElement | null = null;
  private driftBtn: HTMLElement | null = null;

  // Joystick touch tracking
  private activeTouchId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 45; // cap distance in pixels
  private isTouchDevice = false;

  constructor(input: Input) {
    this.input = input;

    // Retrieve elements
    this.container = document.getElementById('mobile-controls');
    this.boundary = document.getElementById('joystick-boundary');
    this.knob = document.getElementById('joystick-knob');
    this.driftBtn = document.getElementById('btn-drift-mobile');

    if (!this.container || !this.boundary || !this.knob) {
      return; // Not on page or desktop
    }

    // Auto-detect touch screen presence to display controls
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Bind event listeners
    this.boundary.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.boundary.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.boundary.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.boundary.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

    // Bind Drift button
    if (this.driftBtn) {
      this.driftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.handbrakeTouch = true;
      }, { passive: false });

      const releaseDrift = () => {
        this.input.handbrakeTouch = false;
      };
      this.driftBtn.addEventListener('touchend', releaseDrift);
      this.driftBtn.addEventListener('touchcancel', releaseDrift);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (this.activeTouchId !== null) return; // single touch tracking for joystick

    const touch = e.changedTouches[0];
    this.activeTouchId = touch.identifier;

    // Calculate center coordinates of boundary on touch start (handles dynamic resizing/scrolls)
    const rect = this.boundary!.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;

    this.updateJoystick(touch.clientX, touch.clientY);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.activeTouchId === null) return;

    // Find the touch corresponding to the active identifier
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.activeTouchId) {
        this.updateJoystick(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.activeTouchId === null) return;

    // Check if the tracked touch was released
    let released = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId) {
        released = true;
        break;
      }
    }

    if (released) {
      this.resetJoystick();
    }
  }

  private updateJoystick(clientX: number, clientY: number): void {
    // Vector relative to center
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Caps the distance at maxRadius
    const cappedDistance = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    // Compute knob displacement
    const knobX = Math.cos(angle) * cappedDistance;
    const knobY = Math.sin(angle) * cappedDistance;

    // Move visual knob
    this.knob!.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Calculate normalized values from -1.0 to 1.0
    const nx = distance > 0 ? (knobX / this.maxRadius) : 0;
    const ny = distance > 0 ? (knobY / this.maxRadius) : 0;

    // Set touch inputs in input manager
    // Deadzone of 0.20 to prevent accidental drifting/accelerating
    const deadzone = 0.20;

    // Horizontal Steering
    if (nx < -deadzone) {
      this.input.turnLeftTouch = true;
      this.input.turnRightTouch = false;
    } else if (nx > deadzone) {
      this.input.turnRightTouch = true;
      this.input.turnLeftTouch = false;
    } else {
      this.input.turnLeftTouch = false;
      this.input.turnRightTouch = false;
    }

    // Vertical Acceleration/Braking
    if (ny < -deadzone) {
      this.input.accelerateTouch = true;
      this.input.brakeTouch = false;
    } else if (ny > deadzone) {
      this.input.brakeTouch = true;
      this.input.accelerateTouch = false;
    } else {
      this.input.accelerateTouch = false;
      this.input.brakeTouch = false;
    }

    // Proportional analog values
    this.input.steerTouch = nx;
    this.input.throttleTouch = -ny;
  }

  private resetJoystick(): void {
    this.activeTouchId = null;
    this.knob!.style.transform = 'translate(0px, 0px)';

    // Reset touch flags
    this.input.accelerateTouch = false;
    this.input.brakeTouch = false;
    this.input.turnLeftTouch = false;
    this.input.turnRightTouch = false;
    this.input.steerTouch = 0;
    this.input.throttleTouch = 0;
  }

  public setVisible(visible: boolean): void {
    if (!this.container || !this.isTouchDevice) return;
    this.container.classList.toggle('visible', visible);
    if (!visible) {
      this.resetJoystick();
    }
  }
}
