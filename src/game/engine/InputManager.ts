export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
  pause: boolean;
  jumpPressed: boolean;  // just pressed this frame
  shootPressed: boolean; // just pressed this frame
}

export class InputManager {
  private keys: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
    // Prevent default for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  update(): void {
    this.prevKeys = new Set(this.keys);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  isJustPressed(code: string): boolean {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  getState(): InputState {
    return {
      left: this.isDown('ArrowLeft') || this.isDown('KeyA'),
      right: this.isDown('ArrowRight') || this.isDown('KeyD'),
      jump: this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW'),
      shoot: this.isDown('KeyZ') || this.isDown('KeyX'),
      pause: this.isDown('Escape'),
      jumpPressed: this.isJustPressed('Space') || this.isJustPressed('ArrowUp') || this.isJustPressed('KeyW'),
      shootPressed: this.isJustPressed('KeyZ') || this.isJustPressed('KeyX'),
    };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }
}
