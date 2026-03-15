import type { PlayerStateInterface } from './PlayerState';

// Forward declarations - populated after all state classes are defined
let _StandingState: new () => PlayerStateInterface;
let _JumpingState: new () => PlayerStateInterface;
let _FallingState: new () => PlayerStateInterface;

export function registerStates(
  Standing: new () => PlayerStateInterface,
  Jumping: new () => PlayerStateInterface,
  Falling: new () => PlayerStateInterface
): void {
  _StandingState = Standing;
  _JumpingState = Jumping;
  _FallingState = Falling;
}

export function createStandingState(): PlayerStateInterface {
  return new _StandingState();
}

export function createJumpingState(): PlayerStateInterface {
  return new _JumpingState();
}

export function createFallingState(): PlayerStateInterface {
  return new _FallingState();
}
