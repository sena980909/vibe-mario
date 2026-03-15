import type { PlayerContext } from '../states/PlayerState';

export type CheatCommand =
  | { type: 'setGravity'; value: number }
  | { type: 'spawnEnemy'; x: number; y: number }
  | { type: 'nextStage' }
  | { type: 'powerUp'; level: number };

export class DebugOverlay {
  private enabled = false;
  private fpsHistory: number[] = [];
  private logs: string[] = [];
  private cheatBuffer = '';
  private cheatActive = false;
  private cheatDisplay = '';

  toggle(): void {
    this.enabled = !this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  addLog(msg: string): void {
    this.logs.unshift(msg);
    if (this.logs.length > 5) this.logs.pop();
  }

  updateFPS(dt: number): void {
    if (dt <= 0) return;
    const fps = Math.round(1 / dt);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    player: PlayerContext | null,
    entityCount: number,
    fps: number
  ): void {
    if (!this.enabled) return;

    const panelW = 220;
    const panelX = canvasW - panelW - 8;
    const panelY = 8;

    // Stats lines
    const lines: string[] = [
      `FPS: ${fps} (avg ${this.getAverageFPS()})`,
      `Entities: ${entityCount}`,
    ];

    if (player) {
      lines.push(`X: ${Math.round(player.x)}  Y: ${Math.round(player.y)}`);
      lines.push(`VX: ${Math.round(player.vx)}  VY: ${Math.round(player.vy)}`);
      lines.push(`Power: ${player.powerLevel}  Ground: ${player.onGround}`);
    }

    const lineH = 16;
    const padding = 8;
    const panelH = lines.length * lineH + padding * 2;

    // Panel background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? '#00ff88' : '#ccffcc';
      ctx.fillText(line, panelX + padding, panelY + padding + i * lineH);
    });

    // Draw player hitbox outline and velocity arrow
    if (player) {
      // Hitbox
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(player.x, player.y, player.width, player.height);

      // Velocity arrow from player center
      const cx = player.x + player.width / 2;
      const cy = player.y + player.height / 2;
      const scale = 0.1;
      const ex = cx + player.vx * scale;
      const ey = cy + player.vy * scale;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(ey - cy, ex - cx);
      const arrowLen = 6;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - arrowLen * Math.cos(angle - Math.PI / 6),
        ey - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - arrowLen * Math.cos(angle + Math.PI / 6),
        ey - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }

    // Logs panel in bottom-right
    if (this.logs.length > 0) {
      const logPanelW = 260;
      const logPanelH = this.logs.length * lineH + padding * 2;
      const logX = canvasW - logPanelW - 8;
      const logY = canvasH - logPanelH - 8;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(logX, logY, logPanelW, logPanelH);
      ctx.strokeStyle = '#888800';
      ctx.lineWidth = 1;
      ctx.strokeRect(logX, logY, logPanelW, logPanelH);

      this.logs.forEach((log, i) => {
        const alpha = 1 - i * 0.18;
        ctx.fillStyle = `rgba(255, 220, 80, ${alpha})`;
        ctx.fillText(log, logX + padding, logY + padding + i * lineH);
      });
    }

    // Cheat console display
    if (this.cheatActive) {
      const consoleY = canvasH - 30;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(8, consoleY, canvasW - 16, 24);
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, consoleY, canvasW - 16, 24);
      ctx.fillStyle = '#00aaff';
      ctx.textAlign = 'left';
      ctx.fillText(`> ${this.cheatDisplay}_`, 16, consoleY + 6);
    }

    ctx.restore();
  }

  handleCheatInput(key: string): CheatCommand | null {
    // Toggle cheat console with backtick - handled externally
    if (key === 'Enter' && this.cheatActive) {
      const cmd = this.parseCheat(this.cheatBuffer.trim().toLowerCase());
      this.cheatBuffer = '';
      this.cheatDisplay = '';
      this.cheatActive = false;
      return cmd;
    }

    if (key === 'Escape' && this.cheatActive) {
      this.cheatBuffer = '';
      this.cheatDisplay = '';
      this.cheatActive = false;
      return null;
    }

    if (key === 'Backspace' && this.cheatActive) {
      this.cheatBuffer = this.cheatBuffer.slice(0, -1);
      this.cheatDisplay = this.cheatBuffer;
      return null;
    }

    if (this.cheatActive && key.length === 1) {
      this.cheatBuffer += key;
      this.cheatDisplay = this.cheatBuffer;
    }

    return null;
  }

  activateCheatConsole(): void {
    this.cheatActive = !this.cheatActive;
    if (!this.cheatActive) {
      this.cheatBuffer = '';
      this.cheatDisplay = '';
    }
  }

  isCheatConsoleActive(): boolean {
    return this.cheatActive;
  }

  private parseCheat(input: string): CheatCommand | null {
    if (input === 'nextstage' || input === 'next') {
      return { type: 'nextStage' };
    }
    const gravMatch = input.match(/^gravity\s+(-?[\d.]+)$/);
    if (gravMatch) {
      return { type: 'setGravity', value: parseFloat(gravMatch[1]) };
    }
    const powerMatch = input.match(/^power\s+(\d)$/);
    if (powerMatch) {
      return { type: 'powerUp', level: parseInt(powerMatch[1]) };
    }
    const spawnMatch = input.match(/^spawn\s+(\d+)\s+(\d+)$/);
    if (spawnMatch) {
      return { type: 'spawnEnemy', x: parseInt(spawnMatch[1]), y: parseInt(spawnMatch[2]) };
    }
    return null;
  }
}
