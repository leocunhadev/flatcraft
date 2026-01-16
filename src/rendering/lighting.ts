import { TILE_SIZE } from '../config';

export interface LightingStep {
    hour: number;
    r: number;
    g: number;
    b: number;
    a: number;
}

export const LIGHTING_TIMELINE: LightingStep[] = [
    { hour: 0, r: 10, g: 15, b: 45, a: 0.9 },  // Midnight
    { hour: 1, r: 10, g: 15, b: 45, a: 0.95 },
    { hour: 2, r: 10, g: 15, b: 45, a: 0.9 },
    { hour: 3, r: 10, g: 15, b: 45, a: 0.8 },
    { hour: 4, r: 10, g: 15, b: 45, a: 0.7 },
    { hour: 5, r: 30, g: 20, b: 60, a: 0.6 },  // Dawn
    { hour: 6, r: 255, g: 140, b: 50, a: 0.2 }, // Sunrise (Golden Hour)
    { hour: 7, r: 255, g: 140, b: 50, a: 0.1 },
    { hour: 8, r: 255, g: 255, b: 255, a: 0.0 },  // Morning
    { hour: 9, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 10, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 11, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 12, r: 255, g: 255, b: 255, a: 0.0 },  // Noon
    { hour: 13, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 14, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 15, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 16, r: 255, g: 255, b: 255, a: 0.0 },
    { hour: 17, r: 255, g: 80, b: 20, a: 0.2 },  // Sunset (Golden Hour)
    { hour: 18, r: 255, g: 80, b: 20, a: 0.25 },
    { hour: 19, r: 40, g: 20, b: 80, a: 0.6 },  // Dusk
    { hour: 20, r: 40, g: 20, b: 80, a: 0.65 },
    { hour: 21, r: 40, g: 20, b: 80, a: 0.7 },
    { hour: 22, r: 40, g: 20, b: 80, a: 0.75 },
    { hour: 23, r: 10, g: 15, b: 45, a: 0.8 },
    { hour: 24, r: 10, g: 15, b: 45, a: 0.9 }   // Midnight cycle
];

/**
 * Calculates the atmospheric light color for a given time
 */
export function getAtmosphericLight(time: number) {
    const t = time % 24;

    let nextIdx = LIGHTING_TIMELINE.findIndex(step => step.hour > t);
    if (nextIdx === -1) nextIdx = 0;

    let prevIdx = nextIdx - 1;
    if (prevIdx < 0) prevIdx = LIGHTING_TIMELINE.length - 1;

    const prev = LIGHTING_TIMELINE[prevIdx];
    let next = LIGHTING_TIMELINE[nextIdx];

    let prevHour = prev.hour;
    let nextHour = next.hour;

    if (nextHour < prevHour) nextHour += 24;

    let factor = (t < prevHour ? t + 24 - prevHour : t - prevHour) / (nextHour - prevHour);

    return {
        r: Math.round(prev.r + (next.r - prev.r) * factor),
        g: Math.round(prev.g + (next.g - prev.g) * factor),
        b: Math.round(prev.b + (next.b - prev.b) * factor),
        a: prev.a + (next.a - prev.a) * factor
    };
}

/**
 * Renders a global shadow gradient across the canvas based on gametime
 */
export function renderShadows(
    ctx: CanvasRenderingContext2D,
    tilesX: number,
    tilesY: number,
    gameTime: number
) {
    const width = tilesX * TILE_SIZE;
    const height = tilesY * TILE_SIZE;

    // 24h Cycle transformed into 360 degrees
    const angle = (gameTime / 24) * Math.PI * 2 + (Math.PI / 4);

    // Intensity peaks at noon
    const dayFactor = Math.cos(((gameTime - 12) / 12) * Math.PI);
    const intensity = 0.05 + ((dayFactor + 1) / 2) * 0.25;

    const vx = Math.cos(angle);
    const vy = Math.sin(angle);

    const cx = width / 2;
    const cy = height / 2;
    const dist = Math.max(width, height);

    const grad = ctx.createLinearGradient(
        cx + vx * dist, cy + vy * dist,
        cx - vx * dist, cy - vy * dist
    );

    grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
}
