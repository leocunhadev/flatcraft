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

// Persistent buffer for tinting to avoid per-frame allocations
const tintBuffer = document.createElement('canvas');
const tintCtx = tintBuffer.getContext('2d')!;

export function renderCharacter(
    ctx: CanvasRenderingContext2D,
    characterImage: HTMLImageElement,
    x: number,
    y: number,
    scale: number = 1.0,
    tint?: string
) {
    const size = TILE_SIZE * scale;
    const offset = (size - TILE_SIZE) / 2;

    const destX = x * TILE_SIZE - offset;
    const destY = y * TILE_SIZE - offset;

    if (tint) {
        if (tintBuffer.width !== size || tintBuffer.height !== size) {
            tintBuffer.width = size;
            tintBuffer.height = size;
        }
        tintCtx.clearRect(0, 0, size, size);
        tintCtx.drawImage(characterImage, 0, 0, size, size);
        tintCtx.globalCompositeOperation = 'source-atop';
        tintCtx.fillStyle = tint;
        tintCtx.fillRect(0, 0, size, size);
        tintCtx.globalCompositeOperation = 'source-over';

        ctx.drawImage(tintBuffer, destX, destY);
    } else {
        ctx.drawImage(characterImage, destX, destY, size, size);
    }
}

export function renderArm(
    ctx: CanvasRenderingContext2D,
    armImage: HTMLImageElement,
    x: number,
    y: number,
    angle: number,
    scale: number = 1.0,
    tint?: string
) {
    const size = TILE_SIZE * scale;
    const centerX = x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + Math.PI / 2);

    const armOffset = 30;
    const armLength = 48;
    const armThickness = size * 0.3;

    if (tint) {
        if (tintBuffer.width < armLength || tintBuffer.height < armThickness) {
            tintBuffer.width = Math.max(tintBuffer.width, armLength);
            tintBuffer.height = Math.max(tintBuffer.height, armThickness);
        }
        tintCtx.clearRect(0, 0, armLength, armThickness);
        tintCtx.drawImage(armImage, 0, 0, armLength, armThickness);
        tintCtx.globalCompositeOperation = 'source-atop';
        tintCtx.fillStyle = tint;
        tintCtx.fillRect(0, 0, armLength, armThickness);
        tintCtx.globalCompositeOperation = 'source-over';

        ctx.drawImage(tintBuffer, 0, 0, armLength, armThickness, armOffset, -armThickness / 2, armLength, armThickness);
    } else {
        ctx.drawImage(armImage, armOffset, -armThickness / 2, armLength, armThickness);
    }

    ctx.restore();
}
