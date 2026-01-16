import steveUrl from '../imagens/steve.jpeg';
import armUrl from '../imagens/arm.png';
import { Player } from './player';

export class Steve {
    private player: Player;
    private nextMoveTime: number = 0;
    private startMoveTime: number = 0;
    private moveDuration: number = 0;
    private isClimbing: boolean = false;
    public isDescending: boolean = false;
    public isInWater: boolean = false;
    public isIdleInWater: boolean = false;
    private sinkingScale: number = 1.0;

    constructor(initialX: number, initialY: number, onLoad: () => void) {
        this.player = new Player(initialX, initialY, steveUrl, armUrl, onLoad);
    }

    public get worldX(): number { return this.player.worldX; }
    public set worldX(value: number) { this.player.worldX = value; }

    public get worldY(): number { return this.player.worldY; }
    public set worldY(value: number) { this.player.worldY = value; }

    public get mouseAngle(): number { return this.player.mouseAngle; }
    public set mouseAngle(value: number) { this.player.mouseAngle = value; }

    public get loaded(): boolean { return this.player.loaded; }

    public lastDx: number = 0;
    public lastDy: number = 0;

    public isReadyToMove(): boolean {
        return Date.now() >= this.nextMoveTime;
    }

    public move(dx: number, dy: number, duration: number, isClimb: boolean = false, isDescend: boolean = false) {
        const now = Date.now();
        let remaining = 0;

        if (now < this.nextMoveTime) {
            remaining = this.nextMoveTime - now;
        }

        this.player.worldX += dx;
        this.player.worldY += dy;
        this.lastDx = dx;
        this.lastDy = dy;

        this.startMoveTime = now;
        this.moveDuration = duration;
        this.nextMoveTime = now + duration + remaining;
        this.isClimbing = isClimb;
        this.isDescending = isDescend;
    }

    public update() {
        if (this.isInWater && this.isIdleInWater) {
            this.sinkingScale = Math.max(0.6, this.sinkingScale - 0.005);
        } else {
            this.sinkingScale = Math.min(1.0, this.sinkingScale + 0.02);
        }
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
        if (!this.player.loaded) return;

        let scale = 1.0;
        if (Date.now() < this.nextMoveTime) {
            const elapsed = Date.now() - this.startMoveTime;
            const progress = Math.min(elapsed / this.moveDuration, 1);
            const bounce = Math.sin(progress * Math.PI);

            if (this.isClimbing) {
                scale = 1.0 + (bounce * 0.4);
            } else if (this.isDescending) {
                scale = 1.0 - (bounce * 0.25);
            }
        }

        scale *= this.sinkingScale;

        const tint = this.isInWater ? 'rgba(0, 100, 255, 0.35)' : undefined;

        this.player.render(ctx, screenX, screenY, scale, tint);
    }
}
