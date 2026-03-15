import type { PlayerStateInterface, PlayerContext, StateTransition } from './PlayerState';
import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';
import { eventBus } from '../engine/EventBus';

const WALK_SPEED = 220;
const GRAVITY = 800;
const MAX_FALL = 500;
const JUMP_VEL = -480;

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

    // If jump just pressed in air, set jump buffer
    if (input.jumpPressed) {
      ctx.jumpBuffer = 0.1;
    }

    // Coyote time: allow jump if coyoteTimer > 0 (just left ground) or jumpBuffer active
    if (ctx.coyoteTimer > 0 && (input.jumpPressed || ctx.jumpBuffer > 0)) {
      ctx.vy = JUMP_VEL;
      ctx.jumpHoldTimer = 0;
      ctx.coyoteTimer = 0;
      ctx.jumpBuffer = 0;
      eventBus.emit('playSound', 'jump');
      return 'jumping';
    }

    // Decrement timers
    ctx.coyoteTimer = Math.max(0, ctx.coyoteTimer - dt);
    ctx.jumpBuffer = Math.max(0, ctx.jumpBuffer - dt);

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
