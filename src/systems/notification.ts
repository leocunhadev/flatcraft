export class NotificationManager {
  private notifications: { message: string; color: string; a: number; lifetime: number }[] = [];
  private static readonly NOTIFICATION_LIFETIME = 180; // 3 seconds at 60fps
  private static readonly FADE_DURATION = 60; // 1 second at 60fps

  add(message: string, color: string = '#38bdf8') {
    this.notifications.push({ message, color, a: 1.0, lifetime: NotificationManager.NOTIFICATION_LIFETIME });
  }

  update() {
    if (this.notifications.length === 0) return;

    const first = this.notifications[0];
    first.lifetime--;

    if (first.lifetime <= NotificationManager.FADE_DURATION) {
      first.a = Math.max(0, first.lifetime / NotificationManager.FADE_DURATION);
    }

    if (first.lifetime <= 0) {
      this.notifications.shift();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.notifications.length === 0) return;

    const n = this.notifications[0];
    const canvas = ctx.canvas;
    ctx.save();
    ctx.font = '24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${this.hexToRgb(n.color)}, ${n.a})`;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillText(n.message, canvas.width / 2, 40);
    ctx.restore();
  }

  private hexToRgb(hex: string): string {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length == 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length == 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `${r},${g},${b}`;
  }
}
