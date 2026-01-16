export class SurvivalSystem {
    public airLevel: number = 10;
    public healthLevel: number = 10;
    public foodLevel: number = 10;

    private lastUpdate: number = Date.now();
    private lastFoodUpdate: number = Date.now();
    private lastHealthRegen: number = Date.now();

    public eat(amount: number) {
        this.foodLevel = Math.min(10, this.foodLevel + amount);
    }

    public update(isInWater: boolean, isIdle: boolean): boolean {
        const now = Date.now();
        let statsChanged = false;

        // Air logic (every second)
        if (now - this.lastUpdate >= 1000) {
            this.lastUpdate = now;
            statsChanged = true;

            if (isInWater && isIdle) {
                if (this.airLevel > 0) {
                    this.airLevel--;
                } else if (this.healthLevel > 0) {
                    this.healthLevel--;
                }
            } else {
                if (this.airLevel < 10) this.airLevel = 10;
            }
        }

        // Food logic (every 30 seconds)
        if (now - this.lastFoodUpdate >= 30000) {
            this.lastFoodUpdate = now;
            statsChanged = true;
            if (this.foodLevel > 0) {
                this.foodLevel--;
            } else if (this.healthLevel > 0) {
                this.healthLevel--; // Starvation
            }
        }

        // Health regeneration (every 5 seconds)
        if (now - this.lastHealthRegen >= 5000) {
            this.lastHealthRegen = now;
            if (this.foodLevel >= 8 && this.healthLevel < 10) {
                this.healthLevel++;
                this.foodLevel -= 0.5; // Cost to heal
                statsChanged = true;
            }
        }

        return statsChanged;
    }
}
