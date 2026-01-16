export const TILE_SIZE = 48; // Native texture size

// Biome Indices (Order defined by left-to-right image position)
export const BIOMES = {
    deepOcean: 0,
    ocean: 1,
    beach: 2,

    snow: 3,
    tundra: 4,

    grass: 5,
    forest: 6,
    jungle: 7,

    savanna: 8,
    desert: 9,
    badlands: 10,

    mountain: 11,
    snowyMountain: 12
};

export const BIOME_MOVEMENT_SPEEDS = {
    [BIOMES.deepOcean]: 0.15,
    [BIOMES.ocean]: 0.3,

    [BIOMES.tundra]: 0.45,
    [BIOMES.snow]: 0.45,
    [BIOMES.snowyMountain]: 0.45,

    [BIOMES.beach]: 0.5,
    [BIOMES.desert]: 0.5,
    [BIOMES.badlands]: 0.5,

    [BIOMES.grass]: 1.0,
    [BIOMES.forest]: 1.0,
    [BIOMES.jungle]: 1.0,
    [BIOMES.savanna]: 1.0,
    [BIOMES.mountain]: 0.8,
};

export const BIOME_FILENAMES = {
    [BIOMES.deepOcean]: 'deepOcean.png',
    [BIOMES.ocean]: 'ocean.png',
    [BIOMES.beach]: 'sand.png',
    [BIOMES.snow]: 'snow.png',
    [BIOMES.tundra]: 'tundra.png',
    [BIOMES.grass]: 'grass.png',
    [BIOMES.forest]: 'forest.png',
    [BIOMES.jungle]: 'jungle.png',
    [BIOMES.savanna]: 'savanna.png',
    [BIOMES.desert]: 'desert.png',
    [BIOMES.badlands]: 'badlands.png',
    [BIOMES.mountain]: 'mountain.png',
    [BIOMES.snowyMountain]: 'snowyMountain.png'
};

export const CLIMB_DURATION = 800; // ms to climb up
export const CLIMBABLE_BIOMES = [BIOMES.mountain, BIOMES.snowyMountain, BIOMES.badlands, BIOMES.tundra];
export const WATER_BIOMES = [BIOMES.ocean, BIOMES.deepOcean];
