export class Fireball extends Phaser.Physics.Arcade.Sprite {
  isDead = false;
  private readonly direction: number;
  private lifetime = 3000;
  private bounceSpeed = 280;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: number) {
    super(scene, x, y, 'fireball');
    this.direction = direction;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(400);
    body.setMaxVelocityY(400);
    body.setSize(12, 12);
    body.setOffset(2, 2);
    body.setVelocityX(direction * this.bounceSpeed);
    body.setVelocityY(-100);
    this.setDepth(8);
  }

  update(delta: number): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.lifetime -= delta;

    if (this.lifetime <= 0) {
      this.explode();
      return;
    }

    // Bounce off ground
    if (body.blocked.down) {
      body.setVelocityY(-200);
    }

    // Explode on walls
    if (body.blocked.left || body.blocked.right) {
      this.explode();
    }

    // Keep horizontal velocity
    if (Math.abs(body.velocity.x) < 10) {
      body.setVelocityX(this.direction * this.bounceSpeed);
    }
  }

  explode(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }

  hitEnemy(): void {
    this.explode();
  }
}
