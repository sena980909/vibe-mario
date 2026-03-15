export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.3,
    delay = 0
  ): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.type = type;
      osc.frequency.value = frequency;
      const startTime = ctx.currentTime + delay;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // ignore audio errors
    }
  }

  playJump(): void {
    const ctx = this.getContext();
    if (this.isMuted || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  }

  playCoin(): void {
    this.playTone(987, 0.1, 'square', 0.3);
    this.playTone(1319, 0.15, 'square', 0.3, 0.1);
  }

  playPowerUp(): void {
    const freqs = [261, 329, 392, 523];
    freqs.forEach((f, i) => this.playTone(f, 0.1, 'square', 0.3, i * 0.1));
  }

  playFireball(): void {
    this.playTone(800, 0.05, 'sawtooth', 0.15);
    this.playTone(400, 0.1, 'sawtooth', 0.1, 0.05);
  }

  playEnemyStomp(): void {
    this.playTone(200, 0.05, 'square', 0.4);
    this.playTone(100, 0.1, 'square', 0.3, 0.05);
  }

  playBrickBreak(): void {
    this.playTone(300, 0.05, 'square', 0.3);
    this.playTone(150, 0.1, 'noise' as OscillatorType, 0.2, 0.05);
  }

  playBlockHit(): void {
    this.playTone(261, 0.06, 'square', 0.3);
  }

  playFlagpole(): void {
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => this.playTone(f, 0.15, 'square', 0.3, i * 0.12));
  }

  playDead(): void {
    const ctx = this.getContext();
    if (this.isMuted || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore
    }
  }

  playStarMusic(): void {
    const melody = [659,659,0,659,0,523,659,0,784,0,0,392];
    let t = 0;
    for (const freq of melody) {
      if (freq > 0) this.playTone(freq, 0.12, 'square', 0.2, t);
      t += 0.15;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.3;
    }
  }

  isMutedState(): boolean {
    return this.isMuted;
  }
}
