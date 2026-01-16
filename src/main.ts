import './style/style.css'
import { TILE_SIZE, BIOME_MOVEMENT_SPEEDS, CLIMB_DURATION, CLIMBABLE_BIOMES, WATER_BIOMES } from './config';
import { WorldManager, type TerrainData } from './core/generation';
import { renderMap } from './rendering/renderer';
import { getAtmosphericLight, renderShadows } from './rendering/lighting';
import { Steve } from './entities/steve';
import { getBiomeIndex } from './core/biomes';
import { AssetLoader } from './systems/assets';
import { InputManager } from './systems/input';

// Elements
const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const seedInput = document.getElementById('seedInput') as HTMLInputElement;

// Terrain Cache & Core State
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d')!;
let gameTime = 12;
const DAY_SPEED = 0.0025;

const worldManager = new WorldManager();
const assets = new AssetLoader(() => checkLoadAndGenerate());
const input = new InputManager(canvas);

// Steve
const steve = new Steve(1000, 1000, () => checkLoadAndGenerate());

// Game State
let currentTerrainData: TerrainData | null = null;
let centerScreenX = 0;
let centerScreenY = 0;

function checkLoadAndGenerate() {
  if (assets.isLoaded && steve.loaded) {
    generate();
  }
}

function generate() {
  if (!assets.isLoaded || !steve.loaded) return;

  // 1. Zoom/Canvas Sizing
  const visibleTilesInput = parseInt(scaleInput.value);
  const tilesY = Math.max(4, visibleTilesInput);
  const rect = canvas.getBoundingClientRect();
  const aspect = (rect.width > 0 && rect.height > 0) ? rect.width / rect.height : 1;
  const tilesX = Math.round(tilesY * aspect);

  const renderWidth = tilesX * TILE_SIZE;
  const renderHeight = tilesY * TILE_SIZE;

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    terrainCanvas.width = renderWidth;
    terrainCanvas.height = renderHeight;
  }

  ctx.clearRect(0, 0, renderWidth, renderHeight);
  terrainCtx.clearRect(0, 0, renderWidth, renderHeight);
  ctx.imageSmoothingEnabled = false;
  terrainCtx.imageSmoothingEnabled = false;

  // 2. World Generation
  const mapOriginX = steve.worldX - Math.floor(tilesX / 2);
  const mapOriginY = steve.worldY - Math.floor(tilesY / 2);
  centerScreenX = steve.worldX - mapOriginX;
  centerScreenY = steve.worldY - mapOriginY;

  currentTerrainData = worldManager.generate(tilesX, tilesY, mapOriginX, mapOriginY, true);

  // Update Steve's Water State
  const cx = tilesX >> 1;
  const cy = tilesY >> 1;
  const centerIdx = cy * tilesX + cx;
  const h = currentTerrainData.heightMap[centerIdx];
  const t = currentTerrainData.tempMap[centerIdx];
  const m = currentTerrainData.moistureMap[centerIdx];
  const currentBiome = getBiomeIndex(h, t, m);
  steve.isInWater = WATER_BIOMES.includes(currentBiome);

  // 3. Render Terrain to Cache
  renderMap(terrainCtx, assets.biomeTextures, currentTerrainData);
  draw();
}

function draw() {
  if (!currentTerrainData) return;

  // Update Steve's Mouse Angle from Input
  const steveCanvasX = centerScreenX * TILE_SIZE + TILE_SIZE / 2;
  const steveCanvasY = centerScreenY * TILE_SIZE + TILE_SIZE / 2;
  steve.mouseAngle = Math.atan2(input.lastMouseBufferY - steveCanvasY, input.lastMouseBufferX - steveCanvasX);

  // Composite Frame
  ctx.drawImage(terrainCanvas, 0, 0);
  renderShadows(ctx, currentTerrainData.tilesX, currentTerrainData.tilesY, gameTime);
  steve.render(ctx, centerScreenX, centerScreenY);

  // Atmosphere
  const light = getAtmosphericLight(gameTime);
  if (light.a > 0.01) {
    ctx.fillStyle = `rgba(${light.r}, ${light.g}, ${light.b}, ${light.a})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function moveSteve(dx: number, dy: number) {
  if (!currentTerrainData || !steve.isReadyToMove()) return;

  const cx = currentTerrainData.tilesX >> 1;
  const cy = currentTerrainData.tilesY >> 1;
  const targetX = cx + dx;
  const targetY = cy + dy;

  if (targetX < 0 || targetX >= currentTerrainData.tilesX || targetY < 0 || targetY >= currentTerrainData.tilesY) return;

  const centerIdx = cy * currentTerrainData.tilesX + cx;
  const targetIdx = targetY * currentTerrainData.tilesX + targetX;

  const getBiome = (idx: number) => {
    const h = currentTerrainData!.heightMap[idx];
    const t = currentTerrainData!.tempMap[idx];
    const m = currentTerrainData!.moistureMap[idx];
    return getBiomeIndex(h, t, m);
  };

  const currentBiome = getBiome(centerIdx);
  const targetBiome = getBiome(targetIdx);

  let duration = 150;
  const isClimb = CLIMBABLE_BIOMES.includes(targetBiome) && !CLIMBABLE_BIOMES.includes(currentBiome);
  const isDescend = !CLIMBABLE_BIOMES.includes(targetBiome) && CLIMBABLE_BIOMES.includes(currentBiome);

  if (isClimb) {
    duration = CLIMB_DURATION;
  } else {
    let speed = BIOME_MOVEMENT_SPEEDS[currentBiome] || 1.0;
    if (input.isShiftPressed()) speed *= 1.5;
    duration = 150 / speed;
  }

  steve.move(dx, dy, duration, isClimb, isDescend);
  generate();

  if (isClimb || isDescend) requestAnimationFrame(animationLoop);
}

function animationLoop() {
  draw();
  if (!steve.isReadyToMove()) requestAnimationFrame(animationLoop);
}

function processInput() {
  const { dx, dy } = input.getDirection();

  if (dx === 0 && dy === 0) {
    if (steve.lastDx !== 0 || steve.lastDy !== 0) {
      steve.lastDx = 0;
      steve.lastDy = 0;
    }
    return;
  }

  const isNewDirection = (dx !== steve.lastDx || dy !== steve.lastDy);

  if (steve.isReadyToMove() || isNewDirection) {
    moveSteve(dx, dy);
  }
}

function gameLoop() {
  gameTime = (gameTime + DAY_SPEED) % 24;

  // Update Steve sinking state
  const { dx, dy } = input.getDirection();
  steve.isIdleInWater = (dx === 0 && dy === 0);
  steve.update();

  processInput();
  draw();
  requestAnimationFrame(gameLoop);
}

// UI Event Listeners
const attachClick = (id: string, dx: number, dy: number) => {
  document.getElementById(id)?.addEventListener('click', () => moveSteve(dx, dy));
};

attachClick('moveUp', 0, -1);
attachClick('moveDown', 0, 1);
attachClick('moveLeft', -1, 0);
attachClick('moveRight', 1, 0);
attachClick('moveUL', -1, -1);
attachClick('moveUR', 1, -1);
attachClick('moveDL', -1, 1);
attachClick('moveDR', 1, 1);

scaleInput.addEventListener('input', generate);
window.addEventListener('resize', () => generate()); // Simple resize for now

regenerateBtn.addEventListener('click', () => {
  worldManager.setSeed(seedInput.value.trim());
  generate();
  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});

// Start
requestAnimationFrame(gameLoop);
checkLoadAndGenerate();
