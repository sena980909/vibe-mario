import { TextureFactory } from './TextureFactory';
import level1Data from '../levels/level1.json';
import level2Data from '../levels/level2.json';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // JSON data is imported statically - inject into cache directly
  }

  create(): void {
    // Inject level data into Phaser cache
    this.cache.json.add('level1', level1Data);
    this.cache.json.add('level2', level2Data);

    // Generate all textures programmatically
    TextureFactory.createAllTextures(this);

    // Show brief loading text
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    bg.setDepth(0);

    const text = this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    text.setDepth(1);

    // Brief delay for visual feedback then go to menu
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
