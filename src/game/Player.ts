export type PlayerState = 'idle' | 'walk' | 'jump' | 'sleep' | 'hurt' | 'dead';

export class Player {
    x: number;
    y: number;
    width: number = 24;
    height: number = 40;
    vx: number = 0;
    vy: number = 0;
    isGrounded: boolean = false;
    hp: number = 5;
    color: string = '#FFD700';

    // State
    state: PlayerState = 'idle';
    facingLeft: boolean = true;
    idleTime: number = 0;

    // Animation
    private sprites: { [key: string]: HTMLImageElement } = {};
    private frameTime: number = 0;
    private walkFrameIndex: number = 0;
    private readonly WALK_SEQUENCE = [1, 2, 3, 2];
    private blinkTimer: number = 0;
    private isBlinking: boolean = false;

    // Physics constants
    private readonly GRAVITY_ACCEL = 1200;
    private readonly JUMP_VELOCITY = -600;
    private readonly MOVE_SPEED = 300;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.loadSprites();
    }

    private loadSprites() {
        const names = ['idle', 'walk-1', 'walk-2', 'walk-3', 'jump', 'hurt', 'gameover', 'sleep'];
        names.forEach(name => {
            const img = new Image();
            img.src = chrome.runtime?.getURL ? chrome.runtime.getURL(`sprites/${name}.png`) : `/sprites/${name}.png`;
            this.sprites[name] = img;
        });
    }

    update(dt: number) {
        if (this.state === 'dead') return;

        this.vy += this.GRAVITY_ACCEL * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.updateState(dt);

        if (this.state === 'idle') {
            this.blinkTimer -= dt;
            if (this.blinkTimer <= 0) {
                this.isBlinking = !this.isBlinking;
                this.blinkTimer = this.isBlinking ? 0.15 : (Math.random() * 3 + 2);
            }
        } else {
            this.isBlinking = false;
        }
    }

    moveRelative(dir: number) {
        if (this.state === 'dead') return;

        this.vx = dir * this.MOVE_SPEED;

        if (dir !== 0) {
            this.facingLeft = (dir < 0);
            this.idleTime = 0;
        }
    }

    jump() {
        if (this.state === 'dead') return;

        if (this.isGrounded) {
            this.vy = this.JUMP_VELOCITY;
            this.isGrounded = false;
            this.idleTime = 0;
        }
    }

    private updateState(dt: number) {
        if (this.hp <= 0) {
            this.state = 'dead';
            return;
        }

        if (this.state === 'hurt') {
            return;
        }

        if (!this.isGrounded) {
            this.state = 'jump';
            return;
        }

        if (Math.abs(this.vx) > 10) {
            this.state = 'walk';
            this.frameTime += dt;
            if (this.frameTime > 0.15) {
                this.walkFrameIndex = (this.walkFrameIndex + 1) % this.WALK_SEQUENCE.length;
                this.frameTime = 0;
            }
        } else {
            if (this.state !== 'idle' && this.state !== 'sleep') {
                this.state = 'idle';
                this.idleTime = 0;
            }
            if (this.state === 'idle') {
                this.idleTime += dt;
                if (this.idleTime > 2.0) {
                    this.state = 'sleep';
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        const drawX = this.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        if (!this.facingLeft) {
            ctx.scale(-1, 1);
        }

        let img = this.sprites['idle'];

        if (this.state === 'jump') img = this.sprites['jump'];
        else if (this.state === 'hurt') img = this.sprites['hurt'];
        else if (this.state === 'dead') img = this.sprites['gameover'];
        else if (this.state === 'sleep') img = this.sprites['sleep'];
        else if (this.state === 'walk') {
            const frame = this.WALK_SEQUENCE[this.walkFrameIndex];
            img = this.sprites[`walk-${frame}`];
        } else if (this.state === 'idle') {
            if (this.isBlinking) {
                img = this.sprites['sleep'];
            }
        }

        if (img && img.complete) {
            // Draw at fixed 40x40 size (original hitbox size)
            ctx.drawImage(img, -20, -20, 40, 40);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-20, -20, 40, 40);
        }

        ctx.restore();
    }

    setHurt(duration: number = 1000) {
        if (this.state === 'dead') return;

        this.state = 'hurt';
        setTimeout(() => {
            // Only revert if we are still hurt (and not dead)
            if (this.state === 'hurt' && this.hp > 0) {
                this.state = 'idle';
                this.idleTime = 0;
            }
        }, duration);
    }
}
