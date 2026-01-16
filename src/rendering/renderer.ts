import type { TerrainData } from '../core/generation';
import { getBiomeIndex } from '../core/biomes';
import { TILE_SIZE } from '../config';

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
    y: number,
    scale: number = 1.0
) {
    const size = TILE_SIZE * scale;
    const offset = (size - TILE_SIZE) / 2;

    const destX = x * TILE_SIZE - offset;
    const destY = y * TILE_SIZE - offset;

    ctx.drawImage(
        characterImage,
        destX, destY, size, size
    );
}

export function renderArm(
    ctx: CanvasRenderingContext2D,
    armImage: HTMLImageElement,
    x: number,
    y: number,
    angle: number,
    scale: number = 1.0
) {
    const size = TILE_SIZE * scale;
    // Center point of the Steve tile
    const centerX = x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + Math.PI / 2); // Add 90° rotation to orient the arm correctly

    // Draw the arm extending 48px from Steve's center with offset
    const armOffset = 30; // Distance from Steve's center
    const armLength = 48;
    const armThickness = size * 0.3;

    ctx.drawImage(
        armImage,
        armOffset, -armThickness / 2, armLength, armThickness
    );
    ctx.restore();
}
