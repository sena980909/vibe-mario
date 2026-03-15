export class Goomba extends Phaser.Physics.Arcade.Sprite {
  isDead = false;
  isFlat = false;
  private flatTimer = 0;
  private animTimer = 0;
  private animFrame = 0;
  private moveSpeed = 60;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'goomba-walk1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 28);
    body.setOffset(2, 2);
    body.setGravityY(0);
    body.setMaxVelocityY(500);
    body.setVelocityX(-this.moveSpeed);
    this.setDepth(5);
  }

  update(delta: number): void {
    if (this.isDead) {
      if (this.isFlat) {
        this.flatTimer -= delta;
        if (this.flatTimer <= 0) {
          this.destroy();
        }
      }
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Turn around at walls or ledge edges
    if (body.blocked.left) {
      body.setVelocityX(this.moveSpeed);
    } else if (body.blocked.right) {
      body.setVelocityX(-this.moveSpeed);
    }

    // Flip sprite based on direction
    this.setFlipX(body.velocity.x > 0);

    // Animation
    this.animTimer += delta;
    if (this.animTimer > 200) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
      this.setTexture(this.animFrame === 0 ? 'goomba-walk1' : 'goomba-walk2');
    }
  }

  stomp(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.isFlat = true;
    this.flatTimer = 500;
    this.setTexture('goomba-flat');
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    body.checkCollision.none = true;
  }

  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(body.velocity.x > 0 ? 100 : -100, -200);
    body.checkCollision.none = true;
    this.scene.time.delayedCall(1000, () => this.destroy());
  }
}
