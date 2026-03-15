export class Coin extends Phaser.Physics.Arcade.Sprite {
  isCollected = false;
  private bobTimer = 0;
  private startY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.startY = y;
    this.setDepth(4);
  }

  update(_delta: number): void {
    if (this.isCollected) return;
    this.bobTimer += 0.05;
    this.y = this.startY + Math.sin(this.bobTimer) * 2;
  }

  collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    // Pop up animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }
}
