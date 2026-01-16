import { renderCharacter, renderArm } from '../rendering/renderer';

export class Player {
    public worldX: number;
    public worldY: number;
    public image: HTMLImageElement;
    public armImage: HTMLImageElement;
    public mouseAngle: number = 0;

    public loaded: boolean;
    public armLoaded: boolean;

    constructor(initialX: number, initialY: number, imageUrl: string, armImageUrl: string, onLoad: () => void) {
        this.worldX = initialX;
        this.worldY = initialY;
        this.loaded = false;
        this.armLoaded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
            if (this.armLoaded) onLoad();
        };
        this.image.src = imageUrl;

        this.armImage = new Image();
        this.armImage.onload = () => {
            this.armLoaded = true;
            if (this.loaded) onLoad();
        };
        this.armImage.src = armImageUrl;
    }

    public render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, scale: number = 1.0, tint?: string) {
        if (!this.loaded || !this.armLoaded) return;

        renderCharacter(ctx, this.image, screenX, screenY, scale, tint);
        renderArm(ctx, this.armImage, screenX, screenY, this.mouseAngle, scale, tint);
    }
}
