export class MenuScene extends Phaser.Scene {
  private blinkTimer = 0;
  private blinkText!: Phaser.GameObjects.Text;
  private blinkVisible = true;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Sky background
    if (this.textures.exists('sky-bg')) {
      this.add.image(width / 2, height / 2, 'sky-bg');
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x5c94fc);
    }

    // Decorative elements
    if (this.textures.exists('cloud')) {
      this.add.image(150, 80, 'cloud').setAlpha(0.9);
      this.add.image(500, 60, 'cloud').setAlpha(0.9);
      this.add.image(700, 100, 'cloud').setAlpha(0.8);
    }

    if (this.textures.exists('hill')) {
      this.add.image(100, height - 60, 'hill').setAlpha(0.7);
      this.add.image(650, height - 60, 'hill').setAlpha(0.7);
    }

    // Ground strip
    this.add.rectangle(width / 2, height - 16, width, 32, 0x5a8a00);
    this.add.rectangle(width / 2, height - 6, width, 12, 0x3d6200);

    // Title
    const titleStyle = {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 0,
        fill: true,
      },
    };

    this.add
      .text(width / 2, height / 2 - 100, 'SUPER MARIO', titleStyle)
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 - 50, 'PHASER EDITION', {
        ...titleStyle,
        fontSize: '32px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    // Controls hint
    this.add
      .text(width / 2, height / 2 + 40, '← → Move    ↑/Space Jump    Z Fire', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Blinking press start text
    this.blinkText = this.add
      .text(width / 2, height / 2 + 100, 'PRESS ENTER TO START', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Mario sprite preview
    if (this.textures.exists('mario-super-stand')) {
      const mario = this.add.image(width / 2 - 20, height / 2 - 5, 'mario-super-stand');
      mario.setScale(2);
    }

    // Input
    this.input.keyboard!.on('keydown-ENTER', this.startGame, this);
    this.input.keyboard!.on('keydown-SPACE', this.startGame, this);
  }

  update(_time: number, delta: number): void {
    this.blinkTimer += delta;
    if (this.blinkTimer > 500) {
      this.blinkTimer = 0;
      this.blinkVisible = !this.blinkVisible;
      this.blinkText.setVisible(this.blinkVisible);
    }
  }

  private startGame(): void {
    this.scene.start('MarioScene', { levelId: 1 });
    this.scene.launch('UIScene');
  }
}
