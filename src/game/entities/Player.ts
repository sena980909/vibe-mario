import { InputManager } from '../engine/InputManager';
import { SoundManager } from '../engine/SoundManager';
import type { PlayerStateInterface, PlayerContext } from '../states/PlayerState';
import { StandingState } from '../states/StandingState';
import { JumpingState } from '../states/JumpingState';
import { FallingState } from '../states/FallingState';
import { HurtState } from '../states/HurtState';
import { Level } from '../world/Level';
import { Fireball } from './Fireball';
import { eventBus } from '../engine/EventBus';

export class Player implements PlayerContext {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number = 0;
  vy: number = 0;
  powerLevel: number = 0; // 0=small, 1=super, 2=fire
  facingRight: boolean = true;
  onGround: boolean = false;
  jumpHoldTimer: number = 0;

  private state: PlayerStateInterface;
  private inputManager: InputManager;
  private _dead: boolean = false;
  private flickerTimer: number = 0;
  private shootCooldown: number = 0;
  private walkFrame: number = 0;
  private walkFrameTimer: number = 0;

  constructor(x: number, y: number, inputManager: InputManager, _soundManager: SoundManager) {
    this.x = x;
    this.y = y;
    this.powerLevel = 0;
    this.width = 16;
    this.height = 16;
    this.inputManager = inputManager;
    this.state = new StandingState();
    this.state.enter(this);
  }

  isInvincible(): boolean {
    return (this.state instanceof HurtState) || this._dead;
  }

  isDead(): boolean {
    return this._dead;
  }

  hurt(): void {
    if (this.isInvincible() || this._dead) return;
    eventBus.emit('playSound', 'hurt');
    if (this.powerLevel === 0) {
      this.kill();
    } else {
      this.powerLevel = Math.max(0, this.powerLevel - 1);
      this.updateSize();
      this.transitionTo('hurt');
    }
  }

  kill(): void {
    if (this._dead) return;
    this._dead = true;
    this.vy = -400;
    this.vx = 0;
    eventBus.emit('playerDied');
  }

  bounce(): void {
    this.vy = -350;
    this.onGround = false;
  }

  private updateSize(): void {
    if (this.powerLevel === 0) {
      const oldH = this.height;
      this.width = 16;
      this.height = 16;
      this.y += oldH - this.height;
    } else {
      const oldH = this.height;
      this.width = 16;
      this.height = 32;
      if (oldH < this.height) {
        this.y -= this.height - oldH;
      }
    }
  }

  powerUp(type: 'mushroom' | 'fireFlower'): void {
    if (type === 'mushroom' && this.powerLevel === 0) {
      this.powerLevel = 1;
      this.updateSize();
      eventBus.emit('playSound', 'powerup');
    } else if (type === 'fireFlower') {
      if (this.powerLevel === 0) {
        this.powerLevel = 1;
        this.updateSize();
      }
      this.powerLevel = 2;
      eventBus.emit('playSound', 'powerup');
    }
  }

  private transitionTo(name: string): void {
    this.state.exit(this);
    switch (name) {
      case 'standing': this.state = new StandingState(); break;
      case 'jumping':  this.state = new JumpingState(); break;
      case 'falling':  this.state = new FallingState(); break;
      case 'hurt':     this.state = new HurtState(); break;
      default: return;
    }
    this.state.enter(this);
  }

  update(dt: number, level: Level): void {
    if (this._dead) {
      this.vy += 980 * dt;
      this.y += this.vy * dt;
      return;
    }

    const input = this.inputManager.getState();

    // Flicker timer for invincibility
    if (this.state instanceof HurtState) {
      this.flickerTimer += dt;
    } else {
      this.flickerTimer = 0;
    }

    // Shoot cooldown
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);

    // Shoot fireball
    if (this.powerLevel === 2 && input.shootPressed && this.shootCooldown <= 0) {
      const fbX = this.facingRight ? this.x + this.width : this.x - 8;
      const fbY = this.y + this.height / 2 - 4;
      const fb = new Fireball(fbX, fbY, this.facingRight ? 400 : -400);
      level.addFireball(fb);
      this.shootCooldown = 0.4;
      eventBus.emit('playSound', 'fireball');
    }

    // Walk animation
    if (Math.abs(this.vx) > 10) {
      this.walkFrameTimer += dt;
      if (this.walkFrameTimer > 0.12) {
        this.walkFrameTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 3;
      }
    } else {
      this.walkFrame = 0;
      this.walkFrameTimer = 0;
    }

    // State machine update
    const transition = this.state.update(this, input, dt, level);
    if (transition !== 'stay') {
      this.transitionTo(transition);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this._dead) {
      // Draw falling dead mario (no flicker)
      ctx.save();
      if (!this.facingRight) {
        ctx.translate(Math.round(this.x) + this.width, Math.round(this.y));
        ctx.scale(-1, 1);
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
      }
      if (this.powerLevel > 0) {
        this.drawSuperMario(ctx, Math.round(this.x), Math.round(this.y));
      } else {
        this.drawSmallMario(ctx, Math.round(this.x), Math.round(this.y));
      }
      ctx.restore();
      return;
    }

    // Flicker during invincibility
    if (this.state instanceof HurtState) {
      if (Math.floor(this.flickerTimer * 10) % 2 === 0) return;
    }

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    ctx.save();
    if (!this.facingRight) {
      ctx.translate(x + this.width, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }

    if (this.powerLevel > 0) {
      this.drawSuperMario(ctx, x, y);
    } else {
      this.drawSmallMario(ctx, x, y);
    }

    ctx.restore();
  }

  private drawSmallMario(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const isFireMario = this.powerLevel === 2;
    const hatColor = isFireMario ? '#ffffff' : '#cc0000';
    const bodyColor = isFireMario ? '#ffffff' : '#cc0000';
    const overallColor = isFireMario ? '#cc0000' : '#0000cc';
    const skinColor = '#ffcc99';

    // Hat
    ctx.fillStyle = hatColor;
    ctx.fillRect(x + 3, y, w - 6, 4);
    ctx.fillRect(x + 1, y + 3, w - 2, 3);

    // Face
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 2, y + 6, w - 4, 4);

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w - 6, y + 7, 2, 2);

    // Mustache
    ctx.fillStyle = '#4a2400';
    ctx.fillRect(x + 2, y + 9, w - 5, 1);

    // Body/overalls
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 3, y + 10, w - 6, 2);
    ctx.fillStyle = overallColor;
    ctx.fillRect(x + 2, y + 11, w - 4, 2);

    // Shoes
    ctx.fillStyle = '#4a2400';
    if (this.walkFrame === 1) {
      ctx.fillRect(x + 1, y + 13, 5, 3);
      ctx.fillRect(x + w - 4, y + 12, 5, 3);
    } else {
      ctx.fillRect(x + 1, y + 12, 5, 4);
      ctx.fillRect(x + w - 5, y + 12, 5, 4);
    }
  }

  private drawSuperMario(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const h = this.height;
    const isFireMario = this.powerLevel === 2;
    const hatColor = isFireMario ? '#ffffff' : '#cc0000';
    const bodyColor = isFireMario ? '#ffffff' : '#cc0000';
    const overallColor = isFireMario ? '#cc0000' : '#0000cc';
    const skinColor = '#ffcc99';

    // Hat
    ctx.fillStyle = hatColor;
    ctx.fillRect(x + 3, y, w - 6, 5);
    ctx.fillRect(x, y + 3, w, 5);

    // Face
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 2, y + 8, w - 4, 7);

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w - 6, y + 10, 3, 3);

    // Mustache
    ctx.fillStyle = '#4a2400';
    ctx.fillRect(x + 2, y + 13, w - 5, 2);

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 3, y + 15, w - 6, 4);

    // Overalls
    ctx.fillStyle = overallColor;
    ctx.fillRect(x + 1, y + 18, w - 2, 7);
    // Straps
    ctx.fillRect(x + 3, y + 15, 3, 4);
    ctx.fillRect(x + w - 6, y + 15, 3, 4);

    // Arms
    ctx.fillStyle = skinColor;
    if (this.walkFrame === 1) {
      ctx.fillRect(x - 2, y + 15, 3, 7);
      ctx.fillRect(x + w - 1, y + 18, 3, 7);
    } else {
      ctx.fillRect(x - 2, y + 18, 3, 7);
      ctx.fillRect(x + w - 1, y + 15, 3, 7);
    }

    // Legs
    ctx.fillStyle = overallColor;
    if (this.walkFrame === 0) {
      ctx.fillRect(x + 1, y + 25, 6, 3);
      ctx.fillRect(x + w - 7, y + 25, 6, 3);
    } else if (this.walkFrame === 1) {
      ctx.fillRect(x + 1, y + 23, 6, 3);
      ctx.fillRect(x + w - 7, y + 27, 6, 3);
    } else {
      ctx.fillRect(x + 1, y + 27, 6, 3);
      ctx.fillRect(x + w - 7, y + 23, 6, 3);
    }

    // Shoes
    ctx.fillStyle = '#4a2400';
    ctx.fillRect(x, y + h - 4, w - 1, 4);
  }
}
