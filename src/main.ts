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
  const tilesY = Math.max(4, visibleTilesInput); // Base zoom on vertical height

  // Get container aspect ratio
  // We use the canvas's current display size (which fills the container)
  // If canvas is hidden or 0, fallback to square.
  let aspect = 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    aspect = rect.width / rect.height;
  }

  const tilesX = Math.round(tilesY * aspect);

  const userOffset = parseFloat(offsetInput.value);
  const useWarp = warpInput.checked;

  // 2. Resize Canvas Buffer
  const renderWidth = tilesX * TILE_SIZE;
  const renderHeight = tilesY * TILE_SIZE;

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
    tilesX,
    tilesY,
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

// Debounced resize listener
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(generate, 100);
});

regenerateBtn.addEventListener('click', () => {
  noiseHeight = new PerlinNoise();
  noiseTemp = new PerlinNoise();
  generate();

  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});
