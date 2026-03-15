import type { PlayerStateInterface, PlayerContext, StateTransition } from './PlayerState';
import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';

const WALK_SPEED = 200;
const GRAVITY = 980;
const MAX_FALL = 600;
const JUMP_HOLD_FORCE = 200;
const MAX_JUMP_HOLD = 0.3;

export class JumpingState implements PlayerStateInterface {
  name = 'jumping';

  enter(_ctx: PlayerContext): void {}
  exit(_ctx: PlayerContext): void {}

  update(ctx: PlayerContext, input: InputState, dt: number, level: Level): StateTransition {
    if (input.left) {
      ctx.vx = -WALK_SPEED;
      ctx.facingRight = false;
    } else if (input.right) {
      ctx.vx = WALK_SPEED;
      ctx.facingRight = true;
    } else {
      ctx.vx *= 0.95;
      if (Math.abs(ctx.vx) < 5) ctx.vx = 0;
    }

    if (input.jump && ctx.jumpHoldTimer < MAX_JUMP_HOLD) {
      ctx.jumpHoldTimer += dt;
      ctx.vy -= JUMP_HOLD_FORCE * dt;
    }

    ctx.vy += GRAVITY * dt;
    if (ctx.vy > MAX_FALL) ctx.vy = MAX_FALL;

    const result = level.resolveTileCollisions(ctx.x, ctx.y, ctx.width, ctx.height, ctx.vx, ctx.vy, dt);
    ctx.x = result.x;
    ctx.y = result.y;
    ctx.vx = result.vx;
    ctx.vy = result.vy;
    ctx.onGround = result.onGround;

    if (result.hitHead) {
      ctx.jumpHoldTimer = MAX_JUMP_HOLD;
      ctx.vy = Math.abs(ctx.vy) * 0.1;
    }

    if (ctx.onGround) return 'standing';
    if (ctx.vy > 0) return 'falling';

    return 'stay';
  }
}
