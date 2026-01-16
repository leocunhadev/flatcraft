import { BIOMES } from './config';

export function getBiomeIndex(elevation: number, temperature: number): number {
    // Elevation is now in range [-10, 10]
    // Water Line is 6.0 (defines 50% mark)

    // WATER (h <= 6)
    if (elevation <= 6.0) {
        if (elevation <= 2.5) return BIOMES.deepOcean; // Increased depth visibility
        return BIOMES.ocean;
    }

    // LAND (h > 6)

    // 1. RULE: Sand only at water borders (Narrow band)
    if (elevation < 6.2) {
        return temperature < 0.2 ? BIOMES.tundra : BIOMES.beach;
    }

    // 2. RULE: Snow appears at great heights
    // And snow blocks don't appear near desert (Temperature handles this: Low T vs High T)
    if (elevation > 8.5) {
        if (temperature < 0.5) return BIOMES.snowyMountain;
        return BIOMES.mountain;
    }

    // Standard Terrain (6.2 to 8.5)
    // COLD
    if (temperature < 0.25) return BIOMES.snow;
    // COOL
    if (temperature < 0.45) return BIOMES.tundra;
    // TEMPERATE
    if (temperature < 0.65) {
        return BIOMES.forest;
    }
    // WARM
    if (temperature < 0.8) return BIOMES.savanna;

    // HOT (Desert clusters)
    // Rule: Deserts clump together (Managed by Noise Frequency in generation.ts)
    return BIOMES.desert;
}
