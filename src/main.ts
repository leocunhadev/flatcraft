import './style.css'
import { PerlinNoise } from './perlin'
import { TILE_SIZE, BIOME_MOVEMENT_SPEEDS, CLIMB_DURATION, CLIMBABLE_BIOMES, BIOME_FILENAMES } from './config';
import { generateTerrainData, type TerrainData } from './generation';
import { renderMap } from './renderer';
import { Steve } from './steve';
import { getBiomeIndex } from './biomes';

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const seedInput = document.getElementById('seedInput') as HTMLInputElement;


// Initialize Noise Layers
let noiseHeight = new PerlinNoise();
let noiseTemp = new PerlinNoise();
let noiseMoisture = new PerlinNoise();

// Texture Management

const biomeTextures: Record<number, HTMLImageElement> = {};
let terrainDataLoaded = false;

// Load images using Vite's glob import
// @ts-ignore
const images = import.meta.glob('./imagens/*.{png,jpg,jpeg}', { eager: true, as: 'url' });

let pendingImages = 0;


Object.entries(BIOME_FILENAMES).forEach(([idStr, filename]) => {
  const id = parseInt(idStr);
  const key = `./imagens/${filename}`;
  // @ts-ignore
  const src = images[key];

  if (src) {
    pendingImages++;
    const img = new Image();
    img.onload = () => {
      pendingImages--;
      if (pendingImages === 0) {
        terrainDataLoaded = true;
        checkLoadAndGenerate();
      }
    };
    img.onerror = () => {
      console.error(`Failed to load: ${filename}`);
      pendingImages--;
      if (pendingImages === 0) {
        terrainDataLoaded = true;
        checkLoadAndGenerate();
      }
    };
    img.src = src;
    biomeTextures[id] = img;
  } else {
    console.warn(`Image definition missing for biome ${id}: ${filename}`);
  }
});

// Initialize Steve
const steve = new Steve(1000, 1000, () => {
  checkLoadAndGenerate();
});

let currentTerrainData: TerrainData | null = null;
// Screen Coordinates (Calculated)
let centerScreenX = 0;
let centerScreenY = 0;

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
    noiseTemp,
    noiseMoisture
  );

  draw();
}

function draw() {
  if (!currentTerrainData) return;

  // Draw Map
  renderMap(ctx, biomeTextures, currentTerrainData);

  // Draw Steve at Center Screen
  steve.render(ctx, centerScreenX, centerScreenY);
}

// Controls
// Controls
function moveSteve(dx: number, dy: number) {
  if (!currentTerrainData) return;

  if (!steve.isReadyToMove()) return;

  // Center Index (Steve's current position)
  const cx = currentTerrainData.tilesX >> 1;
  const cy = currentTerrainData.tilesY >> 1;
  const centerIndex = cy * currentTerrainData.tilesX + cx;

  // Target Index (Where Steve is going)
  // Since we have a buffer, +/- 1 tile is safe
  const tx = cx + dx;
  const ty = cy + dy;
  const targetIndex = ty * currentTerrainData.tilesX + tx;

  // Current Biome
  const h = currentTerrainData.heightMap[centerIndex];
  const t = currentTerrainData.tempMap[centerIndex];
  const m = currentTerrainData.moistureMap[centerIndex];
  const biomeIndex = getBiomeIndex(h, t, m);

  // Target Biome
  const h2 = currentTerrainData.heightMap[targetIndex];
  const t2 = currentTerrainData.tempMap[targetIndex];
  const m2 = currentTerrainData.moistureMap[targetIndex];
  const targetBiomeIndex = getBiomeIndex(h2, t2, m2);

  // LOGIC: Movement Speed & Climbing
  const baseDelay = 150; // default base
  let duration = baseDelay;

  // Check Climbing: Moving from non-climbable TO climbable
  const isTargetClimbable = CLIMBABLE_BIOMES.includes(targetBiomeIndex);
  const isCurrentClimbable = CLIMBABLE_BIOMES.includes(biomeIndex);

  if (isTargetClimbable && !isCurrentClimbable) {
    // Climbing penalty! (Transitioning from Low to High)
    console.log(`CLIMB UP: Current Biome (${biomeIndex}) -> Target Biome (${targetBiomeIndex})`);
    duration = CLIMB_DURATION;
  } else {
    // Normal Movement
    console.log(`WALKING: Current Biome (${biomeIndex}) -> Target Biome (${targetBiomeIndex})`);
    const speed = BIOME_MOVEMENT_SPEEDS[biomeIndex] || 1.0;
    duration = baseDelay / speed;
  }

  steve.move(dx, dy, duration);
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
  const seedString = seedInput.value.trim();
  let seedVal: number | undefined;

  if (seedString !== "") {
    // Simple hash to convert string to number
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    seedVal = hash;
  }

  noiseHeight = new PerlinNoise(seedVal);
  noiseTemp = new PerlinNoise(seedVal ? seedVal + 12345 : undefined);
  noiseMoisture = new PerlinNoise(seedVal ? seedVal + 54321 : undefined);
  generate();

  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});
