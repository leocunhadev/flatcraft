export class InputManager {
    public pressedKeys: Set<string> = new Set();
    public lastMouseBufferX: number = 0;
    public lastMouseBufferY: number = 0;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.init();
    }

    private init() {
        window.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.code);
        });
        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.code);
        });

        // Blur safety
        window.addEventListener('blur', () => {
            this.pressedKeys.clear();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.lastMouseBufferX = mouseX * scaleX;
            this.lastMouseBufferY = mouseY * scaleY;
        });
    }

    public isShiftPressed(): boolean {
        return this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
    }

    public getDirection(): { dx: number, dy: number } {
        let dx = 0;
        let dy = 0;
        if (this.pressedKeys.has('ArrowUp') || this.pressedKeys.has('KeyW')) dy -= 1;
        if (this.pressedKeys.has('ArrowDown') || this.pressedKeys.has('KeyS')) dy += 1;
        if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) dx -= 1;
        if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) dx += 1;
        return { dx, dy };
    }

    public isEatPressed(): boolean {
        return this.pressedKeys.has('KeyE');
    }
}
