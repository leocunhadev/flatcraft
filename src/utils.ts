import { PerlinNoise } from './perlin';

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
