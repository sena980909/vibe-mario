import type { PlayerStateInterface, PlayerContext, StateTransition } from './PlayerState';
import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';

const WALK_SPEED = 200;
const GRAVITY = 980;
const MAX_FALL = 600;

export class FallingState implements PlayerStateInterface {
  name = 'falling';

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

    ctx.vy += GRAVITY * dt;
    if (ctx.vy > MAX_FALL) ctx.vy = MAX_FALL;

    const result = level.resolveTileCollisions(ctx.x, ctx.y, ctx.width, ctx.height, ctx.vx, ctx.vy, dt);
    ctx.x = result.x;
    ctx.y = result.y;
    ctx.vx = result.vx;
    ctx.vy = result.vy;
    ctx.onGround = result.onGround;

    if (ctx.onGround) return 'standing';

    return 'stay';
  }
}
