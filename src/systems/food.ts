import { BIOMES } from '../config';
import { getBiomeIndex } from '../core/biomes';
import { type TerrainData } from '../core/generation';
import { AssetLoader } from './assets';
import { SurvivalSystem } from './survival';

interface FoodItem {
    x: number;
    y: number;
    type: 'apple'; // For now, only apples
}

export class FoodManager {
    private foodItems: FoodItem[] = [];
    private assets: AssetLoader;

    constructor(assets: AssetLoader) {
        this.assets = assets;
    }

    public update(terrainData: TerrainData, mapOriginX: number, mapOriginY: number, playerX: number, playerY: number, despawnDistance: number) {
        // Spawn food in certain biomes
        if (Math.random() < 0.01) { // Reduced spawn rate
            const x = Math.floor(Math.random() * terrainData.tilesX);
            const y = Math.floor(Math.random() * terrainData.tilesY);
            const index = y * terrainData.tilesX + x;
            const h = terrainData.heightMap[index];
            const t = terrainData.tempMap[index];
            const m = terrainData.moistureMap[index];
            const biome = getBiomeIndex(h, t, m);

            if (biome === BIOMES.forest || biome === BIOMES.jungle) {
                this.foodItems.push({ x: x + mapOriginX, y: y + mapOriginY, type: 'apple' });
            }
        }

        // Despawn food far from the player
        this.foodItems = this.foodItems.filter(food => {
            const distance = Math.sqrt(Math.pow(food.x - playerX, 2) + Math.pow(food.y - playerY, 2));
            return distance <= despawnDistance;
        });
    }

    public collectFood(x: number, y: number, survival: SurvivalSystem) {
        for (let i = this.foodItems.length - 1; i >= 0; i--) {
            const food = this.foodItems[i];
            if (food.x === x && food.y === y) {
                this.foodItems.splice(i, 1);
                survival.eat(2); // Apples restore 2 food points
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D, mapOriginX: number, mapOriginY: number) {
        const appleTexture = this.assets.getTexture('apple.png');
        if (!appleTexture) return;

        for (const food of this.foodItems) {
            const screenX = (food.x - mapOriginX) * 48;
            const screenY = (food.y - mapOriginY) * 48;
            ctx.drawImage(appleTexture, screenX, screenY, 48, 48);
        }
    }
}
