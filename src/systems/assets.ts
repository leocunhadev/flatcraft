import { BIOME_FILENAMES } from '../config/config';

export class AssetLoader {
    public biomeTextures: Record<number, HTMLImageElement> = {};
    public isLoaded: boolean = false;
    private totalPending: number = 0;
    private onAllLoadedCallback: (() => void) | null = null;

    constructor(onAllLoaded?: () => void) {
        if (onAllLoaded) this.onAllLoadedCallback = onAllLoaded;
        this.loadBiomes();
    }

    private loadBiomes() {
        const images = import.meta.glob('../imagens/*.{png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

        const entries = Object.entries(BIOME_FILENAMES);
        this.totalPending = entries.length;

        if (this.totalPending === 0) {
            this.checkCompletion();
            return;
        }

        entries.forEach(([idStr, filename]) => {
            const id = parseInt(idStr);
            const key = `../imagens/${filename}`;
            // @ts-ignore
            const src = images[key];

            if (src) {
                const img = new Image();
                img.onload = () => this.onImageLoad();
                img.onerror = () => {
                    console.error(`Failed to load asset: ${filename}`);
                    this.onImageLoad(); // Still count to avoid blocking
                };
                img.src = src;
                this.biomeTextures[id] = img;
            } else {
                console.warn(`Asset source missing for biome ${id}: ${filename}`);
                this.onImageLoad();
            }
        });
    }

    private onImageLoad() {
        this.totalPending--;
        this.checkCompletion();
    }

    private checkCompletion() {
        if (this.totalPending <= 0) {
            this.isLoaded = true;
            if (this.onAllLoadedCallback) this.onAllLoadedCallback();
        }
    }
}
