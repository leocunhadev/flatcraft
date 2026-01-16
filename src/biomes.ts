import { BIOMES } from './config';

export function getBiomeIndex(elevation: number, temperature: number, moisture: number): number {
    // Elevation range: [-10, 10]
    // Temperature range: [0, 1]
    // Moisture range: [0, 1]

    // WATER (h <= 6)
    if (elevation <= 6.0) {
        if (elevation <= 2.5) return BIOMES.deepOcean;
        return BIOMES.ocean;
    }

    // HIGH ALTITUDE (h > 8.5)
    if (elevation > 8.5) {
        if (temperature < 0.4) return BIOMES.snowyMountain;
        return BIOMES.mountain;
    }

    // COASTAL / BEACH (6.0 < h < 6.2)
    if (elevation < 6.2) {
        if (temperature < 0.2) return BIOMES.tundra;
        if (temperature > 0.8 && moisture < 0.3) return BIOMES.desert;
        return BIOMES.beach;
    }

    // LAND BIOMES (6.2 <= h <= 8.5)
    // Cold
    if (temperature < 0.3) {
        if (moisture < 0.5) return BIOMES.tundra;
        return BIOMES.snow;
    }

    // Warm
    if (temperature < 0.6) {
        if (moisture < 0.6) return BIOMES.grass;
        if (moisture < 0.3) return BIOMES.forest;
        return BIOMES.jungle;
    }

    // Hot
    if (temperature < 0.8) {
        if (moisture < 0.2) return BIOMES.desert;
        if (moisture < 0.5) return BIOMES.savanna;
        return BIOMES.forest;
    }

    // Very Hot
    if (moisture < 0.2) return BIOMES.badlands;
    if (moisture < 0.4) return BIOMES.desert;
    return BIOMES.savanna;
}
