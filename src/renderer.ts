import type { TerrainData } from './generation';
import { getBiomeIndex } from './biomes';
import { TILE_SIZE, SPRITES_PER_ROW } from './config';

export function renderMap(
    ctx: CanvasRenderingContext2D,
    terrainImage: HTMLImageElement,
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

            const biomeIndex = getBiomeIndex(h, t);

            const col = biomeIndex % SPRITES_PER_ROW;
            const row = Math.floor(biomeIndex / SPRITES_PER_ROW);

            const srcX = col * TILE_SIZE;
            const srcY = row * TILE_SIZE;
            const destX = x * TILE_SIZE;
            const destY = y * TILE_SIZE;

            ctx.drawImage(
                terrainImage,
                srcX, srcY, TILE_SIZE, TILE_SIZE,
                destX, destY, TILE_SIZE, TILE_SIZE
            );
        }
    }
}
