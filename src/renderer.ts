import type { TerrainData } from './generation';
import { getBiomeIndex } from './biomes';
import { TILE_SIZE } from './config';

export function renderMap(
    ctx: CanvasRenderingContext2D,
    biomeTextures: Record<number, HTMLImageElement>,
    data: TerrainData
) {
    const { heightMap, tempMap, tilesX, tilesY } = data;

    // Resize canvas via CSS logic implied by main (main handles logical resize, this renders)
    // Actually main handles logical resize? No, we should probably do it here or assume context is ready.
    // The context needs to be sized correctly.

    // Actually, we should clear here just to be safe, but main logic handles size.
    // Let's assume the canvas buffer is already resized by the caller if needed.

    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const index = y * tilesX + x;
            const h = heightMap[index];
            const t = tempMap[index];
            const m = data.moistureMap[index];

            const biomeIndex = getBiomeIndex(h, t, m);
            const img = biomeTextures[biomeIndex];

            if (img) {
                const destX = x * TILE_SIZE;
                const destY = y * TILE_SIZE;

                ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,
                    destX, destY, TILE_SIZE, TILE_SIZE
                );
            }
        }
    }
}

export function renderCharacter(
    ctx: CanvasRenderingContext2D,
    characterImage: HTMLImageElement,
    x: number,
    y: number
) {
    const destX = x * TILE_SIZE;
    const destY = y * TILE_SIZE;

    ctx.drawImage(
        characterImage,
        destX, destY, TILE_SIZE, TILE_SIZE
    );
}
