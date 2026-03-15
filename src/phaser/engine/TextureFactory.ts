export class TextureFactory {
  static createGroundTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('ground')) return;
    const g = scene.add.graphics();
    // Brown body
    g.fillStyle(0x8b5e3c);
    g.fillRect(0, 0, 32, 32);
    // Green top strip
    g.fillStyle(0x5a8a00);
    g.fillRect(0, 0, 32, 6);
    // Darker green line
    g.fillStyle(0x3d6200);
    g.fillRect(0, 6, 32, 2);
    // Soil detail lines
    g.fillStyle(0x6b4423);
    g.fillRect(0, 8, 32, 1);
    g.fillStyle(0x7a5230);
    g.fillRect(4, 12, 6, 2);
    g.fillRect(18, 18, 8, 2);
    g.fillRect(8, 24, 5, 2);
    g.generateTexture('ground', 32, 32);
    g.destroy();
  }

  static createBrickTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('brick')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xc84b0c);
    g.fillRect(0, 0, 32, 32);
    // Mortar lines
    g.fillStyle(0x8b3a10);
    g.fillRect(0, 10, 32, 2);
    g.fillRect(0, 22, 32, 2);
    g.fillRect(0, 0, 2, 10);
    g.fillRect(16, 0, 2, 10);
    g.fillRect(8, 12, 2, 10);
    g.fillRect(24, 12, 2, 10);
    g.fillRect(0, 24, 2, 8);
    g.fillRect(16, 24, 2, 8);
    // Highlight
    g.fillStyle(0xe05a1a);
    g.fillRect(3, 1, 12, 8);
    g.fillRect(19, 1, 11, 8);
    g.fillRect(11, 13, 12, 8);
    g.fillStyle(0xf07020);
    g.fillRect(3, 1, 12, 1);
    g.fillRect(19, 1, 11, 1);
    g.generateTexture('brick', 32, 32);
    g.destroy();
  }

  static createQuestionTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('question')) return;
    const g = scene.add.graphics();
    // Gold background
    g.fillStyle(0xe8a000);
    g.fillRect(0, 0, 32, 32);
    // Border
    g.fillStyle(0xffd700);
    g.fillRect(0, 0, 32, 3);
    g.fillRect(0, 0, 3, 32);
    g.fillStyle(0xa06000);
    g.fillRect(29, 0, 3, 32);
    g.fillRect(0, 29, 32, 3);
    // Question mark
    g.fillStyle(0xffffff);
    g.fillRect(12, 6, 8, 2);
    g.fillRect(10, 8, 4, 2);
    g.fillRect(18, 8, 4, 2);
    g.fillRect(10, 10, 4, 2);
    g.fillRect(14, 12, 4, 4);
    g.fillRect(14, 18, 4, 4);
    g.fillRect(14, 24, 4, 4);
    g.generateTexture('question', 32, 32);
    g.destroy();
  }

  static createUsedBlockTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('used-block')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x888888);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x666666);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 0, 2, 32);
    g.fillStyle(0xaaaaaa);
    g.fillRect(2, 2, 28, 2);
    g.fillRect(2, 2, 2, 28);
    g.fillStyle(0x777777);
    g.fillRect(30, 0, 2, 32);
    g.fillRect(0, 30, 32, 2);
    g.generateTexture('used-block', 32, 32);
    g.destroy();
  }

  static createPipeTLTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('pipe-tl')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x008800);
    g.fillRect(0, 0, 4, 32);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x00cc00);
    g.fillRect(4, 8, 28, 4);
    g.fillRect(4, 12, 4, 20);
    g.generateTexture('pipe-tl', 32, 32);
    g.destroy();
  }

  static createPipeTRTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('pipe-tr')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x008800);
    g.fillRect(28, 0, 4, 32);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x00cc00);
    g.fillRect(0, 8, 28, 4);
    g.fillRect(24, 12, 4, 20);
    g.generateTexture('pipe-tr', 32, 32);
    g.destroy();
  }

  static createPipeBLTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('pipe-bl')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x008800);
    g.fillRect(0, 0, 4, 32);
    g.fillStyle(0x00cc00);
    g.fillRect(4, 0, 4, 32);
    g.generateTexture('pipe-bl', 32, 32);
    g.destroy();
  }

  static createPipeBRTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('pipe-br')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x008800);
    g.fillRect(28, 0, 4, 32);
    g.fillStyle(0x009900);
    g.fillRect(24, 0, 4, 32);
    g.generateTexture('pipe-br', 32, 32);
    g.destroy();
  }

  static createFlagPoleTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('flag-pole')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00000000, 0);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xaaaaaa);
    g.fillRect(14, 0, 4, 32);
    g.fillStyle(0xcccccc);
    g.fillRect(15, 0, 2, 32);
    g.generateTexture('flag-pole', 32, 32);
    g.destroy();
  }

  static createFlagTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('flag')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillRect(0, 0, 24, 16);
    g.fillStyle(0x008800);
    g.fillRect(0, 0, 24, 3);
    g.fillStyle(0x00cc00);
    g.fillRect(2, 4, 20, 8);
    g.generateTexture('flag', 24, 16);
    g.destroy();
  }

  static createMarioTextures(scene: Phaser.Scene): void {
    // Small Mario - standing
    if (!scene.textures.exists('mario-small-stand')) {
      const g = scene.add.graphics();
      // Hat
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 3);
      g.fillRect(0, 3, 16, 3);
      // Hair
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 5, 3, 2);
      // Face
      g.fillStyle(0xfba876);
      g.fillRect(2, 6, 11, 5);
      // Eye
      g.fillStyle(0x000000);
      g.fillRect(9, 7, 3, 2);
      // Mustache
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 10, 9, 2);
      // Overalls
      g.fillStyle(0x0052a5);
      g.fillRect(1, 11, 14, 4);
      // Overall buttons
      g.fillStyle(0xfba876);
      g.fillRect(2, 12, 2, 2);
      g.fillRect(12, 12, 2, 2);
      // Shoes
      g.fillStyle(0x3b1e08);
      g.fillRect(0, 14, 7, 2);
      g.fillRect(9, 14, 7, 2);
      g.generateTexture('mario-small-stand', 16, 16);
      g.destroy();
    }

    // Small Mario - walk1
    if (!scene.textures.exists('mario-small-walk1')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 3);
      g.fillRect(0, 3, 16, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 5, 3, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 6, 11, 5);
      g.fillStyle(0x000000);
      g.fillRect(9, 7, 3, 2);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 10, 9, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(1, 11, 14, 4);
      g.fillStyle(0xfba876);
      g.fillRect(2, 12, 2, 2);
      g.fillRect(12, 12, 2, 2);
      // Shifted leg
      g.fillStyle(0x3b1e08);
      g.fillRect(2, 14, 6, 2);
      g.fillRect(10, 14, 6, 2);
      g.generateTexture('mario-small-walk1', 16, 16);
      g.destroy();
    }

    // Small Mario - walk2
    if (!scene.textures.exists('mario-small-walk2')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 3);
      g.fillRect(0, 3, 16, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 5, 3, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 6, 11, 5);
      g.fillStyle(0x000000);
      g.fillRect(9, 7, 3, 2);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 10, 9, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(1, 11, 14, 4);
      g.fillStyle(0xfba876);
      g.fillRect(2, 12, 2, 2);
      g.fillRect(12, 12, 2, 2);
      g.fillStyle(0x3b1e08);
      g.fillRect(0, 14, 5, 2);
      g.fillRect(11, 14, 5, 2);
      g.generateTexture('mario-small-walk2', 16, 16);
      g.destroy();
    }

    // Small Mario - jump
    if (!scene.textures.exists('mario-small-jump')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 3);
      g.fillRect(0, 3, 16, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 5, 3, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 6, 11, 5);
      g.fillStyle(0x000000);
      g.fillRect(9, 7, 3, 2);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 10, 9, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(1, 11, 14, 4);
      g.fillStyle(0xfba876);
      g.fillRect(2, 12, 2, 2);
      g.fillRect(12, 12, 2, 2);
      g.fillStyle(0x3b1e08);
      g.fillRect(1, 13, 6, 3);
      g.fillRect(10, 14, 5, 2);
      g.generateTexture('mario-small-jump', 16, 16);
      g.destroy();
    }

    // Super Mario - standing (16x32)
    if (!scene.textures.exists('mario-super-stand')) {
      const g = scene.add.graphics();
      // Hat
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 4);
      g.fillRect(0, 4, 16, 4);
      // Hair
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 7, 4, 2);
      // Face
      g.fillStyle(0xfba876);
      g.fillRect(2, 8, 12, 7);
      // Eye
      g.fillStyle(0x000000);
      g.fillRect(10, 9, 3, 3);
      // Mustache
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 14, 10, 2);
      // Torso/overalls
      g.fillStyle(0xe52213);
      g.fillRect(2, 16, 12, 6);
      g.fillStyle(0x0052a5);
      g.fillRect(0, 16, 2, 6);
      g.fillRect(14, 16, 2, 6);
      g.fillRect(3, 22, 10, 6);
      // Belt
      g.fillStyle(0x6b3a2a);
      g.fillRect(0, 22, 16, 2);
      // Legs
      g.fillStyle(0x0052a5);
      g.fillRect(1, 24, 6, 4);
      g.fillRect(9, 24, 6, 4);
      // Shoes
      g.fillStyle(0x3b1e08);
      g.fillRect(0, 28, 7, 4);
      g.fillRect(9, 28, 7, 4);
      g.generateTexture('mario-super-stand', 16, 32);
      g.destroy();
    }

    // Super Mario - walk1
    if (!scene.textures.exists('mario-super-walk1')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 4);
      g.fillRect(0, 4, 16, 4);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 7, 4, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 8, 12, 7);
      g.fillStyle(0x000000);
      g.fillRect(10, 9, 3, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 14, 10, 2);
      g.fillStyle(0xe52213);
      g.fillRect(2, 16, 12, 6);
      g.fillStyle(0x0052a5);
      g.fillRect(0, 16, 2, 6);
      g.fillRect(14, 16, 2, 6);
      g.fillRect(3, 22, 10, 6);
      g.fillStyle(0x6b3a2a);
      g.fillRect(0, 22, 16, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(3, 24, 5, 4);
      g.fillRect(10, 24, 5, 4);
      g.fillStyle(0x3b1e08);
      g.fillRect(2, 28, 7, 4);
      g.fillRect(10, 28, 6, 4);
      g.generateTexture('mario-super-walk1', 16, 32);
      g.destroy();
    }

    // Super Mario - walk2
    if (!scene.textures.exists('mario-super-walk2')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 4);
      g.fillRect(0, 4, 16, 4);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 7, 4, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 8, 12, 7);
      g.fillStyle(0x000000);
      g.fillRect(10, 9, 3, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 14, 10, 2);
      g.fillStyle(0xe52213);
      g.fillRect(2, 16, 12, 6);
      g.fillStyle(0x0052a5);
      g.fillRect(0, 16, 2, 6);
      g.fillRect(14, 16, 2, 6);
      g.fillRect(3, 22, 10, 6);
      g.fillStyle(0x6b3a2a);
      g.fillRect(0, 22, 16, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(1, 24, 5, 4);
      g.fillRect(11, 24, 5, 4);
      g.fillStyle(0x3b1e08);
      g.fillRect(0, 28, 6, 4);
      g.fillRect(11, 28, 5, 4);
      g.generateTexture('mario-super-walk2', 16, 32);
      g.destroy();
    }

    // Super Mario - jump
    if (!scene.textures.exists('mario-super-jump')) {
      const g = scene.add.graphics();
      g.fillStyle(0xe52213);
      g.fillRect(2, 0, 12, 4);
      g.fillRect(0, 4, 16, 4);
      g.fillStyle(0x6b3a2a);
      g.fillRect(1, 7, 4, 2);
      g.fillStyle(0xfba876);
      g.fillRect(2, 8, 12, 7);
      g.fillStyle(0x000000);
      g.fillRect(10, 9, 3, 3);
      g.fillStyle(0x6b3a2a);
      g.fillRect(3, 14, 10, 2);
      g.fillStyle(0xe52213);
      g.fillRect(2, 16, 12, 6);
      g.fillStyle(0x0052a5);
      g.fillRect(0, 16, 2, 6);
      g.fillRect(14, 16, 2, 6);
      g.fillRect(3, 22, 10, 6);
      g.fillStyle(0x6b3a2a);
      g.fillRect(0, 22, 16, 2);
      g.fillStyle(0x0052a5);
      g.fillRect(2, 24, 5, 4);
      g.fillRect(9, 24, 5, 4);
      g.fillStyle(0x3b1e08);
      g.fillRect(1, 27, 6, 5);
      g.fillRect(9, 28, 6, 4);
      g.generateTexture('mario-super-jump', 16, 32);
      g.destroy();
    }
  }

  static createGoombaTextures(scene: Phaser.Scene): void {
    // Goomba walk1
    if (!scene.textures.exists('goomba-walk1')) {
      const g = scene.add.graphics();
      // Body
      g.fillStyle(0xc07030);
      g.fillRect(2, 8, 28, 20);
      // Head
      g.fillStyle(0xc07030);
      g.fillRect(4, 2, 24, 14);
      // Eyes
      g.fillStyle(0xffffff);
      g.fillRect(6, 5, 7, 7);
      g.fillRect(19, 5, 7, 7);
      // Pupils
      g.fillStyle(0x000000);
      g.fillRect(8, 7, 4, 4);
      g.fillRect(20, 7, 4, 4);
      // Eyebrows (angry)
      g.fillStyle(0x6b3a00);
      g.fillRect(6, 4, 7, 2);
      g.fillRect(19, 4, 7, 2);
      // Feet
      g.fillStyle(0x6b3a00);
      g.fillRect(2, 26, 10, 6);
      g.fillRect(20, 26, 10, 6);
      // Bottom
      g.fillRect(2, 28, 28, 4);
      g.generateTexture('goomba-walk1', 32, 32);
      g.destroy();
    }

    // Goomba walk2
    if (!scene.textures.exists('goomba-walk2')) {
      const g = scene.add.graphics();
      g.fillStyle(0xc07030);
      g.fillRect(2, 8, 28, 20);
      g.fillStyle(0xc07030);
      g.fillRect(4, 2, 24, 14);
      g.fillStyle(0xffffff);
      g.fillRect(6, 5, 7, 7);
      g.fillRect(19, 5, 7, 7);
      g.fillStyle(0x000000);
      g.fillRect(9, 7, 4, 4);
      g.fillRect(21, 7, 4, 4);
      g.fillStyle(0x6b3a00);
      g.fillRect(6, 4, 7, 2);
      g.fillRect(19, 4, 7, 2);
      // Different feet position
      g.fillStyle(0x6b3a00);
      g.fillRect(4, 26, 10, 6);
      g.fillRect(18, 26, 10, 6);
      g.fillRect(2, 28, 28, 4);
      g.generateTexture('goomba-walk2', 32, 32);
      g.destroy();
    }

    // Goomba flat (stomped)
    if (!scene.textures.exists('goomba-flat')) {
      const g = scene.add.graphics();
      g.fillStyle(0xc07030);
      g.fillRect(0, 18, 32, 14);
      g.fillStyle(0xffffff);
      g.fillRect(4, 20, 7, 5);
      g.fillRect(21, 20, 7, 5);
      g.fillStyle(0x000000);
      g.fillRect(6, 21, 3, 3);
      g.fillRect(23, 21, 3, 3);
      g.fillStyle(0x6b3a00);
      g.fillRect(4, 19, 7, 2);
      g.fillRect(21, 19, 7, 2);
      g.generateTexture('goomba-flat', 32, 32);
      g.destroy();
    }
  }

  static createKoopaTextures(scene: Phaser.Scene): void {
    // Koopa walk1
    if (!scene.textures.exists('koopa-walk1')) {
      const g = scene.add.graphics();
      // Shell
      g.fillStyle(0x00aa00);
      g.fillRect(4, 10, 24, 18);
      // Shell highlight
      g.fillStyle(0x00cc00);
      g.fillRect(6, 12, 12, 10);
      // Shell lines
      g.fillStyle(0x008800);
      g.fillRect(4, 20, 24, 2);
      g.fillRect(16, 10, 2, 18);
      // Head
      g.fillStyle(0xffdd44);
      g.fillRect(6, 2, 16, 10);
      // Eye
      g.fillStyle(0xffffff);
      g.fillRect(14, 3, 6, 6);
      g.fillStyle(0x000000);
      g.fillRect(17, 5, 3, 3);
      // Feet
      g.fillStyle(0xffdd44);
      g.fillRect(2, 26, 10, 6);
      g.fillRect(20, 26, 10, 6);
      g.generateTexture('koopa-walk1', 32, 32);
      g.destroy();
    }

    // Koopa walk2
    if (!scene.textures.exists('koopa-walk2')) {
      const g = scene.add.graphics();
      g.fillStyle(0x00aa00);
      g.fillRect(4, 10, 24, 18);
      g.fillStyle(0x00cc00);
      g.fillRect(6, 12, 12, 10);
      g.fillStyle(0x008800);
      g.fillRect(4, 20, 24, 2);
      g.fillRect(16, 10, 2, 18);
      g.fillStyle(0xffdd44);
      g.fillRect(6, 2, 16, 10);
      g.fillStyle(0xffffff);
      g.fillRect(14, 3, 6, 6);
      g.fillStyle(0x000000);
      g.fillRect(16, 5, 3, 3);
      g.fillStyle(0xffdd44);
      g.fillRect(4, 26, 10, 6);
      g.fillRect(18, 26, 10, 6);
      g.generateTexture('koopa-walk2', 32, 32);
      g.destroy();
    }

    // Koopa shell
    if (!scene.textures.exists('koopa-shell')) {
      const g = scene.add.graphics();
      g.fillStyle(0x00aa00);
      g.fillRect(2, 6, 28, 22);
      g.fillStyle(0x00cc00);
      g.fillRect(4, 8, 14, 12);
      g.fillStyle(0x008800);
      g.fillRect(2, 18, 28, 2);
      g.fillRect(16, 6, 2, 22);
      g.fillStyle(0xffdd44);
      g.fillRect(8, 2, 16, 6);
      g.generateTexture('koopa-shell', 32, 32);
      g.destroy();
    }
  }

  static createCoinTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('coin')) return;
    const g = scene.add.graphics();
    // Yellow circle
    g.fillStyle(0xffd700);
    g.fillCircle(12, 12, 10);
    // Inner circle
    g.fillStyle(0xffaa00);
    g.fillCircle(12, 12, 7);
    // Shine
    g.fillStyle(0xffff80);
    g.fillCircle(9, 8, 3);
    g.generateTexture('coin', 24, 24);
    g.destroy();
  }

  static createMushroomTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('mushroom')) return;
    const g = scene.add.graphics();
    // Stem
    g.fillStyle(0xffffff);
    g.fillRect(8, 16, 16, 16);
    // Cap
    g.fillStyle(0xdd2200);
    g.fillRect(0, 6, 32, 14);
    g.fillRect(4, 2, 24, 6);
    g.fillRect(8, 0, 16, 4);
    // White dots
    g.fillStyle(0xffffff);
    g.fillCircle(8, 10, 4);
    g.fillCircle(24, 10, 4);
    g.fillCircle(16, 6, 3);
    g.generateTexture('mushroom', 32, 32);
    g.destroy();
  }

  static createFireFlowerTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('fireflower')) return;
    const g = scene.add.graphics();
    // Stem
    g.fillStyle(0x00aa00);
    g.fillRect(14, 16, 4, 16);
    // Petals
    g.fillStyle(0xff6600);
    g.fillCircle(16, 10, 8);
    g.fillStyle(0xff9900);
    g.fillCircle(16, 10, 5);
    // Center
    g.fillStyle(0xffff00);
    g.fillCircle(16, 10, 3);
    g.generateTexture('fireflower', 32, 32);
    g.destroy();
  }

  static createFireballTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('fireball')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xff6600);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffcc00);
    g.fillCircle(8, 8, 5);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 6, 2);
    g.generateTexture('fireball', 16, 16);
    g.destroy();
  }

  static createStarTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('star')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffd700);
    // 5-point star using polygon points
    const cx = 16, cy = 16, outerR = 14, innerR = 6;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    g.fillPoints(points, true);
    g.fillStyle(0xffff80);
    g.fillCircle(13, 12, 3);
    g.generateTexture('star', 32, 32);
    g.destroy();
  }

  static createSkyTexture(scene: Phaser.Scene, width: number, height: number): void {
    if (scene.textures.exists('sky-bg')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x5c94fc);
    g.fillRect(0, 0, width, height);
    g.generateTexture('sky-bg', width, height);
    g.destroy();
  }

  static createUndergroundTexture(scene: Phaser.Scene, width: number, height: number): void {
    if (scene.textures.exists('underground-bg')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x000000);
    g.fillRect(0, 0, width, height);
    g.generateTexture('underground-bg', width, height);
    g.destroy();
  }

  static createCloudTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('cloud')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff);
    g.fillCircle(16, 28, 14);
    g.fillCircle(30, 28, 10);
    g.fillCircle(48, 28, 14);
    g.fillRect(6, 22, 52, 14);
    g.generateTexture('cloud', 64, 40);
    g.destroy();
  }

  static createBushTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('bush')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x00aa00);
    g.fillCircle(16, 26, 14);
    g.fillCircle(28, 26, 10);
    g.fillCircle(8, 26, 10);
    g.fillRect(2, 22, 52, 14);
    g.fillStyle(0x00cc00);
    g.fillCircle(14, 22, 8);
    g.fillCircle(26, 20, 6);
    g.generateTexture('bush', 56, 36);
    g.destroy();
  }

  static createHillTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('hill')) return;
    const g = scene.add.graphics();
    g.fillStyle(0x5a8a00);
    g.fillCircle(48, 80, 48);
    g.fillRect(0, 72, 96, 24);
    g.fillStyle(0x3d6200);
    g.fillRect(0, 80, 96, 16);
    g.generateTexture('hill', 96, 96);
    g.destroy();
  }

  static createPlatformTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('platform')) return;
    const g = scene.add.graphics();
    g.fillStyle(0xc84b0c);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(0x8b3a10);
    g.fillRect(0, 0, 32, 3);
    g.fillRect(0, 0, 3, 16);
    g.fillStyle(0xe05a1a);
    g.fillRect(3, 3, 28, 10);
    g.generateTexture('platform', 32, 16);
    g.destroy();
  }

  static createAllTextures(scene: Phaser.Scene): void {
    TextureFactory.createGroundTexture(scene);
    TextureFactory.createBrickTexture(scene);
    TextureFactory.createQuestionTexture(scene);
    TextureFactory.createUsedBlockTexture(scene);
    TextureFactory.createPipeTLTexture(scene);
    TextureFactory.createPipeTRTexture(scene);
    TextureFactory.createPipeBLTexture(scene);
    TextureFactory.createPipeBRTexture(scene);
    TextureFactory.createFlagPoleTexture(scene);
    TextureFactory.createFlagTexture(scene);
    TextureFactory.createMarioTextures(scene);
    TextureFactory.createGoombaTextures(scene);
    TextureFactory.createKoopaTextures(scene);
    TextureFactory.createCoinTexture(scene);
    TextureFactory.createMushroomTexture(scene);
    TextureFactory.createFireFlowerTexture(scene);
    TextureFactory.createFireballTexture(scene);
    TextureFactory.createStarTexture(scene);
    TextureFactory.createSkyTexture(scene, 800, 480);
    TextureFactory.createUndergroundTexture(scene, 800, 480);
    TextureFactory.createCloudTexture(scene);
    TextureFactory.createBushTexture(scene);
    TextureFactory.createHillTexture(scene);
    TextureFactory.createPlatformTexture(scene);
  }
}
