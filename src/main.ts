import './style.css'
import { PerlinNoise } from './perlin'

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const scaleInput = document.getElementById('scaleInput') as HTMLInputElement;
const offsetInput = document.getElementById('offsetInput') as HTMLInputElement;

const WIDTH = 32;
const HEIGHT = 32;

// Initialize Noise
let noise = new PerlinNoise();

// Color Palette (Hex)
const COLORS = {
  deepWater: '#1e3a8a', // blue-900
  water: '#3b82f6',     // blue-500
  sand: '#fde047',      // yellow-300
  grass: '#22c55e',     // green-500
  forest: '#15803d',    // green-700
  rock: '#78716c',      // stone-500
  snow: '#f8fafc',      // slate-50
};

function getColor(value: number): string {
  // Value is roughly -1 to 1, normalise to 0..1 sort of, or just threshold
  // Perlin noise can go slightly outside -1..1 depending on implementation but usually around there.

  if (value < -0.3) return COLORS.deepWater;
  if (value < -0.05) return COLORS.water;
  if (value < 0.05) return COLORS.sand;
  if (value < 0.35) return COLORS.grass;
  if (value < 0.6) return COLORS.forest;
  if (value < 0.8) return COLORS.rock;
  return COLORS.snow;
}

function generate() {
  const scale = parseFloat(scaleInput.value); // Controls zoom/frequency
  const offset = parseFloat(offsetInput.value); // Moves the map

  // Re-seed noise if needed?
  // PerlinNoise class as written has fixed permutation on init.
  // To get "new" maps we need new permutation or simple offset in noise space.
  // We will use a random offset + slider offset for z or x/y.

  // Actually, to make "Regenerate" work, we should just instantiate new Noise or add a random seed offset.
  // My Perlin implementation generates permutation in constructor. So new PerlinNoise() = new Seed.

  // We'll create a new noise instance only on Regenerate click, but preserve slider usage for pan/zoom?
  // No, user wants "Regenerate". Let's use a global scalar offset for randomness.

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // Scale coordinates.
      // Higher scale input = Zoom IN? Or Zoom OUT?
      // Usually Scale = Frequency. Higher Frequency = Zoom OUT (more noise).
      // Let's make "Scale" input mean Zoom Level (so higher = larger features = lower frequency).
      // freq = 1 / scale.

      const frequency = 10 / (scale * 5); // magic numbers to tune feel

      const nx = (x + offset * 10) * frequency;
      const ny = (y + offset * 10) * frequency;

      // Use offsetInput as a Z coordinate for animation/scrolling effect if desired,
      // or just X/Y offset. Let's use it as X/Y offset index.
      // But wait, "Offset" slider is usually for scrolling noise.
      // "Regenerate" button should completely randomize the map.

      // Refined logic:
      // Regenerate: Randomizes the internal Permutation table (new PerlinNoise).
      // Offset Slider: Scrolls through the CURRENT map (modifies inputs to noise).
      // Scale Slider: Zooms in/out (modifies input multiplier).

      const val = noise.noise(nx, ny, 0);

      ctx.fillStyle = getColor(val);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Initial Generation
generate();

// Event Listeners
scaleInput.addEventListener('input', generate);
offsetInput.addEventListener('input', generate);

regenerateBtn.addEventListener('click', () => {
  noise = new PerlinNoise(); // Reshuffles permutation
  // specific user experience: Reset offset? Maybe keep it.
  generate();

  // Add a nice visual pop to canvas
  canvas.style.transform = 'scale(0.95)';
  setTimeout(() => canvas.style.transform = 'scale(1)', 100);
});
