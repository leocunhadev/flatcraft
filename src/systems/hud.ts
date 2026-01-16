export class HUDManager {
    private heartIcons: HTMLElement[] = [];
    private bubbleIcons: HTMLElement[] = [];

    constructor() {
        this.init();
    }

    private init() {
        const heartsRow = document.getElementById('heartsRow');
        const foodRow = document.getElementById('foodRow');
        const bubblesRow = document.getElementById('bubblesRow');

        if (heartsRow && foodRow && bubblesRow) {
            for (let i = 0; i < 10; i++) {
                const heart = document.createElement('div');
                heart.className = 'hud-icon heart';
                heartsRow.appendChild(heart);
                this.heartIcons.push(heart);

                const food = document.createElement('img');
                food.src = '/food_pixel.png';
                food.className = 'hud-icon';
                foodRow.appendChild(food);

                const bubble = document.createElement('img');
                bubble.src = '/bubble_pixel.png';
                bubble.className = 'hud-icon';
                bubblesRow.appendChild(bubble);
                this.bubbleIcons.push(bubble);
            }
        }
    }

    public update(airLevel: number, healthLevel: number) {
        this.heartIcons.forEach((icon, i) => {
            const isVisible = i >= (10 - healthLevel);
            icon.style.opacity = isVisible ? '1' : '0.2';
            icon.style.filter = isVisible ? 'none' : 'grayscale(1)';
        });

        this.bubbleIcons.forEach((icon, i) => {
            const isVisible = i >= (10 - airLevel);
            icon.style.opacity = isVisible ? '1' : '0';
        });
    }
}
