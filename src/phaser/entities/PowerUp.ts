export type PowerUpType = 'mushroom' | 'fireflower' | 'star';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  isCollected = false;
  readonly powerType: PowerUpType;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PowerUpType
  ) {
    const textureMap: Record<PowerUpType, string> = {
      mushroom: 'mushroom',
      fireflower: 'fireflower',
      star: 'star',
    };
    super(scene, x, y, textureMap[type]);
    this.powerType = type;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    body.setMaxVelocityY(500);
    body.setSize(28, 28);
    body.setOffset(2, 2);
    this.setDepth(4);

    if (type === 'mushroom') {
      body.setVelocityX(80);
    } else if (type === 'star') {
      body.setVelocityX(120);
    }
  }

  update(_delta: number): void {
    if (this.isCollected) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.powerType === 'mushroom' || this.powerType === 'star') {
      if (body.blocked.left) {
        body.setVelocityX(80);
      } else if (body.blocked.right) {
        body.setVelocityX(-80);
      }
      if (this.powerType === 'star' && body.blocked.down) {
        body.setVelocityY(-300);
      }
    }
  }

  collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;
    this.destroy();
  }
}
