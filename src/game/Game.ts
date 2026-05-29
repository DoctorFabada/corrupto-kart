import { Input } from './Input';
import { Camera } from './Camera';
import { MobileControls } from './MobileControls';
import { AssetLoader, GameAssets } from './AssetLoader';
import { Player } from '../entities/Player';
import { Journalist } from '../entities/Journalist';
import { Track } from '../track/Track';
import { TrackRenderer } from '../track/TrackRenderer';
import { HUD } from '../ui/HUD';
import { SelectionScreen, SelectionResult } from '../screens/SelectionScreen';
import { InterrogationScreen } from '../screens/InterrogationScreen';
import { CommentWall } from '../screens/CommentWall';
import { getRandomQuestion } from '../data/journalistQuestions';
import { CANVAS_BG, TOTAL_LAPS, COUNTDOWN_SECONDS, TRACK_WIDTH } from '../utils/constants';
import { formatTime } from '../utils/math';
import { sfx } from '../utils/sfx';
import { Particle, ParticleSystem } from '../entities/Particle';
import { TrackObstacle, ObstacleRenderer } from '../entities/Obstacle';
import { supabase } from '../utils/supabase';

export type GameState =
  | 'LOADING'
  | 'TITLE'
  | 'SELECTION'
  | 'COUNTDOWN'
  | 'RACING'
  | 'PAUSED'
  | 'CONTROLS'
  | 'COMMENTS'
  | 'INTERROGATION'
  | 'GAME_OVER'
  | 'RESULT';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private mobileControls: MobileControls;
  private camera: Camera;
  private assetLoader: AssetLoader;
  private assets: GameAssets | null = null;

  private player!: Player;
  private track!: Track;
  private trackRenderer!: TrackRenderer;
  private hud!: HUD;
  private selectionScreen: SelectionScreen | null = null;
  private interrogationScreen: InterrogationScreen;
  private commentWall: CommentWall;

  private state: GameState = 'LOADING';
  private previousState: GameState = 'TITLE'; // For returning from CONTROLS/COMMENTS
  private lastTime = 0;

  // Current selection
  private currentSelection: SelectionResult | null = null;

  // Race state
  private raceTime = 0;
  private lapTimes: number[] = [];
  private currentLap = 1;
  private raceFinished = false;
  private speedSamples: number[] = [];

  // Countdown state
  private countdownTimer = 0;
  private countdownValue = 0;

  // Audio state
  private musicStarted = false;
  private savedRaceMusicVolume = 0.5;

  // Journalist state
  private journalists: Journalist[] = [];
  private journalistSpawnTimer = 0;
  private journalistToastEl: HTMLElement;
  private deathScreamToastEl: HTMLElement;
  private killCounterEl: HTMLElement;
  private pressFeedContainerEl: HTMLElement;
  private pressFeedListEl: HTMLElement;
  private killedJournalists = 0;
  private journalistToastTimer = 0;
  private journalistCounter = 0;
  private lastFeedQuestionTime = 0;

  // Interrogation state
  private interrogationsTriggered = new Set<number>();
  private askedQuestions = new Set<string>();

  // Game Juice & Obstacles
  private particles: Particle[] = [];
  private obstacles: TrackObstacle[] = [];
  private floatingTexts: Array<{ x: number; y: number; text: string; color: string; life: number; maxLife: number }> = [];

  // Audio System State
  private globalVolume = 0.5;
  private savedVolumeBeforeMute = 0.5;
  private isAudioMuted = false;

  // DOM elements
  private titleScreen: HTMLElement;
  private driverPortraitHudEl!: HTMLElement;
  private driverPortraitImgEl!: HTMLImageElement;
  private selectionScreenEl: HTMLElement;
  private raceHud: HTMLElement;
  private resultScreen: HTMLElement;
  private countdownDisplay: HTMLElement;
  private lapNotification: HTMLElement;
  private pauseScreen: HTMLElement;
  private controlsScreen: HTMLElement;
  private gameoverScreen: HTMLElement;
  private shareModalEl: HTMLElement;
  private shareTextContentEl: HTMLTextAreaElement;
  private activeQuestionPopupEl!: HTMLElement;
  private activeQuestionTimeout: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new Input();
    this.mobileControls = new MobileControls(this.input);
    this.camera = new Camera();
    this.assetLoader = new AssetLoader();
    this.interrogationScreen = new InterrogationScreen();
    this.commentWall = new CommentWall();

    // Get DOM elements
    this.titleScreen = document.getElementById('title-screen')!;
    this.selectionScreenEl = document.getElementById('selection-screen')!;
    this.raceHud = document.getElementById('race-hud')!;
    this.resultScreen = document.getElementById('result-screen')!;
    this.countdownDisplay = document.getElementById('countdown-display')!;
    this.lapNotification = document.getElementById('lap-notification')!;
    this.pauseScreen = document.getElementById('pause-screen')!;
    this.controlsScreen = document.getElementById('controls-screen')!;
    this.gameoverScreen = document.getElementById('gameover-screen')!;
    this.journalistToastEl = document.getElementById('journalist-toast')!;
    this.deathScreamToastEl = document.getElementById('death-scream-toast')!;
    this.killCounterEl = document.getElementById('kill-counter')!;
    this.pressFeedContainerEl = document.getElementById('press-feed-container')!;
    this.pressFeedListEl = document.getElementById('press-feed-list')!;
    this.driverPortraitHudEl = document.getElementById('driver-portrait-hud')!;
    this.driverPortraitImgEl = document.getElementById('driver-portrait-img') as HTMLImageElement;
    this.shareModalEl = document.getElementById('share-modal')!;
    this.shareTextContentEl = document.getElementById('share-text-content') as HTMLTextAreaElement;
    this.activeQuestionPopupEl = document.getElementById('active-question-popup')!;

    // Resize handler
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // ── Button handlers ────────────────────────────────────
    // Title
    document.getElementById('btn-play')!.addEventListener('click', () => this.goToSelection());

    // Title secondary
    document.getElementById('btn-controls-title')!.addEventListener('click', () => {
      this.previousState = 'TITLE';
      this.showControls();
    });
    document.getElementById('btn-comments-title')!.addEventListener('click', () => {
      this.previousState = 'TITLE';
      this.showComments();
    });

    // Result
    document.getElementById('btn-retry')!.addEventListener('click', () => this.startRace());
    document.getElementById('btn-menu')!.addEventListener('click', () => this.goToTitle());

    // Pause
    document.getElementById('btn-resume')!.addEventListener('click', () => this.resumeFromPause());
    document.getElementById('btn-restart-race')!.addEventListener('click', () => {
      this.hidePause();
      this.startRace();
    });
    document.getElementById('btn-controls-pause')!.addEventListener('click', () => {
      this.hidePause();
      this.previousState = 'PAUSED';
      this.showControls();
    });
    document.getElementById('btn-quit')!.addEventListener('click', () => {
      this.hidePause();
      this.goToTitle();
    });

    // Controls back
    document.getElementById('btn-controls-back')!.addEventListener('click', () => {
      this.hideControls();
    });

    // Game over
    document.getElementById('btn-gameover-retry')!.addEventListener('click', () => {
      this.hideGameOver();
      this.startRace();
    });
    document.getElementById('btn-gameover-menu')!.addEventListener('click', () => {
      this.hideGameOver();
      this.goToTitle();
    });

    // Comment wall back
    this.commentWall.setOnBack(() => {
      this.returnFromOverlay();
    });

    // Share result buttons
    document.getElementById('btn-share')!.addEventListener('click', () => this.showShareModal());
    document.getElementById('btn-copy-share')!.addEventListener('click', () => this.copyShareText());
    document.getElementById('btn-twitter-share')!.addEventListener('click', () => this.twitterShare());
    document.getElementById('btn-whatsapp-share')!.addEventListener('click', () => this.whatsappShare());
    document.getElementById('btn-close-share')!.addEventListener('click', () => this.hideShareModal());

    // Volume buttons
    document.getElementById('btn-vol-down')!.addEventListener('click', () => this.adjustVolume(-0.25));
    document.getElementById('btn-vol-mute')!.addEventListener('click', () => this.toggleVolumeMute());
    document.getElementById('btn-vol-up')!.addEventListener('click', () => this.adjustVolume(0.25));

    // Interrogation callback
    this.interrogationScreen.setOnComplete((result, timePenalty) => {
      this.interrogationScreen.hide();
      if (result === 'failed') {
        // GAME OVER
        this.showGameOver();
      } else {
        // Passed — return to racing with time penalty + boost
        this.raceTime += timePenalty;
        this.player.applySlowdown(2000, 1.3); // Boost: 130% speed for 2s
        this.setState('RACING');
        sfx.startEngine(); // Restart engine sound!
        if (this.assets) {
          this.assets.raceMusic.volume = this.savedRaceMusicVolume;
          this.assets.raceMusic.play().catch(() => {});
        }
      }
    });

    // Event delegation for UI click sounds
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.classList.contains('interrogation-option') ||
        target.closest('.interrogation-option') ||
        target.classList.contains('social-link') ||
        target.closest('.social-link')
      )) {
        this.playUiClick();
      }
    });
  }

  async init(): Promise<void> {
    this.assets = await this.assetLoader.loadAll();
    this.track = new Track();
    this.trackRenderer = new TrackRenderer(this.track);
    this.hud = new HUD();

    // Create selection screen with loaded assets
    this.selectionScreen = new SelectionScreen(this.assets);
    this.selectionScreen.setOnConfirm((result) => {
      this.currentSelection = result;
      this.startRace();
    });
    this.selectionScreen.setOnBack(() => this.goToTitle());

    this.applyVolumeSettings();

    this.setState('TITLE');
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ═══════════════════════════════════════════════════════════
  //  STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  private setState(newState: GameState): void {
    this.state = newState;
    // Toggle overlays — only show the ones that match the state
    this.titleScreen.classList.toggle('active', newState === 'TITLE');
    this.selectionScreenEl.classList.toggle('active', newState === 'SELECTION');
    this.raceHud.classList.toggle('active',
      newState === 'COUNTDOWN' || newState === 'RACING' || newState === 'PAUSED' || newState === 'INTERROGATION');
    this.resultScreen.classList.toggle('active', newState === 'RESULT');
    this.countdownDisplay.classList.remove('visible');

    // Toggle kill counter visibility in race states
    this.killCounterEl.classList.toggle('visible',
      newState === 'COUNTDOWN' || newState === 'RACING' || newState === 'PAUSED' || newState === 'INTERROGATION');

    // Toggle press feed visibility in race states
    this.pressFeedContainerEl.classList.toggle('visible',
      newState === 'COUNTDOWN' || newState === 'RACING' || newState === 'PAUSED' || newState === 'INTERROGATION');

    // Toggle driver portrait visibility in race states
    this.driverPortraitHudEl.classList.toggle('visible',
      newState === 'COUNTDOWN' || newState === 'RACING' || newState === 'PAUSED' || newState === 'INTERROGATION');
  }

  // ═══════════════════════════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════════════════════════

  private goToSelection(): void {
    if (!this.musicStarted) {
      this.musicStarted = true;
    }
    this.tryPlayMenuMusic();
    this.setState('SELECTION');
  }

  private startRace(): void {
    if (!this.assets || !this.currentSelection) return;

    // Stop menu music
    this.assets.menuMusic.pause();
    this.assets.menuMusic.currentTime = 0;

    // Stop victory music
    this.assets.victoryMusic.pause();
    this.assets.victoryMusic.currentTime = 0;

    // Initialize player at track start with selected vehicle + character
    const start = this.track.getStartPosition();
    this.player = new Player(
      start.x, start.y, start.angle,
      this.currentSelection.vehicleSprite,
      this.currentSelection.characterSprite
    );

    // Reset race state
    this.raceTime = 0;
    this.lapTimes = [];
    this.currentLap = 1;
    this.raceFinished = false;
    this.speedSamples = [];
    this.journalists = [];
    this.journalistSpawnTimer = 3000; // First spawn after 3s (zombie invasion!)
    this.interrogationsTriggered.clear();
    this.askedQuestions.clear();
    this.killedJournalists = 0;
    this.driverPortraitImgEl.src = this.currentSelection.characterSprite.src;
    this.journalistCounter = 0;
    this.lastFeedQuestionTime = 0;
    this.killCounterEl.textContent = `💀 Periodistas: 0`;
    if (this.pressFeedListEl) {
      this.pressFeedListEl.innerHTML = '';
    }
    if (this.activeQuestionPopupEl) {
      this.activeQuestionPopupEl.classList.remove('visible');
      this.activeQuestionPopupEl.textContent = '';
    }
    if (this.activeQuestionTimeout) {
      clearTimeout(this.activeQuestionTimeout);
      this.activeQuestionTimeout = null;
    }

    this.obstacles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnTrackObstacles();

    // Snap camera
    this.camera.snapTo(start.x, start.y, start.angle);

    // Start engine rumble sfx
    sfx.startEngine();

    // Start countdown
    this.countdownTimer = COUNTDOWN_SECONDS * 1000;
    this.countdownValue = COUNTDOWN_SECONDS;
    this.setState('COUNTDOWN');

    // Register play statistic in Supabase
    this.registerGamePlay();
  }

  private async registerGamePlay(): Promise<void> {
    if (!supabase || !this.currentSelection) return;
    try {
      await supabase
        .from('game_plays')
        .insert([{
          character_id: this.currentSelection.character.id,
          vehicle_id: this.currentSelection.vehicle.id,
          timestamp: Date.now()
        }]);
    } catch (e) {
      console.warn('Failed to register play statistic in Supabase:', e);
    }
  }

  private goToTitle(): void {
    this.setState('TITLE');
    if (this.assets) {
      this.assets.raceMusic.pause();
      this.assets.raceMusic.currentTime = 0;
      this.assets.victoryMusic.pause();
      this.assets.victoryMusic.currentTime = 0;
      this.tryPlayMenuMusic();
    }
    sfx.stopEngine();
    sfx.stopDrift();
    if (this.activeQuestionPopupEl) {
      this.activeQuestionPopupEl.classList.remove('visible');
      this.activeQuestionPopupEl.textContent = '';
    }
    if (this.activeQuestionTimeout) {
      clearTimeout(this.activeQuestionTimeout);
      this.activeQuestionTimeout = null;
    }
  }

  private tryPlayMenuMusic(): void {
    if (this.assets && this.musicStarted) {
      this.assets.menuMusic.play().catch(() => {});
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  PAUSE
  // ═══════════════════════════════════════════════════════════

  private togglePause(): void {
    if (this.state === 'RACING' || this.state === 'COUNTDOWN') {
      this.previousState = this.state;
      this.state = 'PAUSED';
      this.pauseScreen.classList.add('active');
      // Lower race music volume
      if (this.assets) {
        this.savedRaceMusicVolume = this.assets.raceMusic.volume;
        this.assets.raceMusic.volume = 0.15;
      }
      sfx.stopEngine();
      sfx.stopDrift();
    } else if (this.state === 'PAUSED') {
      this.resumeFromPause();
    }
  }

  private resumeFromPause(): void {
    this.pauseScreen.classList.remove('active');
    this.state = this.previousState === 'COUNTDOWN' ? 'COUNTDOWN' : 'RACING';
    // Restore music volume
    if (this.assets) {
      this.assets.raceMusic.volume = this.savedRaceMusicVolume;
    }
    if (this.state === 'RACING') {
      sfx.startEngine();
    }
  }

  private hidePause(): void {
    this.pauseScreen.classList.remove('active');
  }

  // ═══════════════════════════════════════════════════════════
  //  CONTROLS OVERLAY
  // ═══════════════════════════════════════════════════════════

  private showControls(): void {
    this.state = 'CONTROLS';
    this.controlsScreen.classList.add('active');
  }

  private hideControls(): void {
    this.controlsScreen.classList.remove('active');
    this.returnFromOverlay();
  }

  // ═══════════════════════════════════════════════════════════
  //  COMMENTS OVERLAY
  // ═══════════════════════════════════════════════════════════

  private showComments(): void {
    this.state = 'COMMENTS';
    this.commentWall.show();
  }

  // ═══════════════════════════════════════════════════════════
  //  GAME OVER
  // ═══════════════════════════════════════════════════════════

  private showGameOver(): void {
    this.state = 'GAME_OVER';
    this.gameoverScreen.classList.add('active');
    if (this.assets) {
      this.assets.raceMusic.pause();
    }
    sfx.stopEngine();
    sfx.stopDrift();
    sfx.playGameOver();
  }

  private hideGameOver(): void {
    this.gameoverScreen.classList.remove('active');
  }

  // ═══════════════════════════════════════════════════════════
  //  RETURN FROM OVERLAY
  // ═══════════════════════════════════════════════════════════

  private returnFromOverlay(): void {
    if (this.previousState === 'PAUSED') {
      this.state = 'PAUSED';
      this.pauseScreen.classList.add('active');
    } else if (this.previousState === 'TITLE') {
      this.setState('TITLE');
    } else {
      this.setState(this.previousState);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  JOURNALIST TOAST
  // ═══════════════════════════════════════════════════════════

  private showJournalistToast(text: string): void {
    this.journalistToastEl.textContent = `📰 "${text}"`;
    this.journalistToastEl.classList.remove('visible');
    void this.journalistToastEl.offsetWidth; // Force reflow
    this.journalistToastEl.classList.add('visible');
    this.journalistToastTimer = 3000;
    setTimeout(() => {
      this.journalistToastEl.classList.remove('visible');
    }, 3000);
  }

  // ═══════════════════════════════════════════════════════════
  //  GAME LOOP
  // ═══════════════════════════════════════════════════════════

  private gameLoop = (timestamp: number): void => {
    const dt = Math.min(timestamp - this.lastTime, 50); // Cap at ~20fps min
    this.lastTime = timestamp;

    this.update(dt);
    this.render();
    this.input.clearJustPressed();

    requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    switch (this.state) {
      case 'TITLE':
        // Enter or Space goes to selection
        if (this.input.enter) {
          if (!this.musicStarted) {
            this.musicStarted = true;
            this.tryPlayMenuMusic();
          }
          this.goToSelection();
        }
        // Start music on any keypress
        if (!this.musicStarted && (this.input.accelerate || this.input.brake)) {
          this.musicStarted = true;
          this.tryPlayMenuMusic();
        }
        break;

      case 'SELECTION':
        // Selection is handled by DOM events in SelectionScreen
        break;

      case 'COUNTDOWN':
        // ESC → Pause
        if (this.input.escape) {
          this.togglePause();
          break;
        }

        this.countdownTimer -= dt;
        const newValue = Math.ceil(this.countdownTimer / 1000);
        if (newValue !== this.countdownValue && newValue >= 0) {
          this.countdownValue = newValue;
          if (newValue > 0) {
            sfx.playBeep(600, 0.12, 'sine');
          } else {
            sfx.playStart();
          }
          this.showCountdown(newValue === 0 ? '¡YA!' : String(newValue));
        }
        if (this.countdownTimer <= 0) {
          this.setState('RACING');
          this.countdownDisplay.classList.remove('visible');
          // Start race music
          if (this.assets) {
            this.assets.raceMusic.play().catch(() => {});
          }
        }
        break;

      case 'RACING':
        if (this.raceFinished) return;

        // ESC → Pause
        if (this.input.escape) {
          this.togglePause();
          break;
        }

        this.raceTime += dt;

        // Update player
        this.player.update(this.input, this.track, dt);

        // Camera follows player
        this.camera.setTarget(this.player.x, this.player.y, this.player.angle);
        this.camera.update(this.canvas.width, this.canvas.height);

        // Track speed samples for average
        this.speedSamples.push(this.player.displaySpeed);

        // ── Journalist spawn & collision ──────────────────
        this.updateJournalists(dt);

        this.updateObstaclesAndParticles(dt);

        // Check lap completion
        if (this.player.checkLapComplete(this.track)) {
          this.lapTimes.push(this.raceTime - this.lapTimes.reduce((a, b) => a + b, 0));

          if (this.lapTimes.length >= TOTAL_LAPS) {
            // Race finished!
            this.raceFinished = true;
            this.finishRace();
          } else {
            this.currentLap++;
            this.showLapNotification(`VUELTA ${this.currentLap}/${TOTAL_LAPS}`);

            // Trigger interrogation at start of lap 2 and lap 3
            if ((this.currentLap === 2 || this.currentLap === 3) && !this.interrogationsTriggered.has(this.currentLap)) {
              this.interrogationsTriggered.add(this.currentLap);
              // Small delay for dramatic effect
              setTimeout(() => this.triggerInterrogation(), 1000);
            }
          }
        }

        // Update HUD
        this.hud.update(this.raceTime, this.currentLap, TOTAL_LAPS, this.player.displaySpeed);
        break;

      case 'PAUSED':
        // ESC → Resume
        if (this.input.escape) {
          this.resumeFromPause();
        }
        break;

      case 'CONTROLS':
        // ESC → Back
        if (this.input.escape) {
          this.hideControls();
        }
        break;

      case 'COMMENTS':
        // ESC → Back
        if (this.input.escape) {
          this.commentWall.hide();
          this.returnFromOverlay();
        }
        break;

      case 'INTERROGATION':
        // Handled by InterrogationScreen DOM events
        break;

      case 'GAME_OVER':
        // Enter to retry
        if (this.input.enter) {
          this.hideGameOver();
          this.startRace();
        }
        break;

      case 'RESULT':
        if (this.input.enter) {
          this.startRace();
        }
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  JOURNALISTS
  // ═══════════════════════════════════════════════════════════

  private updateJournalists(dt: number): void {
    if (!this.currentSelection) return;

    // Spawn timer - zombie invasion style (rapid spawning)
    this.journalistSpawnTimer -= dt;
    if (this.journalistSpawnTimer <= 0) {
      this.spawnJournalistGroup();
      // Wave every 4.5 to 6.5 seconds
      this.journalistSpawnTimer = 4500 + Math.random() * 2000;
    }

    // Update existing journalists
    for (const journalist of this.journalists) {
      // Pass player coordinates so journalists can pursue!
      journalist.update(dt, this.player.x, this.player.y);

      // Set showBubble flag if player is near-ish
      journalist._showBubble = journalist.isInBubbleRange(this.player.x, this.player.y);

      // Register the question in the side HUD feed once they enter bubble range (so the player can easily read it)
      if (journalist._showBubble && !journalist.hasAsked) {
        journalist.hasAsked = true;
        const now = performance.now();
        // Cooldown of 2.2 seconds between registered feed questions so they appear strictly one by one!
        if (now - this.lastFeedQuestionTime >= 2200) {
          this.lastFeedQuestionTime = now;
          this.journalistCounter++;
          this.addQuestionToPressFeed(this.journalistCounter, journalist.question);
        }
      }

      // Check collision with player
      if (!journalist.triggered && journalist.isNearPlayer(this.player.x, this.player.y)) {
        // Trigger death animation by passing player angle
        journalist.trigger(this.player.angle);
        
        // Show death scream toast
        this.showDeathScreamToast(journalist.deathScreamText);
        
        // Apply minor collision slowdown so player feels the bump but isn't stuck
        this.player.applySlowdown(500, 0.9);

        // Update killed counter
        this.killedJournalists++;
        this.killCounterEl.textContent = `💀 Periodistas: ${this.killedJournalists}`;

        // Play dynamic retro splat audio
        sfx.playSplat();

        // Spawn red splat particles for arcade juice!
        ParticleSystem.spawnSplat(this.particles, journalist.x, journalist.y, '#ff003c', 16);
        this.addFloatingText(journalist.x, journalist.y - 15, '¡PLAF!', '#ff003c');
      }
    }

    // Remove dead journalists
    this.journalists = this.journalists.filter(j => j.isAlive);
  }

  private addQuestionToPressFeed(num: number, text: string): void {
    if (!this.pressFeedListEl) return;

    // Remove "latest" class from previous bubbles in the feed
    const items = this.pressFeedListEl.querySelectorAll('.press-question-bubble');
    items.forEach(item => item.classList.remove('latest'));

    // Create new question bubble element
    const bubble = document.createElement('div');
    bubble.className = 'press-question-bubble latest';

    const meta = document.createElement('div');
    meta.className = 'press-question-meta';
    
    const title = document.createElement('span');
    title.textContent = `🎤 PERIODISTA #${num}`;
    
    const time = document.createElement('span');
    time.textContent = formatTime(this.raceTime); // dynamic time in race

    meta.appendChild(title);
    meta.appendChild(time);

    const questionText = document.createElement('div');
    questionText.className = 'press-question-text';
    questionText.textContent = text;

    bubble.appendChild(meta);
    bubble.appendChild(questionText);

    // Prepend to list (latest on top)
    this.pressFeedListEl.insertBefore(bubble, this.pressFeedListEl.firstChild);

    // Limit to 3 elements in the list to avoid overflow (leaving plenty of screen real estate for the double-sized text)
    while (this.pressFeedListEl.children.length > 3) {
      this.pressFeedListEl.removeChild(this.pressFeedListEl.lastChild!);
    }

    // Trigger active center screen popup for 4 seconds
    if (this.activeQuestionPopupEl) {
      this.activeQuestionPopupEl.textContent = `🎤 Periodista: "${text}"`;
      this.activeQuestionPopupEl.classList.add('visible');

      if (this.activeQuestionTimeout) {
        clearTimeout(this.activeQuestionTimeout);
      }

      this.activeQuestionTimeout = window.setTimeout(() => {
        this.activeQuestionPopupEl?.classList.remove('visible');
        this.activeQuestionTimeout = null;
      }, 4000);
    }
  }

  private spawnJournalistGroup(): void {
    if (!this.currentSelection) return;

    const question = getRandomQuestion(this.currentSelection.character.id);
    const group = Journalist.spawnGroupNearPlayer(
      this.player.x,
      this.player.y,
      this.player.angle,
      this.track.points,
      question.text,
    );
    this.journalists.push(...group);
  }

  private showDeathScreamToast(text: string): void {
    this.deathScreamToastEl.textContent = text;
    this.deathScreamToastEl.classList.remove('visible');
    void this.deathScreamToastEl.offsetWidth; // Force reflow
    this.deathScreamToastEl.classList.add('visible');
    setTimeout(() => {
      this.deathScreamToastEl.classList.remove('visible');
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════
  //  INTERROGATION
  // ═══════════════════════════════════════════════════════════

  private triggerInterrogation(): void {
    if (!this.currentSelection) return;
    if (this.state !== 'RACING') return; // Guard in case state changed during timeout

    this.state = 'INTERROGATION';
    // Lower race music
    if (this.assets) {
      this.savedRaceMusicVolume = this.assets.raceMusic.volume;
      this.assets.raceMusic.volume = 0.1;
    }
    sfx.stopEngine(); // Stop engine sound
    sfx.stopDrift(); // Stop drift sound
    sfx.playCameraFlash(); // Trigger retro camera flash sound!

    this.interrogationScreen.start(this.currentSelection.character.id, this.askedQuestions);
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  private render(): void {
    const { ctx, canvas } = this;
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.state === 'TITLE' || this.state === 'LOADING' || this.state === 'SELECTION'
      || this.state === 'CONTROLS' || this.state === 'COMMENTS') {
      // Draw animated background for title / selection / overlays
      this.renderTitleBackground();
      return;
    }

    if (this.state === 'COUNTDOWN' || this.state === 'RACING' || this.state === 'RESULT'
      || this.state === 'PAUSED' || this.state === 'INTERROGATION' || this.state === 'GAME_OVER') {
      // Apply camera transform
      this.camera.applyTransform(ctx, canvas.width, canvas.height);

      // Draw track
      this.trackRenderer.render(ctx);

      // Draw obstacles
      const time = performance.now();
      for (const obs of this.obstacles) {
        ObstacleRenderer.render(ctx, obs, time);
      }

      // Draw journalists
      for (const journalist of this.journalists) {
        journalist.render(ctx);
      }

      // Draw player
      if (this.player) {
        this.player.render(ctx);
      }

      // Draw particles & floating texts
      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      this.camera.restoreTransform(ctx);

      // Draw speed lines effect when going fast
      if (this.state === 'RACING' && this.player && this.player.displaySpeed > 100) {
        this.renderSpeedLines();
      }
    }
  }

  private renderTitleBackground(): void {
    const { ctx, canvas } = this;
    const time = performance.now() / 1000;

    // Animated grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetY = (time * 30) % gridSize;

    for (let y = -gridSize + offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  }

  private renderSpeedLines(): void {
    const { ctx, canvas } = this;
    const speed = this.player.displaySpeed;
    const intensity = Math.min((speed - 100) / 150, 1);
    const lineCount = Math.floor(intensity * 12);

    ctx.save();
    ctx.strokeStyle = `rgba(0, 212, 255, ${intensity * 0.3})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < lineCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const len = 30 + Math.random() * 60 * intensity;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  private showCountdown(text: string): void {
    this.countdownDisplay.textContent = text;
    this.countdownDisplay.classList.remove('visible');
    void this.countdownDisplay.offsetWidth; // Force reflow
    this.countdownDisplay.classList.add('visible');
  }

  private showLapNotification(text: string): void {
    this.lapNotification.textContent = text;
    this.lapNotification.classList.remove('visible');
    void this.lapNotification.offsetWidth;
    this.lapNotification.classList.add('visible');
    setTimeout(() => this.lapNotification.classList.remove('visible'), 2000);
  }

  private finishRace(): void {
    // Stop race music
    if (this.assets) {
      this.assets.raceMusic.pause();
      this.assets.victoryMusic.play().catch(() => {});
    }
    sfx.stopEngine();
    sfx.stopDrift();
    sfx.playCorrect();

    // Calculate stats
    const bestLap = Math.min(...this.lapTimes);
    const avgSpeed = this.speedSamples.length > 0
      ? Math.round(this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length)
      : 0;

    // Update result screen stats
    document.getElementById('result-time')!.textContent = formatTime(this.raceTime);
    document.getElementById('result-best-lap')!.textContent = formatTime(bestLap);
    document.getElementById('result-avg-speed')!.textContent = `${avgSpeed} km/h`;

    // Update character info in results
    if (this.currentSelection) {
      const charImg = document.getElementById('result-character-img') as HTMLImageElement;
      if (charImg) charImg.src = this.currentSelection.characterSprite.src;
      const quoteEl = document.getElementById('result-victory-quote');
      if (quoteEl) quoteEl.textContent = `"${this.currentSelection.character.victoryQuote}"`;
    }

    // Show result after a brief delay
    setTimeout(() => {
      this.setState('RESULT');
    }, 1500);
  }

  private showShareModal(): void {
    if (!this.currentSelection) return;
    
    const avgSpeed = this.speedSamples.length > 0
      ? Math.round(this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length)
      : 0;

    const charName = this.currentSelection.character.name;
    const vehName = this.currentSelection.vehicle.name;
    const formattedTime = formatTime(this.raceTime);

    const alibi = `🚨 COMUNICADO 🚨\nYo, ${charName} en ${vehName}, soy INOCENTE. Es un BULO de la fiscalía que me fugase en ${formattedTime} a ${avgSpeed} km/h arrollando a ${this.killedJournalists} periodistas "pesados". ¡No podrán demostrar nada! 🏎️💼\n\n¡Juega gratis aquí! 👉 https://corruptokart.teamturner.es\n#CorruptoKart`;

    this.shareTextContentEl.value = alibi;
    this.shareModalEl.classList.add('active');
  }

  private hideShareModal(): void {
    this.shareModalEl.classList.remove('active');
  }

  private copyShareText(): void {
    const text = this.shareTextContentEl.value;
    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = document.getElementById('btn-copy-share');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✨ ¡COPIADO AL PORTAPAPELES! ✨';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('No se pudo copiar el texto: ', err);
    });
  }

  private twitterShare(): void {
    const text = this.shareTextContentEl.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  private whatsappShare(): void {
    const text = this.shareTextContentEl.value;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  private playUiClick(): void {
    sfx.playBeep(800, 0.05, 'sine');
  }

  private adjustVolume(change: number): void {
    this.isAudioMuted = false;
    this.globalVolume = Math.min(Math.max(this.globalVolume + change, 0), 1.0);
    this.applyVolumeSettings();
  }

  private toggleVolumeMute(): void {
    if (this.isAudioMuted) {
      this.isAudioMuted = false;
      this.globalVolume = this.savedVolumeBeforeMute;
    } else {
      this.savedVolumeBeforeMute = this.globalVolume;
      this.isAudioMuted = true;
      this.globalVolume = 0;
    }
    this.applyVolumeSettings();
  }

  private applyVolumeSettings(): void {
    const volume = this.globalVolume;
    if (this.assets) {
      this.assets.menuMusic.volume = volume * 0.5;
      this.assets.victoryMusic.volume = volume * 0.5;
      if (this.state === 'RACING' || this.state === 'COUNTDOWN') {
        this.assets.raceMusic.volume = volume * 0.4;
      } else if (this.state === 'PAUSED' || this.state === 'INTERROGATION') {
        this.assets.raceMusic.volume = volume * 0.15;
      } else {
        this.assets.raceMusic.volume = volume * 0.4;
      }
    }
    sfx.setVolume(volume);
    this.updateVolumeUI();
  }

  private updateVolumeUI(): void {
    const volIndicator = document.getElementById('volume-indicator');
    if (volIndicator) {
      volIndicator.textContent = this.isAudioMuted ? 'MUTED' : `${Math.round(this.globalVolume * 100)}%`;
    }
    const muteBtn = document.getElementById('btn-vol-mute');
    if (muteBtn) {
      muteBtn.textContent = this.isAudioMuted ? '🔇' : '🔊';
    }
  }

  private spawnTrackObstacles(): void {
    if (!this.track) return;
    const totalPoints = this.track.points.length;
    const numOil = 6; // Reduced to half!
    const numMoney = 10;
    
    for (let i = 0; i < numOil; i++) {
      const idx = Math.floor(100 + (totalPoints - 200) * (i / numOil) + (Math.random() * 50 - 25));
      const p = this.track.points[Math.max(50, Math.min(idx, totalPoints - 50))];
      const offset = (Math.random() - 0.5) * TRACK_WIDTH * 0.65;
      this.obstacles.push({
        x: p.x + p.nx * offset,
        y: p.y + p.ny * offset,
        type: 'oil',
        radius: 18 + Math.random() * 8,
        collected: false
      });
    }
    
    for (let i = 0; i < numMoney; i++) {
      const idx = Math.floor(150 + (totalPoints - 200) * ((i + 0.5) / numMoney) + (Math.random() * 50 - 25));
      const p = this.track.points[Math.max(50, Math.min(idx, totalPoints - 50))];
      const offset = (Math.random() - 0.5) * TRACK_WIDTH * 0.65;
      this.obstacles.push({
        x: p.x + p.nx * offset,
        y: p.y + p.ny * offset,
        type: 'money',
        radius: 12,
        collected: false
      });
    }
  }

  private updateObstaclesAndParticles(dt: number): void {
    const dtScale = dt / 16.67;

    if (this.state === 'RACING' && this.player) {
      const px = this.player.x;
      const py = this.player.y;
      
      for (const obs of this.obstacles) {
        if (obs.collected) continue;

        const dist = Math.sqrt((px - obs.x) ** 2 + (py - obs.y) ** 2);
        const colRadius = obs.type === 'oil' ? obs.radius + 6 : obs.radius + 10;
        
        if (dist < colRadius) {
          if (obs.type === 'oil') {
            if (this.player.spinTimer <= 0) {
              obs.collected = true; // Mark as collected/cleared so it disappears and avoids infinite loop
              this.player.triggerSpinOut(600);
              ParticleSystem.spawnSplat(this.particles, obs.x, obs.y, '#d900ff', 12);
              this.addFloatingText(obs.x, obs.y - 15, '¡TROMPO!', '#d900ff');
              sfx.playOilScreech(); // Squealing tires screech sound
            }
          } else {
            obs.collected = true;
            this.raceTime = Math.max(0, this.raceTime - 1000);
            this.player.applySlowdown(1800, 1.45);
            ParticleSystem.spawnSpark(this.particles, obs.x, obs.y, '#ffee00', 15);
            this.addFloatingText(obs.x, obs.y - 15, '-1.0s', '#ffea00');
            this.addFloatingText(obs.x, obs.y - 32, '¡TURBO!', '#00ffea');
            sfx.playCorrect();
          }
        }
      }

      if (Math.abs(this.player.displaySpeed) > 110) {
        const rad = this.player.angle;
        const backX = this.player.x - Math.sin(rad) * 15;
        const backY = this.player.y + Math.cos(rad) * 15;
        ParticleSystem.spawnSpeedTrail(this.particles, backX, backY, rad, Math.abs(this.player.displaySpeed));
      }
    }

    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dtScale;
      p.y += p.vy * dtScale;
      p.vx *= Math.pow(0.98, dtScale);
      p.vy *= Math.pow(0.98, dtScale);
    }
    this.particles = this.particles.filter(p => p.life < p.maxLife);

    for (const t of this.floatingTexts) {
      t.life += dt;
      t.y -= 0.6 * dtScale;
    }
    this.floatingTexts = this.floatingTexts.filter(t => t.life < t.maxLife);
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      
      if (p.isLine) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.stroke();
      } else {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.font = 'bold 12px "Press Start 2P", Courier New';
    ctx.textAlign = 'center';
    
    for (const t of this.floatingTexts) {
      const alpha = Math.max(0, 1 - t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.shadowColor = '#000000';
      ctx.globalAlpha = alpha;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 1000
    });
  }
}
