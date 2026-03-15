import type { PlayerStateInterface, PlayerContext, StateTransition } from './PlayerState';
import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';
import { eventBus } from '../engine/EventBus';

const WALK_SPEED = 220;
const GRAVITY = 800;
const JUMP_VEL = -480;
const MAX_FALL = 500;

export class StandingState implements PlayerStateInterface {
  name = 'standing';

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
      ctx.vx *= 0.8;
      if (Math.abs(ctx.vx) < 5) ctx.vx = 0;
    }

    // On ground: reset coyote timer and drain jump buffer
    if (ctx.onGround) {
      ctx.coyoteTimer = 0.1;
    }

    // Jump: triggered by input or buffered jump
    if (input.jumpPressed || ctx.jumpBuffer > 0) {
      ctx.vy = JUMP_VEL;
      ctx.jumpHoldTimer = 0;
      ctx.jumpBuffer = 0;
      eventBus.emit('playSound', 'jump');
      return 'jumping';
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
      ctx.vy = Math.abs(ctx.vy) * 0.1;
    }

    if (!ctx.onGround) {
      return ctx.vy > 0 ? 'falling' : 'jumping';
    }

    return 'stay';
  }
}
