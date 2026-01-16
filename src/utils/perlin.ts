import { SeededRandom } from './utils';

export class PerlinNoise {
  private permutation: number[];

  constructor(seed?: number) {
    this.permutation = this.generatePermutation(seed);
  }

  private generatePermutation(seed?: number): number[] {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // If seed is provided, use SeededRandom, otherwise use Math.random
    let randomFunc = Math.random;
    if (seed !== undefined) {
      const rng = new SeededRandom(seed);
      randomFunc = () => rng.next();
    }

    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(randomFunc() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    // Duplicate for overflow handling
    return [...p, ...p];
  }

  public noise(x: number, y: number, z: number = 0): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
          this.grad(this.permutation[BB], x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
          this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
          this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    // Convert low 4 bits of hash code into 12 gradient directions
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
