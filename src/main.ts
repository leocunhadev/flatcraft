import './style.css'
import { PerlinNoise } from './perlin'
// @ts-ignore
import textureUrl from './imagens/texturas_terrenos.png'
import { TILE_SIZE, SPRITES_PER_ROW } from './config';
import { generateTerrainData } from './generation';
import { renderMap } from './renderer';

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const offsetInput = document.getElementById('offsetInput') as HTMLInputElement;
const warpInput = document.getElementById('warpInput') as HTMLInputElement;

// Initialize Noise Layers
let noiseHeight = new PerlinNoise();
let noiseTemp = new PerlinNoise();

// Texture Management
const terrainImage = new Image();
let terrainDataLoaded = false;

terrainImage.onload = () => {
  // Verification logic
  const spriteSize = terrainImage.width / SPRITES_PER_ROW;
  if (Math.floor(spriteSize) !== spriteSize) {
    console.warn("Sprite size is non-integer, check image dimensions and biome count.");
  }
  terrainDataLoaded = true;
  generate();
};
terrainImage.src = textureUrl;

function generate() {
  if (!terrainDataLoaded) return;

  // 1. Gather Inputs
  const visibleTilesInput = parseInt(scaleInput.value);
  const visibleTiles = Math.max(4, visibleTilesInput);
  const userOffset = parseFloat(offsetInput.value);
  const useWarp = warpInput.checked;

  // 2. Resize Canvas
  const renderWidth = visibleTiles * TILE_SIZE;
  const renderHeight = visibleTiles * TILE_SIZE;

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }

  // Clear canvas
  ctx.clearRect(0, 0, renderWidth, renderHeight);
  // Turn off smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  // 3. Generate Data (Pass 1 & 2)
  const terrainData = generateTerrainData(
    visibleTiles,
    userOffset,
    useWarp,
    noiseHeight,
    noiseTemp
  );

  // 4. Render (Pass 3)
  renderMap(ctx, terrainImage, terrainData);
}

// Event Listeners
scaleInput.addEventListener('input', generate);
offsetInput.addEventListener('input', generate);
warpInput.addEventListener('change', generate);

regenerateBtn.addEventListener('click', () => {
  noiseHeight = new PerlinNoise();
  noiseTemp = new PerlinNoise();
  generate();

  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});
