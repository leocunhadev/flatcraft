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

export function renderShadows(
    ctx: CanvasRenderingContext2D,
    tilesX: number,
    tilesY: number,
    gameTime: number
) {
    const width = tilesX * TILE_SIZE;
    const height = tilesY * TILE_SIZE;

    // 24h Cycle transformed into 360 degrees
    // We add an offset so that at 12:00 (midday) it aligns with the user's desired diagonal path
    const angle = (gameTime / 24) * Math.PI * 2 + (Math.PI / 4);

    // Intensity: Smoothly varies, peak at midday (12h), lowest at midnight (0h)
    // We use a small minimum (0.05) to prevent the "jump" when shadows are removed
    const dayFactor = Math.cos(((gameTime - 12) / 12) * Math.PI); // 1.0 at noon, -1.0 at midnight
    const intensity = 0.05 + ((dayFactor + 1) / 2) * 0.25;

    // Sun Vector
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);

    // Center point for the gradient pivot
    const cx = width / 2;
    const cy = height / 2;

    // Project gradient across the whole canvas.
    // By using a large constant distance, the gradient line never collapses to zero length.
    const dist = Math.max(width, height);

    const grad = ctx.createLinearGradient(
        cx + vx * dist, cy + vy * dist, // Shadow side
        cx - vx * dist, cy - vy * dist  // Light side
    );

    grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
}
