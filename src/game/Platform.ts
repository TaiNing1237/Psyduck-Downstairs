export type PlatformType = 'normal' | 'spike' | 'conveyor_left' | 'conveyor_right';

export class Platform {
    x: number;
    y: number;
    width: number;
    height: number;
    type: PlatformType;
    floorIndex: number;

    // Constant upward speed for the game loop "scroll" effect
    // But typically in "Down Stairs", the CAMERA follows the player or platforms move UP.
    // Let's implement platforms moving UP.
    readonly SPEED_UP = 100; // pixels per second (faster)

    constructor(x: number, y: number, width: number, height: number, type: PlatformType, floorIndex: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.floorIndex = floorIndex;
    }

    update(dt: number) {
        this.y -= this.SPEED_UP * dt;
    }

    draw(ctx: CanvasRenderingContext2D, time: number) {
        // Draw base platform
        if (this.type === 'normal') {
            ctx.fillStyle = '#8B4513'; // Brown
        } else if (this.type === 'spike') {
            ctx.fillStyle = '#800000'; // Dark Red
        } else if (this.type.startsWith('conveyor')) {
            ctx.fillStyle = '#708090'; // Slate Gray
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Visual details
        if (this.type === 'spike') {
            // Draw spikes on top
            ctx.fillStyle = '#C0C0C0'; // Silver
            const spikeWidth = 10;
            const spikeCount = Math.floor(this.width / spikeWidth);
            ctx.beginPath();
            for (let i = 0; i < spikeCount; i++) {
                const sx = this.x + i * spikeWidth;
                const sy = this.y;
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + spikeWidth / 2, sy - 10);
                ctx.lineTo(sx + spikeWidth, sy);
            }
            ctx.fill();
        } else if (this.type.startsWith('conveyor')) {
            // Animated Conveyor Belts (Tank tread style)
            ctx.fillStyle = '#333';
            const treadWidth = 10;
            const speed = 0.1;
            // Direction multiplier
            const dir = this.type === 'conveyor_left' ? -1 : 1;

            // Offset based on time
            const offset = (time * speed * dir) % (2 * treadWidth);

            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();

            for (let tx = this.x + offset - 20; tx < this.x + this.width + 20; tx += treadWidth * 2) {
                ctx.fillRect(tx, this.y, treadWidth, this.height);
            }
            ctx.restore();

            // Wheels effect (circles at bottom)
            ctx.fillStyle = '#000';
            for (let wx = this.x + 5; wx < this.x + this.width; wx += 20) {
                ctx.beginPath();
                ctx.arc(wx, this.y + this.height, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
