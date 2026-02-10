import { Platform, PlatformType } from './Platform';

export class PlatformManager {
    platforms: Platform[] = [];
    private canvasWidth: number;
    private canvasHeight: number;
    private currentFloorIndex: number = 0;
    private passedFloors: number = 0; // Floors that have scrolled off screen

    private readonly SPACING_Y = 85;

    constructor(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.initPlatforms();
    }

    private initPlatforms() {
        this.platforms = [];
        this.currentFloorIndex = 0;
        this.passedFloors = 0;

        const firstY = this.canvasHeight - 100; // Start near bottom
        const firstWidth = 100;
        const firstX = (this.canvasWidth - firstWidth) / 2;

        this.platforms.push(new Platform(firstX, firstY, firstWidth, 20, 'normal', this.currentFloorIndex));
        this.currentFloorIndex++;

        for (let i = 1; i <= 6; i++) {
            this.spawnPlatformSafe(firstY + i * this.SPACING_Y, i < 3);
        }
    }

    private spawnPlatform(y: number) {
        this.spawnPlatformSafe(y, false);
    }

    private spawnPlatformSafe(y: number, forceNormal: boolean) {
        if (!forceNormal && Math.random() < 0.2) {
            return;
        }

        const width = 100;
        const height = 20;
        const x = Math.random() * (this.canvasWidth - width);

        let type: PlatformType = 'normal';
        if (!forceNormal) {
            const r = Math.random();
            if (r > 0.8) type = 'spike';
            else if (r > 0.6) type = 'conveyor_left';
            else if (r > 0.4) type = 'conveyor_right';
        }

        this.platforms.push(new Platform(x, y, width, height, type, this.currentFloorIndex));
        this.currentFloorIndex++;
    }

    update(dt: number) {
        for (const p of this.platforms) {
            p.update(dt);
        }

        // Count platforms that are about to be removed (scrolled off top)
        const beforeCount = this.platforms.length;
        this.platforms = this.platforms.filter(p => p.y > -50);
        const removedCount = beforeCount - this.platforms.length;
        this.passedFloors += removedCount;

        this.spawnCheck();
    }

    private spawnCheck() {
        let maxY = -Infinity;
        for (const p of this.platforms) {
            if (p.y > maxY) maxY = p.y;
        }

        if (maxY < this.canvasHeight + 50) {
            this.spawnPlatform(maxY + this.SPACING_Y);
        }
    }

    draw(ctx: CanvasRenderingContext2D, time: number) {
        for (const p of this.platforms) {
            p.draw(ctx, time);
        }
    }

    getMaxFloorIndex(): number {
        // Return passed floors (floors that have scrolled off screen)
        return this.passedFloors;
    }
}
