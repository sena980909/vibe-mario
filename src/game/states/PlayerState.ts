import type { InputState } from '../engine/InputManager';
import type { Level } from '../world/Level';

export interface PlayerContext {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  powerLevel: number;
  facingRight: boolean;
  onGround: boolean;
  jumpHoldTimer: number;
}

export type StateTransition = 'standing' | 'jumping' | 'falling' | 'hurt' | 'stay';

export interface PlayerStateInterface {
  name: string;
  enter(ctx: PlayerContext): void;
  update(ctx: PlayerContext, input: InputState, dt: number, level: Level): StateTransition;
  exit(ctx: PlayerContext): void;
}
