import { AssetManager } from './AssetManager';

export class SoundManager {
  private assetManager: AssetManager;
  private muted = false;
  private masterVolume = 0.5;
  private bgmTimeouts: ReturnType<typeof setTimeout>[] = [];
  private bgmActive = false;
  private bgmTrack: 'overworld' | 'underground' | 'boss' | null = null;
  private masterGain: GainNode | null = null;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.masterGain.context.currentTime);
    }
  }

  getVolume(): number {
    return this.masterVolume;
  }

  private getMasterGain(ctx: AudioContext): GainNode {
    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  play(sound: string): void {
    if (this.muted) return;
    try {
      const ctx = this.assetManager.getAudioContext();
      if (ctx.state === 'suspended') return;
      switch (sound) {
        case 'jump': this.playJump(ctx); break;
        case 'coin': this.playCoin(ctx); break;
        case 'stomp': this.playStomp(ctx); break;
        case 'powerup': this.playPowerUp(ctx); break;
        case 'hurt': this.playHurt(ctx); break;
        case 'die': this.playDie(ctx); break;
        case 'levelClear': this.playLevelClear(ctx); break;
        case 'fireball': this.playFireball(ctx); break;
        case 'blockBreak': this.playBlockBreak(ctx); break;
        case 'star': this.playStar(ctx); break;
      }
    } catch {
      // Ignore audio errors
    }
  }

  // ==================== BGM ====================

  startBGM(track: 'overworld' | 'underground' | 'boss'): void {
    if (this.bgmTrack === track && this.bgmActive) return;
    this.stopBGM();
    this.bgmTrack = track;
    this.bgmActive = true;
    try {
      const ctx = this.assetManager.getAudioContext();
      if (ctx.state === 'suspended') return;
      this.scheduleBGMLoop(ctx, track, 0);
    } catch {
      // Ignore
    }
  }

  stopBGM(): void {
    this.bgmActive = false;
    this.bgmTrack = null;
    for (const t of this.bgmTimeouts) clearTimeout(t);
    this.bgmTimeouts = [];
  }

  pauseBGM(): void {
    this.bgmActive = false;
    for (const t of this.bgmTimeouts) clearTimeout(t);
    this.bgmTimeouts = [];
    try {
      const ctx = this.assetManager.getAudioContext();
      if (ctx && ctx.state === 'running') ctx.suspend();
    } catch {
      // ignore
    }
  }

  resumeBGM(): void {
    try {
      const ctx = this.assetManager.getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch {
      // ignore
    }
    if (this.bgmTrack) this.startBGM(this.bgmTrack);
  }

  private scheduleBGMLoop(ctx: AudioContext, track: string, iteration: number): void {
    if (!this.bgmActive || this.bgmTrack !== track) return;

    let notes: number[];
    let noteDuration: number;
    let loopDuration: number;

    if (track === 'overworld') {
      // Upbeat C major arpeggio melody
      notes = [
        261, 329, 392, 523,   // C4 E4 G4 C5
        392, 329, 261, 329,   // G4 E4 C4 E4
        392, 440, 523, 440,   // G4 A4 C5 A4
        392, 329, 261, 0,     // G4 E4 C4 rest
      ];
      noteDuration = 0.18;
      loopDuration = notes.length * noteDuration * 1000;
    } else if (track === 'underground') {
      // Darker, minor scale, slower
      notes = [
        220, 0, 233, 0,       // A3 rest Bb3 rest
        246, 0, 220, 0,       // B3 rest A3 rest
        196, 0, 220, 0,       // G3 rest A3 rest
        175, 0, 196, 0,       // F3 rest G3 rest
      ];
      noteDuration = 0.28;
      loopDuration = notes.length * noteDuration * 1000;
    } else {
      // Boss: fast, intense, diminished
      notes = [
        440, 466, 440, 415,
        440, 415, 392, 415,
        440, 0, 523, 0,
        494, 0, 466, 0,
      ];
      noteDuration = 0.12;
      loopDuration = notes.length * noteDuration * 1000;
    }

    void iteration;

    // Schedule all notes in this loop iteration
    notes.forEach((freq, i) => {
      if (freq === 0) return; // rest
      const startTime = ctx.currentTime + i * noteDuration;
      try {
        const gain = this.getMasterGain(ctx);
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.type = track === 'underground' ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, startTime);
        const vol = track === 'boss' ? 0.08 : 0.06;
        noteGain.gain.setValueAtTime(vol, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 0.9);
        osc.start(startTime);
        osc.stop(startTime + noteDuration * 0.9);
      } catch {
        // ignore
      }
    });

    // Schedule next loop
    const timeout = setTimeout(() => {
      if (this.bgmActive && this.bgmTrack === track) {
        this.scheduleBGMLoop(ctx, track, iteration + 1);
      }
    }, loopDuration);
    this.bgmTimeouts.push(timeout);
  }

  // ==================== SFX ====================

  private playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', gainVal = 0.15): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playJump(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  private playCoin(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(988, ctx.currentTime);
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  private playStomp(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  private playPowerUp(ctx: AudioContext): void {
    const notes = [262, 330, 392, 523];
    const master = this.getMasterGain(ctx);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  private playHurt(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  private playDie(ctx: AudioContext): void {
    const notes = [494, 440, 370, 294, 247];
    const master = this.getMasterGain(ctx);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  private playLevelClear(ctx: AudioContext): void {
    const notes = [523, 659, 784, 1047];
    const master = this.getMasterGain(ctx);
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.15;
      this.playToneAt(ctx, freq, 0.15, t, master);
    });
  }

  private playToneAt(ctx: AudioContext, freq: number, duration: number, startTime: number, masterNode?: GainNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const dest = masterNode ?? this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playFireball(ctx: AudioContext): void {
    this.playTone(ctx, 800, 0.05, 'sawtooth', 0.1);
  }

  private playBlockBreak(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = this.getMasterGain(ctx);
    osc.connect(gain);
    gain.connect(master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  private playStar(ctx: AudioContext): void {
    const notes = [784, 988, 1175, 1568];
    const master = this.getMasterGain(ctx);
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.1;
      this.playToneAt(ctx, freq, 0.1, t, master);
    });
  }
}
