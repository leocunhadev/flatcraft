import './style.css'
import { PerlinNoise } from './perlin'
// @ts-ignore
import textureUrl from './imagens/texturas_terrenos.png';
import steveUrl from './imagens/steve.jpeg';
import { TILE_SIZE, SPRITES_PER_ROW } from './config';
import { generateTerrainData, type TerrainData } from './generation';
import { renderMap, renderCharacter } from './renderer';

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
const steveImage = new Image();
let terrainDataLoaded = false;
let steveLoaded = false;
let currentTerrainData: TerrainData | null = null;
let steveX = 2; // Initial Grid Position
let steveY = 2;

terrainImage.onload = () => {
  // Verification logic
  const spriteSize = terrainImage.width / SPRITES_PER_ROW;
  if (Math.floor(spriteSize) !== spriteSize) {
    console.warn("Sprite size is non-integer, check image dimensions and biome count.");
  }
  terrainDataLoaded = true;
  checkLoadAndGenerate();
};

steveImage.onload = () => {
  steveLoaded = true;
  checkLoadAndGenerate();
}

terrainImage.src = textureUrl;
steveImage.src = steveUrl;

function checkLoadAndGenerate() {
  if (terrainDataLoaded && steveLoaded) {
    generate();
  }
}

function generate() {
  if (!terrainDataLoaded || !steveLoaded) return;

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
  currentTerrainData = generateTerrainData(
    tilesX,
    tilesY,
    userOffset,
    useWarp,
    noiseHeight,
    noiseTemp
  );

  // Reset Steve if out of bounds (optional, but good practice)
  if (steveX >= tilesX) steveX = tilesX - 1;
  if (steveY >= tilesY) steveY = tilesY - 1;

  draw();
}

function draw() {
  if (!currentTerrainData) return;

  // Draw Map
  renderMap(ctx, terrainImage, currentTerrainData);

  // Draw Steve
  renderCharacter(ctx, steveImage, steveX, steveY);
}

// Controls
function moveSteve(dx: number, dy: number) {
  if (!currentTerrainData) return;

  const nextX = steveX + dx;
  const nextY = steveY + dy;

  // Bounds Check
  if (nextX >= 0 && nextX < currentTerrainData.tilesX &&
    nextY >= 0 && nextY < currentTerrainData.tilesY) {
    steveX = nextX;
    steveY = nextY;
    draw();
  }
}

document.getElementById('moveUp')?.addEventListener('click', () => moveSteve(0, -1));
document.getElementById('moveDown')?.addEventListener('click', () => moveSteve(0, 1));
document.getElementById('moveLeft')?.addEventListener('click', () => moveSteve(-1, 0));
document.getElementById('moveRight')?.addEventListener('click', () => moveSteve(1, 0));

// Keyboard support
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': moveSteve(0, -1); break;
    case 'ArrowDown': moveSteve(0, 1); break;
    case 'ArrowLeft': moveSteve(-1, 0); break;
    case 'ArrowRight': moveSteve(1, 0); break;
  }
});

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
