import { PerlinNoise } from './perlin';

// Simple Linear Congruential Generator (LCG) for seeding
export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // Returns a pseudo-random number between 0 and 1
    public next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Fractal Brownian Motion (Octaves)
export function fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number, noiseSource: PerlinNoise): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += noiseSource.noise(x * frequency, y * frequency, 0) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / maxValue;
}
