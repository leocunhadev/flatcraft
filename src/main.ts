import './style.css'
import { PerlinNoise } from './perlin'
import { TILE_SIZE, BIOME_MOVEMENT_SPEEDS, CLIMB_DURATION, CLIMBABLE_BIOMES, BIOME_FILENAMES } from './config';
import { generateTerrainData, type TerrainData } from './generation';
import { renderMap, renderShadows } from './renderer';
import { Steve } from './steve';
import { getBiomeIndex } from './biomes';

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const seedInput = document.getElementById('seedInput') as HTMLInputElement;

// Terrain Cache & Lighting
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d')!;
let gameTime = 12; // 0-24h cycle
const DAY_SPEED = 0.001;

interface LightingStep {
  hour: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

const LIGHTING_TIMELINE: LightingStep[] = [
  { hour: 0, r: 10, g: 15, b: 45, a: 0.9 },  // Midnight
  { hour: 1, r: 10, g: 15, b: 45, a: 0.9 },
  { hour: 2, r: 10, g: 15, b: 45, a: 0.9 },
  { hour: 3, r: 10, g: 15, b: 45, a: 0.9 },
  { hour: 4, r: 10, g: 15, b: 45, a: 0.9 },
  { hour: 5, r: 30, g: 20, b: 60, a: 0.7 },  // Dawn
  { hour: 6, r: 255, g: 140, b: 50, a: 0.35 }, // Sunrise (Golden Hour)
  { hour: 7, r: 255, g: 140, b: 50, a: 0.15 },
  { hour: 8, r: 255, g: 255, b: 255, a: 0.0 },  // Morning
  { hour: 9, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 10, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 11, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 12, r: 255, g: 255, b: 255, a: 0.0 },  // Noon
  { hour: 13, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 14, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 15, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 16, r: 255, g: 255, b: 255, a: 0.0 },
  { hour: 17, r: 255, g: 80, b: 20, a: 0.4 },  // Sunset (Golden Hour)
  { hour: 18, r: 255, g: 80, b: 20, a: 0.4 },
  { hour: 19, r: 40, g: 20, b: 80, a: 0.6 },  // Dusk
  { hour: 20, r: 40, g: 20, b: 80, a: 0.6 },
  { hour: 21, r: 40, g: 20, b: 80, a: 0.6 },
  { hour: 22, r: 40, g: 20, b: 80, a: 0.6 },
  { hour: 23, r: 10, g: 15, b: 45, a: 0.8 }   // Midnight cycle
];

function getAtmosphericLight(time: number) {
  const t = time % 24;

  // Find the two keyframes we are between
  let nextIdx = LIGHTING_TIMELINE.findIndex(step => step.hour > t);
  if (nextIdx === -1) nextIdx = 0;

  let prevIdx = nextIdx - 1;
  if (prevIdx < 0) prevIdx = LIGHTING_TIMELINE.length - 1;

  const prev = LIGHTING_TIMELINE[prevIdx];
  let next = LIGHTING_TIMELINE[nextIdx];

  // Calculate interpolation factor
  let prevHour = prev.hour;
  let nextHour = next.hour;

  if (nextHour < prevHour) nextHour += 24; // Handle midnight wrap

  let factor = (t < prevHour ? t + 24 - prevHour : t - prevHour) / (nextHour - prevHour);

  return {
    r: Math.round(prev.r + (next.r - prev.r) * factor),
    g: Math.round(prev.g + (next.g - prev.g) * factor),
    b: Math.round(prev.b + (next.b - prev.b) * factor),
    a: prev.a + (next.a - prev.a) * factor
  };
}


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
    terrainCanvas.width = renderWidth;
    terrainCanvas.height = renderHeight;
  }

  // Clear buffers
  ctx.clearRect(0, 0, renderWidth, renderHeight);
  terrainCtx.clearRect(0, 0, renderWidth, renderHeight);

  // Turn off smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;
  terrainCtx.imageSmoothingEnabled = false;

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

  // Cache terrain rendering
  renderMap(terrainCtx, biomeTextures, currentTerrainData);

  draw();
}

function draw() {
  if (!currentTerrainData) return;

  // Draw Cached Map
  ctx.drawImage(terrainCanvas, 0, 0);

  // Dynamic Shadows based on Sun position
  renderShadows(ctx, currentTerrainData.tilesX, currentTerrainData.tilesY, gameTime);

  // Draw Steve at Center Screen
  steve.render(ctx, centerScreenX, centerScreenY);

  // Atmospheric Lighting System (Timeline)
  const light = getAtmosphericLight(gameTime);

  if (light.a > 0.01) {
    ctx.fillStyle = `rgba(${light.r}, ${light.g}, ${light.b}, ${light.a})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
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

  const isClimb = isTargetClimbable && !isCurrentClimbable;
  if (isClimb) {
    console.log(`CLIMB UP: Current Biome (${biomeIndex}) -> Target Biome (${targetBiomeIndex})`);
    duration = CLIMB_DURATION;
  } else {
    // Normal Movement
    console.log(`WALKING: Current Biome (${biomeIndex}) -> Target Biome (${targetBiomeIndex})`);
    let speed = BIOME_MOVEMENT_SPEEDS[biomeIndex] || 1.0;

    // Shift boost
    if (pressedKeys.has('Shift')) {
      speed *= 1.5;
    }

    duration = baseDelay / speed;
  }

  steve.move(dx, dy, duration, isClimb);
  generate(); // Regenerate map around new position

  if (isClimb) {
    requestAnimationFrame(animationLoop);
  }
}

function animationLoop() {
  draw();
  if (!steve.isReadyToMove()) {
    requestAnimationFrame(animationLoop);
  }
}

document.getElementById('moveUp')?.addEventListener('click', () => moveSteve(0, -1));
document.getElementById('moveDown')?.addEventListener('click', () => moveSteve(0, 1));
document.getElementById('moveLeft')?.addEventListener('click', () => moveSteve(-1, 0));
document.getElementById('moveRight')?.addEventListener('click', () => moveSteve(1, 0));

document.getElementById('moveUL')?.addEventListener('click', () => moveSteve(-1, -1));
document.getElementById('moveUR')?.addEventListener('click', () => moveSteve(1, -1));
document.getElementById('moveDL')?.addEventListener('click', () => moveSteve(-1, 1));
document.getElementById('moveDR')?.addEventListener('click', () => moveSteve(1, 1));

// Keyboard support with multi-key tracking
const pressedKeys = new Set<string>();

window.addEventListener('keydown', (e) => {
  pressedKeys.add(e.key);
  processInput();
});

window.addEventListener('keyup', (e) => {
  pressedKeys.delete(e.key);
});

function processInput() {
  if (!steve.isReadyToMove()) return;

  let dx = 0;
  let dy = 0;

  if (pressedKeys.has('ArrowUp') || pressedKeys.has('w')) dy -= 1;
  if (pressedKeys.has('ArrowDown') || pressedKeys.has('s')) dy += 1;
  if (pressedKeys.has('ArrowLeft') || pressedKeys.has('a')) dx -= 1;
  if (pressedKeys.has('ArrowRight') || pressedKeys.has('d')) dx += 1;

  if (dx !== 0 || dy !== 0) {
    moveSteve(dx, dy);
  }
}

// Continuous loop
function gameLoop() {
  gameTime = (gameTime + DAY_SPEED) % 24;
  processInput();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Event Listeners
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Scale mouse coordinates to canvas buffer coordinates
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const bufferMouseX = mouseX * scaleX;
  const bufferMouseY = mouseY * scaleY;

  // Steve center in canvas buffer pixels
  const steveCanvasX = centerScreenX * TILE_SIZE + TILE_SIZE / 2;
  const steveCanvasY = centerScreenY * TILE_SIZE + TILE_SIZE / 2;

  steve.mouseAngle = Math.atan2(bufferMouseY - steveCanvasY, bufferMouseX - steveCanvasX);
  draw(); // Redraw to update arm
});

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
