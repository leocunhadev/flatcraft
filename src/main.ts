import './style.css'
import { PerlinNoise } from './perlin'
// @ts-ignore
import textureUrl from './imagens/texturas_terrenos.png'

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const offsetInput = document.getElementById('offsetInput') as HTMLInputElement;
const warpInput = document.getElementById('warpInput') as HTMLInputElement;

const WIDTH = 256;
const HEIGHT = 256;

// Sync canvas internal resolution
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Initialize Noise Layers
let noiseHeight = new PerlinNoise();
let noiseTemp = new PerlinNoise();

// Texture Management
const terrainImage = new Image();
let terrainData: Uint8ClampedArray | null = null;
let spriteSize = 16;
const spritesPerRow = 5; // Based on the provided 5x3 grid image

terrainImage.onload = () => {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = terrainImage.width;
  offCanvas.height = terrainImage.height;
  const offCtx = offCanvas.getContext('2d')!;
  offCtx.drawImage(terrainImage, 0, 0);
  // Calculate sprite size based on 5 columns
  spriteSize = terrainImage.width / spritesPerRow;
  if (Math.floor(spriteSize) !== spriteSize) {
    console.warn("Sprite size is non-integer, check image dimensions and biome count.");
  }
  terrainData = offCtx.getImageData(0, 0, terrainImage.width, terrainImage.height).data;
  generate();
};
terrainImage.src = textureUrl;

// Ensure we don't try to generate before load, though generate() checks terrainData.

// Biome Indices (Order defined by left-to-right image position)
const BIOMES = {
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

function getBiomeIndex(elevation: number, temperature: number): number {
  // Elevation is now in range [-10, 10]
  // Water Line is 6.0 (defines 50% mark)

  // WATER (h <= 6)
  if (elevation <= 6.0) {
    if (elevation < 1.0) return BIOMES.deepOcean; // Increased range for visibility
    // if (elevation < 4.0) return BIOMES.ocean;      // -5 to 4
    return BIOMES.ocean;
  }

  // LAND (h > 6)

  // Beach/Sand: 6.0 to 6.4
  if (elevation < 6.4) {
    return temperature < 0.2 ? BIOMES.tundra : BIOMES.beach;
  }

  // Mountains: > 9.0
  if (elevation > 9.0) {
    if (temperature < 0.5) return BIOMES.snowyMountain;
    return BIOMES.mountain;
  }

  // Standard Terrain (6.4 to 9.0)
  // COLD
  if (temperature < 0.3) return BIOMES.snow;
  // COOL
  if (temperature < 0.45) return BIOMES.tundra;
  // TEMPERATE
  if (temperature < 0.65) {
    return BIOMES.forest; // Mostly forest
  }
  // WARM
  if (temperature < 0.8) return BIOMES.savanna;
  // HOT
  return BIOMES.desert;
}

// Fractal Brownian Motion (Octaves)
function fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number, noiseSource: PerlinNoise): number {
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

function generate() {
  if (!terrainData) return; // Wait for texture

  const scale = parseFloat(scaleInput.value);
  const userOffset = parseFloat(offsetInput.value);
  const useWarp = warpInput.checked;

  // Elevation settings
  const baseFreq = 0.03;
  const frequency = baseFreq * (scale / 2);
  const octaves = 4;

  // Temperature settings
  const tempFrequency = frequency * 0.5;

  // Prepare Output Data
  const canvasData = ctx.createImageData(WIDTH, HEIGHT);
  const outputData = canvasData.data;

  // Texture dimensions
  const texWidth = terrainImage.width;
  // const texHeight = terrainImage.height;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // 1. Get raw noise 0..1
      let nx = (x + userOffset * 5) * frequency;
      let ny = (y + userOffset * 5) * frequency;

      // DOMAIN WARPING
      if (useWarp) {
        const qx = fbm(nx + 5.2, ny + 1.3, 2, 0.5, 2.0, noiseHeight);
        const qy = fbm(nx + 1.3, ny + 2.8, 2, 0.5, 2.0, noiseHeight);

        // Displace the coordinate
        nx += 4.0 * qx * (scale / 10);
        ny += 4.0 * qy * (scale / 10);
      }

      let rawE = fbm(nx, ny, octaves, 0.5, 2.0, noiseHeight);
      const nE = (rawE + 1) / 2; // 0..1

      // 2. Map 0..1 to -10..10
      let h = 0;
      if (nE < 0.4) {
        h = -10 + (nE / 0.4) * 16;
      } else {
        h = 6 + ((nE - 0.4) / 0.6) * 4;
      }

      // 3. Temperature (Standard 0..1)
      let nTx = (x + userOffset * 5 + 1000) * tempFrequency;
      let nTy = (y + userOffset * 5 + 1000) * tempFrequency;

      if (useWarp) {
        const qx = fbm(nTx, nTy, 2, 0.5, 2.0, noiseHeight);
        const qy = fbm(nTx + 10, nTy + 10, 2, 0.5, 2.0, noiseHeight);
        nTx += 2.0 * qx;
        nTy += 2.0 * qy;
      }

      let rawT = fbm(nTx, nTy, 2, 0.5, 2.0, noiseTemp);
      const t = (rawT + 1) / 2;

      // Determine Biome
      const biomeIndex = getBiomeIndex(h, t);

      // Texture Mapping
      // Calculate texture coordinate
      // We tile the texture based on world coordinates (x, y)
      const tileX = Math.floor(x % spriteSize);
      const tileY = Math.floor(y % spriteSize);

      // Grid Layout Logic (5 columns)
      const col = biomeIndex % spritesPerRow;
      const row = Math.floor(biomeIndex / spritesPerRow);

      const srcX = Math.floor(col * spriteSize + tileX);
      const srcY = Math.floor(row * spriteSize + tileY);

      // Read from textureData
      const srcIndex = (srcY * texWidth + srcX) * 4;

      // Write to outputData
      const paramIndex = (y * WIDTH + x) * 4;

      // Copy RGBA
      if (srcIndex < terrainData.length) {
        outputData[paramIndex] = terrainData[srcIndex];
        outputData[paramIndex + 1] = terrainData[srcIndex + 1];
        outputData[paramIndex + 2] = terrainData[srcIndex + 2];
        outputData[paramIndex + 3] = 255; // Alpha
      }
    }
  }

  ctx.putImageData(canvasData, 0, 0);
}

// Initial Generation - Managed by Image OnLoad

// Event Listeners
scaleInput.addEventListener('input', generate);
offsetInput.addEventListener('input', generate);
warpInput.addEventListener('change', generate);

regenerateBtn.addEventListener('click', () => {
  noiseHeight = new PerlinNoise();
  noiseTemp = new PerlinNoise();
  generate(); // Note: animation removed to keep simple logic intact with ImageData

  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});
