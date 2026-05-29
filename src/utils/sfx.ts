// ─────────────────────────────────────────────────────────────
// sfx.ts — Sintetizador de efectos de sonido Retro (8-bits)
// Utiliza la Web Audio API para generar audio dinámico y libre de dependencias
// ─────────────────────────────────────────────────────────────

class RetroSFXManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Engine state
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning = false;

  // Drift state
  private driftOsc: OscillatorNode | null = null;
  private driftGain: GainNode | null = null;
  private isDrifting = false;

  private initCtx(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime); // Safe volume
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  setVolume(volume: number): void {
    this.resumeCtx();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume * 0.25, this.ctx.currentTime);
    }
  }

  private resumeCtx(): void {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ── Basic Beep (for Countdown) ───────────────────────────
  playBeep(frequency = 600, duration = 0.1, type: OscillatorType = 'sine'): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);

    // Envelope
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // ── Countdown Race Start (¡YA!) ──────────────────────────
  playStart(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // ── Splat sound (White Noise Explosion for journalists) ───
  playSplat(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.45;

    // Create noise buffer
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Create filter to make it sound muffled/crunchy
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);

    // Audio envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    // Pitch sweep oscillator overlay to add retro "splat" synth feel
    const pitchOsc = this.ctx.createOscillator();
    pitchOsc.type = 'sawtooth';
    pitchOsc.frequency.setValueAtTime(180, t);
    pitchOsc.frequency.linearRampToValueAtTime(40, t + 0.2);

    const pitchGain = this.ctx.createGain();
    pitchGain.gain.setValueAtTime(0.3, t);
    pitchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    // Connect noise
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Connect pitch sweep
    pitchOsc.connect(pitchGain);
    pitchGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration);
    pitchOsc.start(t);
    pitchOsc.stop(t + 0.2);
  }

  // ── Wall Crash Sound ──────────────────────────────────────
  playCrash(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.3;

    // Synthesize quick crunchy metal blast using white noise & low rumble
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    // Deep low rumble
    const rumble = this.ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(110, t);
    rumble.frequency.linearRampToValueAtTime(30, t + 0.2);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.5, t);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration);
    rumble.start(t);
    rumble.stop(t + 0.25);
  }

  // ── Correct Answer (Chime coin sound) ─────────────────────
  playCorrect(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // Classic retro two-tone coin beep
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc2.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.2, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc1.stop(t + 0.08);

    osc2.start(t + 0.08);
    osc2.stop(t + 0.35);
  }

  // ── Game Over Ditty (Melancólica melodía descendente) ──────
  playGameOver(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [293.66, 261.63, 220.00, 146.83]; // D4 -> C4 -> A3 -> D3
    const durations = [0.15, 0.15, 0.15, 0.5];
    const delays = [0, 0.15, 0.3, 0.45];

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const nt = t + delays[i];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, nt);

      gain.gain.setValueAtTime(0.25, nt);
      gain.gain.exponentialRampToValueAtTime(0.01, nt + durations[i]);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(nt);
      osc.stop(nt + durations[i]);
    });
  }

  // ── Oil Puddle Spin Screech Sound (one-shot) ─────────────
  playOilScreech(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.6;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    // Screeching high frequencies with slide
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.linearRampToValueAtTime(440, t + duration);

    osc2.frequency.setValueAtTime(890, t);
    osc2.frequency.linearRampToValueAtTime(450, t + duration);

    // Envelope
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    // Apply LFO for retro warble
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(18, t);
    lfoGain.gain.setValueAtTime(60, t);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    lfo.stop(t + duration);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // ── Camera Flash shutter sound (for Interrogation) ──────────
  playCameraFlash(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.35;

    // 1. Shutter noise burst
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // 2. High-pitched flash charge/discharge synth ring
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(8000, t + duration); // sweeps up rapidly to simulate flash pop

    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(t);
    osc.start(t);
    osc.stop(t + duration);
  }

  // ── Engine Continuous Sound ───────────────────────────────
  startEngine(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      const t = this.ctx.currentTime;
      this.isEngineRunning = true;

      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, t); // Low rumble

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, t); // Muffled engine

      this.engineGain.gain.setValueAtTime(0.12, t); // Gentle background engine volume

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start(t);
    } catch (e) {
      console.warn('Failed to start engine sfx:', e);
    }
  }

  updateEngine(speedRatio: number): void {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc || !this.engineFilter || !this.engineGain) return;

    const t = this.ctx.currentTime;
    const clampedRatio = Math.max(0, Math.min(speedRatio, 1.2));

    // Modulate pitch and lowpass cutoff based on speed
    const targetFreq = 48 + clampedRatio * 110; // Pitch: 48Hz to 158Hz
    const targetFilterCutoff = 130 + clampedRatio * 280; // Cutoff: 130Hz to 410Hz
    const targetVol = 0.08 + clampedRatio * 0.12; // Vol: louder as you speed up

    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    this.engineFilter.frequency.setTargetAtTime(targetFilterCutoff, t, 0.1);
    this.engineGain.gain.setTargetAtTime(targetVol, t, 0.1);
  }

  stopEngine(): void {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false;

    if (this.engineOsc && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.engineGain?.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        this.engineOsc.stop(t + 0.15);
      } catch (e) {}
    }
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
  }

  // ── Tire Drift Screech Sound ──────────────────────────────
  startDrift(): void {
    this.resumeCtx();
    if (!this.ctx || !this.masterGain || this.isDrifting) return;

    try {
      const t = this.ctx.currentTime;
      this.isDrifting = true;

      this.driftOsc = this.ctx.createOscillator();
      this.driftGain = this.ctx.createGain();

      this.driftOsc.type = 'triangle';
      this.driftOsc.frequency.setValueAtTime(620, t);

      // Low LFO to modulate the squeal frequency slightly
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(14, t); // 14Hz LFO vibrato
      lfoGain.gain.setValueAtTime(40, t); // swing pitch by 40Hz

      lfo.connect(lfoGain);
      lfoGain.connect(this.driftOsc.frequency);

      this.driftGain.gain.setValueAtTime(0.01, t);
      this.driftGain.gain.linearRampToValueAtTime(0.08, t + 0.15); // Fade in

      this.driftOsc.connect(this.driftGain);
      this.driftGain.connect(this.masterGain);

      lfo.start(t);
      this.driftOsc.start(t);
    } catch (e) {
      console.warn('Failed to start drift sfx:', e);
    }
  }

  stopDrift(): void {
    if (!this.isDrifting) return;
    this.isDrifting = false;

    if (this.driftOsc && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.driftGain?.gain.linearRampToValueAtTime(0.001, t + 0.1);
        this.driftOsc.stop(t + 0.1);
      } catch (e) {}
    }
    this.driftOsc = null;
    this.driftGain = null;
  }
}

export const sfx = new RetroSFXManager();
export default sfx;
