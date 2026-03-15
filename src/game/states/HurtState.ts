import type { PlayerStateInterface, PlayerContext, StateTransition } from './PlayerState';
import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';

const INVINCIBLE_DURATION = 1.5;
const GRAVITY = 800;
const MAX_FALL = 500;
const WALK_SPEED = 220;

export class HurtState implements PlayerStateInterface {
  name = 'hurt';
  private timer = INVINCIBLE_DURATION;

  enter(_ctx: PlayerContext): void {
    this.timer = INVINCIBLE_DURATION;
  }
  exit(_ctx: PlayerContext): void {}

  getTimer(): number { return this.timer; }

  update(ctx: PlayerContext, input: InputState, dt: number, level: Level): StateTransition {
    this.timer -= dt;

    if (input.left) {
      ctx.vx = -WALK_SPEED;
      ctx.facingRight = false;
    } else if (input.right) {
      ctx.vx = WALK_SPEED;
      ctx.facingRight = true;
    } else {
      ctx.vx *= 0.8;
      if (Math.abs(ctx.vx) < 5) ctx.vx = 0;
    }

    ctx.vy += GRAVITY * dt;
    if (ctx.vy > MAX_FALL) ctx.vy = MAX_FALL;

    const result = level.resolveTileCollisions(ctx.x, ctx.y, ctx.width, ctx.height, ctx.vx, ctx.vy, dt);
    ctx.x = result.x;
    ctx.y = result.y;
    ctx.vx = result.vx;
    ctx.vy = result.vy;
    ctx.onGround = result.onGround;

    if (this.timer <= 0) {
      return ctx.onGround ? 'standing' : 'falling';
    }

    return 'stay';
  }
}
