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
  coyoteTimer: number = 0;
  jumpBuffer: number = 0;
  isPressingDown: boolean = false;

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
    this.vy = -380;
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
      this.vy += 800 * dt;
      this.y += this.vy * dt;
      return;
    }

    const input = this.inputManager.getState();
    this.isPressingDown = input.down ?? false;

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
    const h = this.height;
    const isFireMario = this.powerLevel === 2;
    const bodyColor = isFireMario ? '#ffffff' : '#e52213';
    const overallColor = isFireMario ? '#e52213' : '#0052a5';
    const walkFrame = this.walkFrame;

    // Hat (red)
    ctx.fillStyle = '#e52213';
    ctx.fillRect(x + 2, y,   12, 3);   // hat top
    ctx.fillRect(x,     y + 3,  16, 3);  // hat brim

    // Hair/Sideburn (dark brown)
    ctx.fillStyle = '#6b3a2a';
    ctx.fillRect(x + 1, y + 5, 3, 2);

    // Face (skin)
    ctx.fillStyle = '#fba876';
    ctx.fillRect(x + 2, y + 6, 11, 5);

    // Eye (black)
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 9, y + 7, 3, 2);

    // Mustache (dark brown)
    ctx.fillStyle = '#6b3a2a';
    ctx.fillRect(x + 3, y + 10, 9, 2);

    // Body/shirt
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 3, y + 12, 10, 2);

    // Overalls
    ctx.fillStyle = overallColor;
    ctx.fillRect(x + 1, y + 11, 14, 4);  // straps area

    // Legs
    ctx.fillStyle = overallColor;
    if (walkFrame === 0) {
      ctx.fillRect(x + 2,  y + 13, 5, 3);
      ctx.fillRect(x + 9,  y + 13, 5, 3);
    } else if (walkFrame === 1) {
      ctx.fillRect(x + 2,  y + 12, 5, 4);
      ctx.fillRect(x + 9,  y + 14, 5, 2);
    } else {
      ctx.fillRect(x + 2,  y + 14, 5, 2);
      ctx.fillRect(x + 9,  y + 12, 5, 4);
    }

    // Shoes (dark brown) - cap at y+h-1
    ctx.fillStyle = '#3b1e08';
    const shoeY = Math.min(y + 15, y + h - 1);
    if (walkFrame === 0) {
      ctx.fillRect(x + 1, shoeY, 6, 1);
      ctx.fillRect(x + 8, shoeY, 6, 1);
    } else if (walkFrame === 1) {
      ctx.fillRect(x,     shoeY, 7, 1);
      ctx.fillRect(x + 9, shoeY, 5, 1);
    } else {
      ctx.fillRect(x + 1, shoeY, 5, 1);
      ctx.fillRect(x + 8, shoeY, 7, 1);
    }
  }

  private drawSuperMario(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const isFireMario = this.powerLevel === 2;
    const bodyColor = isFireMario ? '#ffffff' : '#e52213';
    const overallColor = isFireMario ? '#e52213' : '#0052a5';
    const walkFrame = this.walkFrame;

    // Hat
    ctx.fillStyle = '#e52213';
    ctx.fillRect(x + 2, y,    12, 5);  // top
    ctx.fillRect(x,     y + 5,  16, 5);  // brim

    // Hair
    ctx.fillStyle = '#6b3a2a';
    ctx.fillRect(x + 1, y + 9, 3, 3);

    // Face (skin)
    ctx.fillStyle = '#fba876';
    ctx.fillRect(x + 2, y + 10, 11, 7);

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 9, y + 11, 3, 3);

    // Mustache
    ctx.fillStyle = '#6b3a2a';
    ctx.fillRect(x + 3, y + 15, 9, 3);

    // Shirt (red/white)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 2, y + 17, 12, 4);

    // Overalls (blue/red)
    ctx.fillStyle = overallColor;
    ctx.fillRect(x + 1, y + 17, 14, 8);  // overall body
    // Straps
    ctx.fillRect(x + 3, y + 17, 3, 5);
    ctx.fillRect(x + 10, y + 17, 3, 5);

    // Arms (skin)
    ctx.fillStyle = '#fba876';
    if (walkFrame === 1) {
      ctx.fillRect(x - 2, y + 17, 3, 9);
      ctx.fillRect(x + w - 1, y + 21, 3, 9);
    } else {
      ctx.fillRect(x - 2, y + 21, 3, 9);
      ctx.fillRect(x + w - 1, y + 17, 3, 9);
    }

    // Legs (overalls)
    ctx.fillStyle = overallColor;
    if (walkFrame === 0) {
      ctx.fillRect(x + 2, y + 25, 5, 5);
      ctx.fillRect(x + 9, y + 25, 5, 5);
    } else if (walkFrame === 1) {
      ctx.fillRect(x + 2, y + 22, 5, 7);
      ctx.fillRect(x + 9, y + 27, 5, 3);
    } else {
      ctx.fillRect(x + 2, y + 27, 5, 3);
      ctx.fillRect(x + 9, y + 22, 5, 7);
    }

    // Shoes (dark brown)
    ctx.fillStyle = '#3b1e08';
    ctx.fillRect(x,     y + 28, 8, 4);
    ctx.fillRect(x + 8, y + 28, 8, 4);
  }
}
