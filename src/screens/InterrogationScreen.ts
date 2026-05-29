// ─────────────────────────────────────────────────────────────
// InterrogationScreen.ts — Pantalla de interrogatorio periodístico
// ¡Miente o muere! (políticamente hablando)
// ─────────────────────────────────────────────────────────────

import {
  InterrogationQuestion,
  InterrogationOption,
  getInterrogationSet,
} from '../data/interrogationQuestions';
import { sfx } from '../utils/sfx';

export type InterrogationResult = 'passed' | 'failed' | null;

/** Duration (ms) the reaction overlay stays visible before proceeding. */
const REACTION_DURATION_MS = 600;

/** Time penalty (ms) applied for each evasion answer. */
const EVASION_PENALTY_MS = 3000;

export class InterrogationScreen {
  // ── DOM references ──────────────────────────────────────────
  private overlay: HTMLElement;
  private titleEl: HTMLElement;
  private questionEl: HTMLElement;
  private optionsEl: HTMLElement;
  private reactionEl: HTMLElement;
  private progressEl: HTMLElement;

  // ── State ───────────────────────────────────────────────────
  private questions: InterrogationQuestion[] = [];
  private currentIndex = 0;
  private result: InterrogationResult = null;
  private timePenalty = 0;
  private answering = false; // prevents double-clicks

  // ── Callback ────────────────────────────────────────────────
  private onComplete:
    | ((result: InterrogationResult, timePenalty: number) => void)
    | null = null;

  constructor() {
    this.overlay = document.getElementById('interrogation-screen')!;
    this.titleEl = document.getElementById('interrogation-title')!;
    this.questionEl = document.getElementById('interrogation-question')!;
    this.optionsEl = document.getElementById('interrogation-options')!;
    this.reactionEl = document.getElementById('interrogation-reaction')!;
    this.progressEl = document.getElementById('interrogation-progress')!;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Kicks off the interrogation sequence for the given character.
   * Shows the overlay and displays the first question.
   */
  start(characterId: string, askedQuestions: Set<string>): void {
    this.questions = getInterrogationSet(characterId, askedQuestions);
    // Add all selected questions to the asked set so they won't repeat
    this.questions.forEach((q) => askedQuestions.add(q.question));
    this.currentIndex = 0;
    this.result = null;
    this.timePenalty = 0;
    this.answering = false;

    this.titleEl.textContent = '🎤 ¡INTERROGATORIO PERIODÍSTICO!';
    this.reactionEl.classList.remove('visible');

    // Show overlay with dramatic entrance
    this.overlay.classList.add('active');

    this.showQuestion(0);
  }

  /**
   * Register callback invoked when the interrogation ends.
   * @param callback receives the result ('passed' | 'failed') and total time penalty in ms.
   */
  setOnComplete(
    callback: (result: InterrogationResult, timePenalty: number) => void,
  ): void {
    this.onComplete = callback;
  }

  /** Hides the interrogation overlay immediately. */
  hide(): void {
    this.overlay.classList.remove('active');
    this.reactionEl.classList.remove('visible');
  }

  // ── Private: question rendering ─────────────────────────────

  /**
   * Renders the question at the given index inside the overlay.
   */
  private showQuestion(index: number): void {
    const q = this.questions[index];
    if (!q) return;

    this.questionEl.textContent = q.question;
    this.progressEl.textContent = `${index + 1}/${this.questions.length}`;
    this.answering = false;

    // Clear previous options
    this.optionsEl.innerHTML = '';

    q.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'interrogation-option';
      btn.textContent = option.text;
      btn.style.transition = 'all 0.15s ease'; // Smooth fade out/scale transitions
      btn.addEventListener('click', () => this.handleAnswer(option, btn));
      this.optionsEl.appendChild(btn);
    });
  }

  // ── Private: answer handling ────────────────────────────────

  /**
   * Processes the player's answer choice.
   *  - lie:     clean escape → next question (or pass if last)
   *  - evasion: survive but add EVASION_PENALTY_MS → next question (or pass)
   *  - truth:   GAME OVER immediately
   */
  private handleAnswer(option: InterrogationOption, clickedBtn: HTMLButtonElement): void {
    // Guard against double-clicks while reaction is showing
    if (this.answering) return;
    this.answering = true;

    // Visual feedback: highlight selected button and fade out others
    clickedBtn.classList.add(`chosen-${option.type}`);
    this.optionsEl.querySelectorAll('button').forEach((btn) => {
      const b = btn as HTMLButtonElement;
      b.disabled = true;
      if (b !== clickedBtn) {
        b.style.opacity = '0.3';
        b.style.transform = 'scale(0.98)';
      }
    });

    switch (option.type) {
      case 'truth':
        this.showReaction(option.response, 'truth', () => {
          this.result = 'failed';
          this.finish();
        });
        break;

      case 'evasion':
        this.timePenalty += EVASION_PENALTY_MS;
        sfx.playCorrect();
        this.showReaction(option.response, 'evasion', () => {
          this.advanceOrFinish();
        });
        break;

      case 'lie':
        sfx.playCorrect();
        this.showReaction(option.response, 'lie', () => {
          this.advanceOrFinish();
        });
        break;
    }
  }

  /**
   * Move to the next question or finish with a pass if all answered.
   */
  private advanceOrFinish(): void {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.result = 'passed';
      this.finish();
    } else {
      this.showQuestion(this.currentIndex);
    }
  }

  /**
   * Invoke the onComplete callback and clean up.
   */
  private finish(): void {
    if (this.onComplete) {
      this.onComplete(this.result, this.timePenalty);
    }
  }

  // ── Private: reaction feedback ──────────────────────────────

  /**
   * Shows a brief color-coded reaction overlay before proceeding.
   *  - lie:     green  (good — you got away with it)
   *  - evasion: yellow (meh — survived but penalty)
   *  - truth:   red    (catastrophic)
   *
   * @param text     the reaction text to show
   * @param type     answer type for color coding
   * @param onDone   callback invoked after REACTION_DURATION_MS
   */
  private showReaction(
    text: string,
    type: 'lie' | 'evasion' | 'truth',
    onDone: () => void,
  ): void {
    this.reactionEl.textContent = text;

    // Remove any previous type class
    this.reactionEl.classList.remove(
      'reaction-lie',
      'reaction-evasion',
      'reaction-truth',
    );
    this.reactionEl.classList.add(`reaction-${type}`);
    this.reactionEl.classList.add('visible');

    // Disable option buttons while reaction is showing
    this.optionsEl.querySelectorAll('button').forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
    });

    setTimeout(() => {
      this.reactionEl.classList.remove('visible');
      onDone();
    }, REACTION_DURATION_MS);
  }
}
