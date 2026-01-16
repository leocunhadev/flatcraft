export class SurvivalSystem {
    public airLevel: number = 10;
    public healthLevel: number = 10;
    private lastUpdate: number = Date.now();

    public update(isInWater: boolean, isIdle: boolean): boolean {
        const now = Date.now();
        if (now - this.lastUpdate < 1000) return false;
        this.lastUpdate = now;

        if (isInWater && isIdle) {
            if (this.airLevel > 0) {
                this.airLevel--;
            } else if (this.healthLevel > 0) {
                this.healthLevel--;
            }
        } else {
            // Regenerate air
            if (this.airLevel < 10) this.airLevel = 10;
        }

        return true; // Indicates stats changed
    }
}
