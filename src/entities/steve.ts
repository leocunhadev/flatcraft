import steveUrl from '../imagens/steve.jpeg';
import armUrl from '../imagens/arm.png';
import { renderCharacter, renderArm } from '../rendering/renderer';

export class Steve {
    public worldX: number;
    public worldY: number;
    public image: HTMLImageElement;
    public armImage: HTMLImageElement;
    public mouseAngle: number = 0;

    public loaded: boolean;
    public armLoaded: boolean;
    private nextMoveTime: number = 0;
    private startMoveTime: number = 0;
    private moveDuration: number = 0;
    private isClimbing: boolean = false;
    private isDescending: boolean = false;

    constructor(initialX: number, initialY: number, onLoad: () => void) {
        this.worldX = initialX;
        this.worldY = initialY;
        this.loaded = false;
        this.armLoaded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
            if (this.armLoaded) onLoad();
        };
        this.image.src = steveUrl;

        this.armImage = new Image();
        this.armImage.onload = () => {
            this.armLoaded = true;
            if (this.loaded) onLoad();
        };
        this.armImage.src = armUrl;
    }

    public lastDx: number = 0;
    public lastDy: number = 0;

    public isReadyToMove(): boolean {
        return Date.now() >= this.nextMoveTime;
    }

    public move(dx: number, dy: number, duration: number, isClimb: boolean = false, isDescend: boolean = false) {
        const now = Date.now();
        let remaining = 0;

        // If interrupting an ongoing move, carry over the penalty
        if (now < this.nextMoveTime) {
            remaining = this.nextMoveTime - now;
        }

        this.worldX += dx;
        this.worldY += dy;
        this.lastDx = dx;
        this.lastDy = dy;

        this.startMoveTime = now;
        this.moveDuration = duration;
        // The next move is delayed by the duration PLUS any remaining time from the previous block
        this.nextMoveTime = now + duration + remaining;
        this.isClimbing = isClimb;
        this.isDescending = isDescend;
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
        if (!this.loaded || !this.armLoaded) return;

        let scale = 1.0;
        if (Date.now() < this.nextMoveTime) {
            const elapsed = Date.now() - this.startMoveTime;
            const progress = Math.min(elapsed / this.moveDuration, 1);
            const bounce = Math.sin(progress * Math.PI);

            if (this.isClimbing) {
                // "Breath" animation: increases and then decreases
                scale = 1.0 + (bounce * 0.4); // Increases by up to 40%
            } else if (this.isDescending) {
                // "Descent" animation: shrinks and then returns to normal
                scale = 1.0 - (bounce * 0.25); // Decreases by up to 25%
            }
        }

        renderCharacter(ctx, this.image, screenX, screenY, scale);
        renderArm(ctx, this.armImage, screenX, screenY, this.mouseAngle, scale);
    }
}
