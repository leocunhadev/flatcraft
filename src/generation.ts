import { fbm } from './utils';
import { PerlinNoise } from './perlin';

const WATER_LEVEL = 6.0;

export interface TerrainData {
    heightMap: Float32Array;
    tempMap: Float32Array;
    moistureMap: Float32Array;
    tilesX: number;
    tilesY: number;
}

export function generateTerrainData(
    tilesX: number,
    tilesY: number,
    offsetX: number,
    offsetY: number,
    useWarp: boolean,
    noiseHeight: PerlinNoise,
    noiseTemp: PerlinNoise,
    noiseMoisture: PerlinNoise
): TerrainData {

    // Lower frequencies for larger geological features
    const frequency = 0.02;
    const octaves = 6; // More octaves for finer detail on large shapes
    const tempFrequency = frequency * 0.4;
    const moistureFrequency = frequency * 0.6;

    const heightMap = new Float32Array(tilesX * tilesY);
    const tempMap = new Float32Array(tilesX * tilesY);
    const moistureMap = new Float32Array(tilesX * tilesY);

    // PASS 1: GENERATION (Noise Calculation)
    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const worldTileX = x + offsetX;
            const worldTileY = y + offsetY;

            // --- HEIGHT ---
            const nx = worldTileX * frequency;
            const ny = worldTileY * frequency;

            let hnx = nx;
            let hny = ny;

            if (useWarp) {
                const qx = fbm(nx + 5.2, ny + 1.3, 2, 0.5, 2.0, noiseHeight);
                const qy = fbm(nx + 1.3, ny + 2.8, 2, 0.5, 2.0, noiseHeight);
                hnx += 4.0 * qx * 0.2;
                hny += 4.0 * qy * 0.2;
            }

            let rawE = fbm(hnx, hny, octaves, 0.5, 2.0, noiseHeight);
            const nE = (rawE + 1) / 2;

            let h = 0;
            // Smoother mapping for elevation
            // We want 50% water roughly.
            if (nE < 0.5) {
                // Map [0, 0.5] to [-10, 6]
                h = -10 + (nE / 0.5) * 16;
            } else {
                // Map [0.5, 1.0] to [6, 10]
                h = 6 + ((nE - 0.5) / 0.5) * 4;
            }

            // --- TEMPERATURE ---
            let nTx = (worldTileX * tempFrequency) + 1000;
            let nTy = (worldTileY * tempFrequency) + 1000;
            if (useWarp) {
                const qx = fbm(nTx, nTy, 2, 0.5, 2.0, noiseHeight);
                const qy = fbm(nTx + 10, nTy + 10, 2, 0.5, 2.0, noiseHeight);
                nTx += 2.0 * qx * 0.1;
                nTy += 2.0 * qy * 0.1;
            }
            let rawT = fbm(nTx, nTy, 3, 0.5, 2.0, noiseTemp);
            const t = (rawT + 1) / 2;

            // --- MOISTURE ---
            let nMx = (worldTileX * moistureFrequency) + 2000;
            let nMy = (worldTileY * moistureFrequency) + 2000;
            if (useWarp) {
                const qx = fbm(nMx, nMy, 2, 0.5, 2.0, noiseHeight);
                const qy = fbm(nMx + 20, nMy + 20, 2, 0.5, 2.0, noiseHeight);
                nMx += 2.0 * qx * 0.1;
                nMy += 2.0 * qy * 0.1;
            }
            let rawM = fbm(nMx, nMy, 3, 0.5, 2.0, noiseMoisture);
            const m = (rawM + 1) / 2;

            const index = y * tilesX + x;
            heightMap[index] = h;
            tempMap[index] = t;
            moistureMap[index] = m;
        }
    }

    // PASS 2: CONNECTED OCEANS (Bridge Erosion)
    if (useWarp) {
        const newHeightMap = new Float32Array(heightMap);
        const SEARCH_DIST = 5;

        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const i = y * tilesX + x;

                // Only modify Land
                if (heightMap[i] > WATER_LEVEL) {

                    let distLeft = 999, distRight = 999;
                    let distUp = 999, distDown = 999;

                    // Scan Left/Right
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (x - d >= 0) {
                            if (heightMap[y * tilesX + (x - d)] <= WATER_LEVEL) { distLeft = d; break; }
                        }
                    }
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (x + d < tilesX) {
                            if (heightMap[y * tilesX + (x + d)] <= WATER_LEVEL) { distRight = d; break; }
                        }
                    }
                    // Scan Up/Down
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (y - d >= 0) {
                            if (heightMap[(y - d) * tilesX + x] <= WATER_LEVEL) { distUp = d; break; }
                        }
                    }
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (y + d < tilesY) {
                            if (heightMap[(y + d) * tilesX + x] <= WATER_LEVEL) { distDown = d; break; }
                        }
                    }

                    if ((distLeft + distRight <= SEARCH_DIST) || (distUp + distDown <= SEARCH_DIST)) {
                        newHeightMap[i] = WATER_LEVEL;
                    }
                }
            }
        }
        heightMap.set(newHeightMap);
    }

    return { heightMap, tempMap, moistureMap, tilesX, tilesY };
}
