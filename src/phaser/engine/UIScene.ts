export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private worldText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;

  private score = 0;
  private lives = 3;
  private timeLeft = 400;
  private worldName = '1-1';

  private muteBtn!: Phaser.GameObjects.Text;
  private isMuted = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    };

    // Top bar background
    this.add.rectangle(400, 16, 800, 32, 0x000000, 0.5);

    // Score
    this.add.text(20, 6, 'MARIO', textStyle);
    this.scoreText = this.add.text(20, 20, '000000', textStyle);

    // Coins
    this.add.text(200, 6, 'COINS', textStyle);
    this.coinsText = this.add.text(200, 20, 'x00', textStyle);

    // World
    this.add.text(350, 6, 'WORLD', textStyle);
    this.worldText = this.add.text(350, 20, this.worldName, textStyle);

    // Time
    this.add.text(520, 6, 'TIME', textStyle);
    this.timerText = this.add.text(520, 20, String(this.timeLeft), textStyle);

    // Lives
    this.add.text(660, 6, 'LIVES', textStyle);
    this.livesText = this.add.text(660, 20, String(this.lives), textStyle);

    // Power indicator
    this.add.text(720, 6, 'POWER', { ...textStyle, fontSize: '12px' });
    this.powerText = this.add.text(720, 20, 'SMALL', { ...textStyle, fontSize: '12px', color: '#aaaaaa' });

    // Mute button
    this.muteBtn = this.add.text(770, 6, '[M]', {
      ...textStyle,
      fontSize: '14px',
      color: '#ffffff',
    }).setInteractive();
    this.muteBtn.on('pointerdown', () => this.toggleMute());
    this.input.keyboard!.on('keydown-M', () => this.toggleMute());

    // Listen to game events
    const gameEvents = this.scene.get('MarioScene').events;

    gameEvents.on('score-update', (score: number) => {
      this.score = score;
      this.scoreText.setText(String(score).padStart(6, '0'));
    });

    gameEvents.on('coins-update', (coins: number) => {
      this.coinsText.setText(`x${String(coins).padStart(2, '0')}`);
    });

    gameEvents.on('lives-update', (lives: number) => {
      this.lives = lives;
      this.livesText.setText(String(lives));
    });

    gameEvents.on('time-update', (time: number) => {
      this.timeLeft = Math.ceil(time);
      this.timerText.setText(String(Math.ceil(time)));
      if (time < 100) {
        this.timerText.setStyle({ color: '#ff4444' });
      } else {
        this.timerText.setStyle({ color: '#ffffff' });
      }
    });

    gameEvents.on('world-update', (world: string) => {
      this.worldName = world;
      this.worldText.setText(world);
    });

    gameEvents.on('power-update', (power: number) => {
      const labels = ['SMALL', 'SUPER', 'FIRE'];
      const colors = ['#aaaaaa', '#00ff88', '#ff6600'];
      this.powerText.setText(labels[power]);
      this.powerText.setStyle({ color: colors[power] });
    });

    gameEvents.on('game-over', () => {
      this.showGameOver();
    });

    gameEvents.on('level-complete', () => {
      this.showLevelComplete();
    });

    // Handle scene restart
    this.scene.get('MarioScene').events.once('shutdown', () => {
      this.scene.stop();
    });
  }

  private toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.muteBtn.setText(this.isMuted ? '[M]*' : '[M]');
    this.scene.get('MarioScene').events.emit('toggle-mute', this.isMuted);
  }

  private showGameOver(): void {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(100);
    this.add
      .text(width / 2, height / 2 - 30, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(101);

    this.add
      .text(width / 2, height / 2 + 40, `SCORE: ${String(this.score).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101);

    this.time.delayedCall(3000, () => {
      this.scene.stop('UIScene');
      this.scene.stop('MarioScene');
      this.scene.start('MenuScene');
    });
  }

  private showLevelComplete(): void {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setDepth(100);
    this.add
      .text(width / 2, height / 2 - 30, 'LEVEL COMPLETE!', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(101);

    this.add
      .text(width / 2, height / 2 + 40, `SCORE: ${String(this.score).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  update(_time: number, _delta: number): void {
    // Nothing needed - driven by events
  }
}
