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
import { DebugOverlay } from './DebugOverlay';
import type { CheatCommand } from './DebugOverlay';
import { Enemy } from '../entities/Enemy';
import type { SaveData } from '../types';

export type GameState = 'playing' | 'paused' | 'gameover' | 'victory' | 'transitioning';

// Extended save data with stars
interface ExtendedSaveData extends SaveData {
  stars?: Record<string, number>;
  volume?: number;
}

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
  private debugOverlay: DebugOverlay;

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
  private currentFPS = 60;

  // Stars tracking: key = "stage_starIndex" => count collected
  private starsCollected: Record<string, number> = {};

  // Mouse event handlers for pause menu
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

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
    this.debugOverlay = new DebugOverlay();

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
    canvas.addEventListener('mousedown', this.boundMouseDown);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('keydown', this.boundKeyDown);

    this.setupEventListeners();
    this.loadSave();
  }

  private getCanvasMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.gameState !== 'paused') return;
    const { x, y } = this.getCanvasMousePos(e);
    const result = this.pauseMenu.handleClick(x, y, this.canvas.width, this.canvas.height);
    if (result === 'resume') {
      this.gameState = 'playing';
      this.soundManager.resumeBGM();
    } else if (result === 'menu') {
      this.soundManager.stopBGM();
      this.resetGame();
    }
    // Sync volume
    this.soundManager.setVolume(this.pauseMenu.getVolume());
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.gameState !== 'paused') return;
    const { x, y } = this.getCanvasMousePos(e);
    this.pauseMenu.handleMouseMove(x, y, this.canvas.width, this.canvas.height);
    this.soundManager.setVolume(this.pauseMenu.getVolume());
  }

  private onMouseUp(_e: MouseEvent): void {
    this.pauseMenu.handleMouseUp();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.debugOverlay.isEnabled()) return;
    if (e.code === 'Backquote') {
      this.debugOverlay.activateCheatConsole();
      return;
    }
    if (this.debugOverlay.isCheatConsoleActive()) {
      let key = e.key;
      if (e.code === 'Enter') key = 'Enter';
      else if (e.code === 'Escape') key = 'Escape';
      else if (e.code === 'Backspace') key = 'Backspace';
      const cmd = this.debugOverlay.handleCheatInput(key);
      if (cmd) {
        this.dispatchCheatCommand(cmd);
      }
    }
  }

  private setupEventListeners(): void {
    eventBus.on('playerDied', () => this.onPlayerDied());
    eventBus.on('playerWon', () => this.onPlayerWon());
    eventBus.on('collectCoin', () => this.onCollectCoin());
    eventBus.on('addScore', (pts: unknown) => this.addScore(pts as number));
    eventBus.on('stompEnemy', () => this.onStompEnemy());
    eventBus.on('levelComplete', () => this.onLevelComplete());
    eventBus.on('playSound', (name: unknown) => this.soundManager.play(name as string));
    eventBus.on('collectStar', (idx: unknown) => this.onCollectStar(idx as number));
    eventBus.on('warpPlayer', (info: unknown) => this.onWarpPlayer(info as { destLevel: number; destX: number; destY: number }));
  }

  private onCollectStar(idx: number): void {
    const key = `${this.stageNumber}_${idx}`;
    this.starsCollected[key] = 1;
    this.debugOverlay.addLog(`Star ${idx + 1} collected!`);
    this.saveGame();
  }

  private onWarpPlayer(info: { destLevel: number; destX: number; destY: number }): void {
    if (!this.player) return;
    if (info.destLevel !== this.stageNumber) {
      // Warp to different level
      this.stageNumber = info.destLevel;
      this.loadLevel(this.stageNumber);
      if (this.player) {
        this.player.x = info.destX;
        this.player.y = info.destY;
      }
    } else {
      // Warp within same level
      this.player.x = info.destX;
      this.player.y = info.destY;
    }
    this.debugOverlay.addLog(`Warped to (${Math.round(info.destX)}, ${Math.round(info.destY)})`);
  }

  private loadSave(): void {
    try {
      const raw = localStorage.getItem('marioSave');
      if (raw) {
        const data: ExtendedSaveData = JSON.parse(raw);
        this.stageNumber = data.stage ?? 1;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
        this.highScore = data.highScore ?? 0;
        this.starsCollected = data.stars ?? {};
        if (data.volume !== undefined) {
          this.soundManager.setVolume(data.volume);
          this.pauseMenu.setVolume(data.volume);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveGame(): void {
    const data: ExtendedSaveData = {
      stage: this.stageNumber,
      score: this.score,
      lives: this.lives,
      highScore: this.highScore,
      stars: this.starsCollected,
      volume: this.soundManager.getVolume(),
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

    // Start appropriate BGM
    this.soundManager.startBGM(this.level.isUnderground() ? 'underground' : 'overworld');
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

    this.assetManager.resumeAudio();

    // Update debug FPS
    this.debugOverlay.updateFPS(dt);
    if (dt > 0) this.currentFPS = Math.round(1 / dt);

    if (this.gameState === 'playing') {
      this.update(dt);
    } else if (this.gameState === 'transitioning') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.stageNumber++;
        if (this.stageNumber > 2) {
          this.gameState = 'victory';
          this.soundManager.stopBGM();
        } else {
          this.loadLevel(this.stageNumber);
          this.saveGame();
        }
      }
    }

    const input = this.inputManager.getState();
    this.inputManager.update(); // update prevKeys AFTER reading state this frame

    // Debug toggle (backtick)
    if (input.debugTogglePressed) {
      this.debugOverlay.toggle();
      this.debugOverlay.addLog(`Debug ${this.debugOverlay.isEnabled() ? 'ON' : 'OFF'}`);
    }

    // Pause toggle
    if (input.pause && !this.pauseJustPressed) {
      this.pauseJustPressed = true;
      if (this.gameState === 'playing') {
        this.gameState = 'paused';
        this.soundManager.pauseBGM();
      } else if (this.gameState === 'paused') {
        this.gameState = 'playing';
        this.soundManager.resumeBGM();
      }
    }
    if (!input.pause) {
      this.pauseJustPressed = false;
    }

    // Restart from gameover or victory screen
    if (this.gameState === 'gameover' || this.gameState === 'victory') {
      if (input.jumpPressed || input.pause) {
        this.resetGame();
        this.gameState = 'playing';
      }
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
      // Switch to hurry BGM at timer < 100
      if (this.timer === 99) {
        this.soundManager.startBGM('boss');
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

    // Handle cheat commands if debug is enabled
    // (cheat console text input is handled in keydown listener via DebugOverlay)
  }

  private getStarsCollectedForStage(): number {
    let count = 0;
    for (const key of Object.keys(this.starsCollected)) {
      if (key.startsWith(`${this.stageNumber}_`)) count++;
    }
    return count;
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
        starsCollected: this.getStarsCollectedForStage(),
        totalStars: 3,
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

    // Debug overlay is always on top
    const entityCount = this.level
      ? this.level.enemies.length + this.level.coins.length + this.level.particles.length + this.level.fireballs.length
      : 0;

    // We need to translate back to screen space for the player context
    if (this.player && this.level) {
      // Draw debug overlay using screen-space player coords
      const screenPlayer = {
        x: this.player.x - this.camera.x,
        y: this.player.y - this.camera.y,
        width: this.player.width,
        height: this.player.height,
        vx: this.player.vx,
        vy: this.player.vy,
        powerLevel: this.player.powerLevel,
        facingRight: this.player.facingRight,
        onGround: this.player.onGround,
        jumpHoldTimer: this.player.jumpHoldTimer,
        coyoteTimer: this.player.coyoteTimer,
        jumpBuffer: this.player.jumpBuffer,
      };
      this.debugOverlay.draw(ctx, canvas.width, canvas.height, screenPlayer, entityCount, this.currentFPS);
    } else {
      this.debugOverlay.draw(ctx, canvas.width, canvas.height, null, entityCount, this.currentFPS);
    }
  }

  private onPlayerDied(): void {
    this.lives--;
    this.soundManager.stopBGM();
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
    this.soundManager.stopBGM();
    this.soundManager.play('levelClear');
    this.debugOverlay.addLog('Level complete!');
  }

  private onLevelComplete(): void {
    this.onPlayerWon();
  }

  private onCollectCoin(): void {
    this.coins++;
    this.addScore(100);
    this.soundManager.play('coin');
    this.debugOverlay.addLog(`Coin collected (${this.coins})`);
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
      this.debugOverlay.addLog('1-UP! Extra life!');
    }
  }

  private onStompEnemy(): void {
    this.stompCombo++;
    this.stompComboTimer = 2;
    const pts = [100, 200, 400, 800, 1000, 1000, 1000, 1000];
    const idx = Math.min(this.stompCombo - 1, pts.length - 1);
    this.addScore(pts[idx]);
    this.soundManager.play('stomp');
    this.debugOverlay.addLog(`Enemy stomped! +${pts[idx]}`);
  }

  private addScore(pts: number): void {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  resetGame(): void {
    this.soundManager.stopBGM();
    this.score = 0;
    this.lives = 3;
    this.coins = 0;
    this.stageNumber = 1;
    this.starsCollected = {};
    this.loadLevel(1);
  }

  getState(): GameState {
    return this.gameState;
  }

  // Dispatch cheat commands from DebugOverlay
  private dispatchCheatCommand(cmd: CheatCommand | null): void {
    if (!cmd) return;

    switch (cmd.type) {
      case 'nextStage':
        this.stageNumber = (this.stageNumber % 2) + 1;
        this.loadLevel(this.stageNumber);
        this.debugOverlay.addLog(`Warped to stage ${this.stageNumber}`);
        break;
      case 'powerUp':
        if (this.player) {
          this.player.powerLevel = Math.max(0, Math.min(2, cmd.level));
          this.debugOverlay.addLog(`Power set to ${cmd.level}`);
        }
        break;
      case 'spawnEnemy':
        if (this.level) {
          this.level.enemies.push(new Enemy('goomba', cmd.x, cmd.y));
          this.debugOverlay.addLog(`Enemy spawned at (${cmd.x}, ${cmd.y})`);
        }
        break;
      case 'setGravity':
        this.debugOverlay.addLog(`Gravity: ${cmd.value} (engine N/A)`);
        break;
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.inputManager.destroy();
    this.assetManager.destroy();
    this.soundManager.stopBGM();
    this.canvas.removeEventListener('mousedown', this.boundMouseDown);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('keydown', this.boundKeyDown);
    eventBus.clear();
  }
}
