import { fbm } from './utils';
import { PerlinNoise } from './perlin';

const WATER_LEVEL = 6.0;

export interface TerrainData {
    heightMap: Float32Array;
    tempMap: Float32Array;
    tilesX: number;
    tilesY: number;
}

export function generateTerrainData(
    tilesX: number,
    tilesY: number,
    userOffset: number,
    useWarp: boolean,
    noiseHeight: PerlinNoise,
    noiseTemp: PerlinNoise
): TerrainData {

    const frequency = 0.1;
    const octaves = 4;
    // Increased Temp frequency for more diverse biomes
    const tempFrequency = frequency * 0.5;

    const heightMap = new Float32Array(tilesX * tilesY);
    const tempMap = new Float32Array(tilesX * tilesY);

    // PASS 1: GENERATION (Noise Calculation)
    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const worldOffsetX = userOffset;
            const worldOffsetY = userOffset;
            const worldTileX = x + worldOffsetX;
            const worldTileY = y + worldOffsetY;

            const unwarpedNx = worldTileX * frequency;
            const unwarpedNy = worldTileY * frequency;

            let nx = unwarpedNx;
            let ny = unwarpedNy;

            // Domain Warp
            if (useWarp) {
                const qx = fbm(nx + 5.2, ny + 1.3, 2, 0.5, 2.0, noiseHeight);
                const qy = fbm(nx + 1.3, ny + 2.8, 2, 0.5, 2.0, noiseHeight);
                nx += 4.0 * qx * 0.5;
                ny += 4.0 * qy * 0.5;
            }

            let rawE = fbm(nx, ny, octaves, 0.5, 2.0, noiseHeight);
            const nE = (rawE + 1) / 2;

            let h = 0;
            // Map 40% of values to "Water" range (-10 to 6)
            // 0..0.4 -> -10..6
            // 0.4..1 -> 6..10
            if (nE < 0.40) {
                h = -10 + (nE / 0.40) * 16;
            } else {
                h = 6 + ((nE - 0.40) / 0.60) * 4;
            }

            // Temperature
            let nTx = (worldTileX * tempFrequency) + 1000;
            let nTy = (worldTileY * tempFrequency) + 1000;
            if (useWarp) {
                const qx = fbm(nTx, nTy, 2, 0.5, 2.0, noiseHeight);
                const qy = fbm(nTx + 10, nTy + 10, 2, 0.5, 2.0, noiseHeight);
                nTx += 2.0 * qx;
                nTy += 2.0 * qy;
            }
            // Use 2 octaves for slightly more detail/diversity while keeping clusters
            let rawT = fbm(nTx, nTy, 2, 0.5, 2.0, noiseTemp);
            const t = (rawT + 1) / 2;

            const index = y * tilesX + x;
            heightMap[index] = h;
            tempMap[index] = t;
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

                    // Scan Left
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (x - d < 0) break;
                        if (heightMap[y * tilesX + (x - d)] <= WATER_LEVEL) {
                            distLeft = d;
                            break;
                        }
                    }
                    // Scan Right
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (x + d >= tilesX) break;
                        if (heightMap[y * tilesX + (x + d)] <= WATER_LEVEL) {
                            distRight = d;
                            break;
                        }
                    }
                    // Scan Up
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (y - d < 0) break;
                        if (heightMap[(y - d) * tilesX + x] <= WATER_LEVEL) {
                            distUp = d;
                            break;
                        }
                    }
                    // Scan Down
                    for (let d = 1; d <= SEARCH_DIST; d++) {
                        if (y + d >= tilesY) break;
                        if (heightMap[(y + d) * tilesX + x] <= WATER_LEVEL) {
                            distDown = d;
                            break;
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

    return { heightMap, tempMap, tilesX, tilesY };
}
