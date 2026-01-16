import steveUrl from './imagens/steve.jpeg';
import { renderCharacter } from './renderer';

export class Steve {
    public worldX: number;
    public worldY: number;
    public image: HTMLImageElement;


    public loaded: boolean;
    private nextMoveTime: number = 0;
    private startMoveTime: number = 0;
    private moveDuration: number = 0;
    private isClimbing: boolean = false;

    constructor(initialX: number, initialY: number, onLoad: () => void) {
        this.worldX = initialX;
        this.worldY = initialY;
        this.loaded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
            onLoad();
        };
        this.image.src = steveUrl;
    }

    public isReadyToMove(): boolean {
        return Date.now() >= this.nextMoveTime;
    }

    public move(dx: number, dy: number, duration: number, isClimb: boolean = false) {
        this.worldX += dx;
        this.worldY += dy;
        this.startMoveTime = Date.now();
        this.moveDuration = duration;
        this.nextMoveTime = this.startMoveTime + duration;
        this.isClimbing = isClimb;
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
        if (!this.loaded) return;

        let scale = 1.0;
        if (this.isClimbing && Date.now() < this.nextMoveTime) {
            const elapsed = Date.now() - this.startMoveTime;
            const progress = elapsed / this.moveDuration;

            // "Breath" animation: increases and then decreases
            // sin(0 to PI) goes from 0 to 1 back to 0
            const bounce = Math.sin(progress * Math.PI);
            scale = 1.0 + (bounce * 0.4); // Increases by up to 40%
        }

        renderCharacter(ctx, this.image, screenX, screenY, scale);
    }
}
