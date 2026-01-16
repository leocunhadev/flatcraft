import './style.css'
import { PerlinNoise } from './perlin'
// @ts-ignore
import textureUrl from './imagens/texturas_terrenos.png';
import { TILE_SIZE, SPRITES_PER_ROW } from './config';
import { generateTerrainData, type TerrainData } from './generation';
import { renderMap } from './renderer';
import { Steve } from './steve';

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;


// Initialize Noise Layers
let noiseHeight = new PerlinNoise();
let noiseTemp = new PerlinNoise();

// Texture Management
const terrainImage = new Image();
let terrainDataLoaded = false;

// Initialize Steve
const steve = new Steve(1000, 1000, () => {
  checkLoadAndGenerate();
});

let currentTerrainData: TerrainData | null = null;
// Screen Coordinates (Calculated)
let centerScreenX = 0;
let centerScreenY = 0;

terrainImage.onload = () => {
  // Verification logic
  const spriteSize = terrainImage.width / SPRITES_PER_ROW;
  if (Math.floor(spriteSize) !== spriteSize) {
    console.warn("Sprite size is non-integer, check image dimensions and biome count.");
  }
  terrainDataLoaded = true;
  checkLoadAndGenerate();
};



terrainImage.src = textureUrl;

function checkLoadAndGenerate() {
  if (terrainDataLoaded && steve.loaded) {
    generate();
  }
}

function generate() {
  if (!terrainDataLoaded || !steve.loaded) return;

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

  const useWarp = true; // Default to connected oceans

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

  // 3. Generate Data
  // Calculate Map Origin based on Player Position (Centering Logic)
  const mapOriginX = steve.worldX - Math.floor(tilesX / 2);
  const mapOriginY = steve.worldY - Math.floor(tilesY / 2);

  // Store center for rendering Steve
  centerScreenX = steve.worldX - mapOriginX;
  centerScreenY = steve.worldY - mapOriginY;

  currentTerrainData = generateTerrainData(
    tilesX,
    tilesY,
    mapOriginX,
    mapOriginY,
    useWarp,
    noiseHeight,
    noiseTemp
  );

  draw();
}

function draw() {
  if (!currentTerrainData) return;

  // Draw Map
  renderMap(ctx, terrainImage, currentTerrainData);

  // Draw Steve at Center Screen
  steve.render(ctx, centerScreenX, centerScreenY);
}

// Controls
function moveSteve(dx: number, dy: number) {
  steve.move(dx, dy);
  generate(); // Regenerate map around new position
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
