import bubbleUrl from '../imagens/bubble_pixel.png';
import foodUrl from '../imagens/food_pixel.png';

const HUD_ICON_SIZE = 18;

// Fallback Heart pattern if image failed to generate
const HEART_PATTERN = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0]
];

const bubbleImg = new Image();
bubbleImg.src = bubbleUrl;

const foodImg = new Image();
foodImg.src = foodUrl;

function drawPixelIcon(ctx: CanvasRenderingContext2D, x: number, y: number, pattern: number[][], color: string, size: number) {
    const pixelSize = size / 8;
    ctx.fillStyle = color;
    pattern.forEach((row, ry) => {
        row.forEach((pixel, rx) => {
            if (pixel === 1) {
                ctx.fillRect(x + rx * pixelSize, y + ry * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
            }
        });
    });
}

function drawImgIcon(ctx: CanvasRenderingContext2D, x: number, y: number, img: HTMLImageElement, size: number) {
    if (img.complete && img.naturalWidth !== 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, size, size);
    } else {
        // Fallback to pattern if image is not loaded
    }
}

export function renderHUD(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    // We want HUD to have a fixed "visual" size regardless of canvas internal scale
    // BUT since we are drawing on the main canvas which is scaled, we need to respect that.
    // Actually, main.ts clears and does drawImage(terrainCanvas).
    // The canvas width/height are the render resolution.

    // Position HUD at the bottom right
    const margin = 20;
    const hudWidth = 230; // Slightly wider for better breathing room
    const hudHeight = 90;

    // We'll place it relative to the logical canvas size
    const x = canvasWidth - hudWidth - margin;
    const y = canvasHeight - hudHeight - margin;

    // Background Rectangle - Minecraft styled
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Slightly darker for better contrast
    ctx.strokeStyle = '#373737';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x, y, hudWidth, hudHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Centering calculations
    const iconSpacing = 20;
    const totalIconsWidth = (9 * iconSpacing) + HUD_ICON_SIZE;
    const startIconX = x + (hudWidth - totalIconsWidth) / 2;

    // Vertical centering
    const rowSpacing = 26;
    const totalIconsHeight = (2 * rowSpacing) + HUD_ICON_SIZE;
    const startIconY = y + (hudHeight - totalIconsHeight) / 2;

    // 10 Hearts (Pattern fallback)
    for (let i = 0; i < 10; i++) {
        drawPixelIcon(ctx, startIconX + i * iconSpacing, startIconY, HEART_PATTERN, '#FF3B3B', HUD_ICON_SIZE);
    }

    // 10 Food (Image)
    for (let i = 0; i < 10; i++) {
        drawImgIcon(ctx, startIconX + i * iconSpacing, startIconY + rowSpacing, foodImg, HUD_ICON_SIZE);
    }

    // 10 Bubbles (Image)
    for (let i = 0; i < 10; i++) {
        drawImgIcon(ctx, startIconX + i * iconSpacing, startIconY + rowSpacing * 2, bubbleImg, HUD_ICON_SIZE);
    }
}
