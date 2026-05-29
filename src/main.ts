import '../style.css';
import { Game } from './game/Game';
import { trackVisit } from './utils/trackVisit';

// Entry point — Corrupto Kart: Fuga del Expediente
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Canvas element #game-canvas not found');
}

const game = new Game(canvas);
void trackVisit();
game.init().catch((err) => {
  console.error('Failed to initialize game:', err);
});
