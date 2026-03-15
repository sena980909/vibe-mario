// Asset manager - for this game we draw everything programmatically,
// but we still manage audio contexts and any cached data here.

export class AssetManager {
  private audioCtx: AudioContext | null = null;
  private loaded = false;

  async preload(): Promise<void> {
    // No image files needed - all graphics are drawn with Canvas 2D
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  resumeAudio(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  destroy(): void {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
