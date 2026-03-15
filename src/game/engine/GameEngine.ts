import { InputManager } from './InputManager';
import { AssetManager } from './AssetManager';
import { eventBus } from './EventBus';
import { Camera } from '../world/Camera';
import { Level } from '../world/Level';
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { GameOverScreen } from '../ui/GameOverScreen';
import { SoundManager } from './SoundManager';
import type { SaveData } from '../types';

export type GameState = 'playing' | 'paused' | 'gameover' | 'victory' | 'transitioning';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private assetManager: AssetManager;
  private soundManager: SoundManager;
  private camera: Camera;
  private level: Level | null = null;
  private player: Player | null = null;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private gameOverScreen: GameOverScreen;

  private rafId: number = 0;
  private lastTime: number = 0;
  private gameState: GameState = 'playing';
  private pauseJustPressed = false;
  private stageNumber = 1;
  private score = 0;
  private lives = 3;
  private coins = 0;
  private highScore = 0;
  private timer = 400;
  private timerAccum = 0;
  private transitionTimer = 0;
  private stompCombo = 0;
  private stompComboTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.inputManager = new InputManager();
    this.assetManager = new AssetManager();
    this.soundManager = new SoundManager(this.assetManager);
    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD();
    this.pauseMenu = new PauseMenu();
    this.gameOverScreen = new GameOverScreen();

    this.setupEventListeners();
    this.loadSave();
  }

  private setupEventListeners(): void {
    eventBus.on('playerDied', () => this.onPlayerDied());
    eventBus.on('playerWon', () => this.onPlayerWon());
    eventBus.on('collectCoin', () => this.onCollectCoin());
    eventBus.on('addScore', (pts: unknown) => this.addScore(pts as number));
    eventBus.on('stompEnemy', () => this.onStompEnemy());
    eventBus.on('levelComplete', () => this.onLevelComplete());
    eventBus.on('playSound', (name: unknown) => this.soundManager.play(name as string));
  }

  private loadSave(): void {
    try {
      const raw = localStorage.getItem('marioSave');
      if (raw) {
        const data: SaveData = JSON.parse(raw);
        this.stageNumber = data.stage ?? 1;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
        this.highScore = data.highScore ?? 0;
      }
    } catch {
      // ignore
    }
  }

  private saveGame(): void {
    const data: SaveData = {
      stage: this.stageNumber,
      score: this.score,
      lives: this.lives,
      highScore: this.highScore,
    };
    localStorage.setItem('marioSave', JSON.stringify(data));
  }

  async init(): Promise<void> {
    await this.assetManager.preload();
    this.loadLevel(this.stageNumber);
  }

  private loadLevel(num: number): void {
    this.level = new Level(num);
    const spawn = this.level.getSpawnPoint();
    this.player = new Player(spawn.x, spawn.y, this.inputManager, this.soundManager);
    this.camera.setBounds(0, 0, this.level.getWidthPx(), this.level.getHeightPx());
    this.timer = 400;
    this.timerAccum = 0;
    this.stompCombo = 0;
    this.stompComboTimer = 0;
    this.gameState = 'playing';
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(currentTime: number): void {
    this.rafId = requestAnimationFrame((t) => this.loop(t));

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    dt = Math.min(dt, 0.05); // cap to prevent spiral of death

    this.inputManager.update();
    this.assetManager.resumeAudio();

    if (this.gameState === 'playing') {
      this.update(dt);
    } else if (this.gameState === 'transitioning') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.stageNumber++;
        if (this.stageNumber > 2) {
          this.stageNumber = 1; // loop back
        }
        this.loadLevel(this.stageNumber);
        this.saveGame();
      }
    }

    const input = this.inputManager.getState();

    // Pause toggle
    if (input.pause && !this.pauseJustPressed) {
      this.pauseJustPressed = true;
      if (this.gameState === 'playing') {
        this.gameState = 'paused';
      } else if (this.gameState === 'paused') {
        this.gameState = 'playing';
      }
    }
    if (!input.pause) {
      this.pauseJustPressed = false;
    }

    this.render();
  }

  private update(dt: number): void {
    if (!this.level || !this.player) return;

    // Timer countdown
    this.timerAccum += dt;
    if (this.timerAccum >= 1) {
      this.timerAccum -= 1;
      this.timer = Math.max(0, this.timer - 1);
      if (this.timer === 0) {
        this.player.kill();
      }
    }

    // Stomp combo reset
    this.stompComboTimer -= dt;
    if (this.stompComboTimer <= 0) {
      this.stompCombo = 0;
    }

    this.level.update(dt, this.player, this.camera);
    this.player.update(dt, this.level);

    // Camera follows player
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    this.camera.follow(px, py, dt);

    // Check out of bounds (fall death)
    if (this.player.y > this.level.getHeightPx() + 100) {
      this.player.kill();
    }
  }

  private render(): void {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.level && this.player) {
      // Draw background
      this.level.drawBackground(ctx, canvas.width, canvas.height, this.camera.x);

      ctx.save();
      ctx.translate(-this.camera.x, -this.camera.y);

      this.level.draw(ctx, this.camera);
      this.player.draw(ctx);

      ctx.restore();
    }

    // HUD always in screen space
    if (this.player) {
      this.hud.draw(ctx, {
        score: this.score,
        highScore: this.highScore,
        coins: this.coins,
        lives: this.lives,
        timer: this.timer,
        stage: this.stageNumber,
        powerLevel: this.player.powerLevel,
        canvasWidth: canvas.width,
      });
    }

    if (this.gameState === 'paused') {
      this.pauseMenu.draw(ctx, canvas.width, canvas.height);
    } else if (this.gameState === 'gameover') {
      this.gameOverScreen.draw(ctx, canvas.width, canvas.height, this.score, this.highScore, false);
    } else if (this.gameState === 'victory') {
      this.gameOverScreen.draw(ctx, canvas.width, canvas.height, this.score, this.highScore, true);
    } else if (this.gameState === 'transitioning') {
      // Level clear message
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COURSE CLEAR!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`SCORE: ${this.score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  private onPlayerDied(): void {
    this.lives--;
    this.soundManager.play('die');
    if (this.lives <= 0) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
      this.saveGame();
      this.gameState = 'gameover';
    } else {
      // Respawn after short delay
      setTimeout(() => {
        this.loadLevel(this.stageNumber);
      }, 1500);
    }
  }

  private onPlayerWon(): void {
    // Flag touched
    const timeBonus = this.timer * 10;
    this.addScore(timeBonus);
    this.gameState = 'transitioning';
    this.transitionTimer = 3;
    this.soundManager.play('levelClear');
  }

  private onLevelComplete(): void {
    this.onPlayerWon();
  }

  private onCollectCoin(): void {
    this.coins++;
    this.addScore(100);
    this.soundManager.play('coin');
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
    }
  }

  private onStompEnemy(): void {
    this.stompCombo++;
    this.stompComboTimer = 2;
    const pts = [100, 200, 400, 800, 1000, 1000, 1000, 1000];
    const idx = Math.min(this.stompCombo - 1, pts.length - 1);
    this.addScore(pts[idx]);
    this.soundManager.play('stomp');
  }

  private addScore(pts: number): void {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  resetGame(): void {
    this.score = 0;
    this.lives = 3;
    this.coins = 0;
    this.stageNumber = 1;
    this.loadLevel(1);
  }

  getState(): GameState {
    return this.gameState;
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.inputManager.destroy();
    this.assetManager.destroy();
    eventBus.clear();
  }
}
