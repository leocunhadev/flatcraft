import steveUrl from './imagens/steve.jpeg';
import { renderCharacter } from './renderer';

export class Steve {
    public worldX: number;
    public worldY: number;
    public image: HTMLImageElement;


    public loaded: boolean;
    private nextMoveTime: number = 0;

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

    public move(dx: number, dy: number, duration: number) {
        this.worldX += dx;
        this.worldY += dy;
        this.nextMoveTime = Date.now() + duration;
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
        if (!this.loaded) return;
        renderCharacter(ctx, this.image, screenX, screenY);
    }
}
