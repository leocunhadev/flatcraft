import steveUrl from './imagens/steve.jpeg';
import { renderCharacter } from './renderer';

export class Steve {
    public worldX: number;
    public worldY: number;
    public image: HTMLImageElement;
    public loaded: boolean;

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

    public move(dx: number, dy: number) {
        this.worldX += dx;
        this.worldY += dy;
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
        if (!this.loaded) return;
        renderCharacter(ctx, this.image, screenX, screenY);
    }
}
