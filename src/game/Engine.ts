import { Player } from './Player';
import { PlatformManager } from './PlatformManager';

export class Engine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private isPlaying: boolean = false;
    private player: Player;
    private platformManager: PlatformManager;
    private scoreDepth: number = 0;
    private lastDamageTime: number = 0;
    private isGameOver: boolean = false;
    private showGameOverUI: boolean = false;

    // Input state
    private keys: { [key: string]: boolean } = {};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get 2D context');
        this.ctx = context;

        this.resize();

        // Initialize PlatformManager first so we can get starting platform position
        this.platformManager = new PlatformManager(this.canvas.width, this.canvas.height);

        // Initialize Player on top of the first platform (centered)
        const startPlatform = this.platformManager.platforms[0];
        const playerX = startPlatform.x + (startPlatform.width - 30) / 2;
        const playerY = startPlatform.y - 30; // On top of platform
        this.player = new Player(playerX, playerY);
    }

    private resize() {
        this.canvas.width = 400;
        this.canvas.height = 600;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastTime = performance.now();
        this.setupInput();
        requestAnimationFrame((time) => this.loop(time));
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // Restart game on any key if Game Over UI is shown
            if (this.showGameOverUI) {
                location.reload();
            }
        });
        window.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
    }

    private update(dt: number) {
        // limit dt to avoid huge jumps if lag happens
        if (dt > 0.1) dt = 0.1;

        this.platformManager.update(dt);

        // Update Score (Depth)
        // In this game, score usually increases as we survey deeper. 
        // Simple metric: time survived? Or platforms passed?
        // Let's use "Floors passed" or just generic depth counter increased by time/speed.
        // For now, let's just increment score based on time for simplicity, or we can count platforms left top.
        this.scoreDepth += 100 * dt; // Match platform speed
        this.updateHUD();

        // Process Input
        if (this.keys['ArrowLeft']) this.player.moveRelative(-1);
        else if (this.keys['ArrowRight']) this.player.moveRelative(1);
        else this.player.moveRelative(0);

        if (this.keys['ArrowUp']) this.player.jump();

        this.player.update(dt);

        // --- Collision & Physics ---
        this.player.isGrounded = false;
        let onSpike = false;

        // Naive collision loop (Platforms)
        for (const platform of this.platformManager.platforms) {
            // 1. Landing on top
            const playerBottom = this.player.y + this.player.height;
            const platformTop = platform.y;

            // Check horizontal overlap first
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width) {

                // Landing logic (Falling)
                if (
                    this.player.vy >= 0 &&
                    playerBottom >= platformTop &&
                    playerBottom <= platformTop + 20 // Tolerance
                ) {
                    this.player.isGrounded = true;
                    this.player.vy = 0;
                    this.player.y = platformTop - this.player.height;

                    // Platform effects (Conveyor/Spike)
                    if (platform.type === 'conveyor_left') this.player.x -= 200 * dt;
                    else if (platform.type === 'conveyor_right') this.player.x += 200 * dt;
                    else if (platform.type === 'spike') onSpike = true;
                }

                // Head Bonk Logic (Jumping Up)
                // If player top hits platform bottom
                const platformBottom = platform.y + platform.height;
                if (
                    this.player.vy < 0 && // Moving up
                    this.player.y <= platformBottom &&
                    this.player.y >= platformBottom - 20 // Tolerance
                ) {
                    this.player.vy = 0; // Bonk!
                    this.player.y = platformBottom;
                }
            }
        }

        // Handle Spike Damage (Continuous or Instant?)
        // Standard game: standing on spike hurts.
        if (onSpike) {
            this.takeDamage(1); // Maybe frame-limited? 
            // Better: invulnerability frames.
            this.player.vy = -500; // Small hop from pain
        }

        // --- Boundaries ---
        // Walls
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) this.player.x = this.canvas.width - this.player.width;

        // Ceiling (Death)
        // Ceiling (Damage)
        if (this.player.y < 0) { // Top of screen
            this.takeDamage(1); // Small damage
            this.player.vy = 200; // Push down
        }

        // Floor (Fall Death)
        if (this.player.y > this.canvas.height) {
            this.takeDamage(5); // Instakill
        }
    }

    // Add Score and HUD methods
    private takeDamage(amount: number) {
        const now = performance.now();
        if (now - this.lastDamageTime < 250) return; // 0.25 sec iframe (reduced)

        this.player.hp -= amount;
        this.lastDamageTime = now;

        if (this.player.hp <= 0) {
            this.gameOver();
        } else {
            this.player.setHurt(1000); // 1.0s hurt animation
        }
    }

    private gameOver() {
        if (this.isGameOver) return; // Prevent multiple calls
        this.isGameOver = true;
        this.player.hp = 0; // Ensure dead state
        this.player.state = 'dead'; // Force animation state update

        // Show UI after 500ms
        setTimeout(() => {
            this.showGameOverUI = true;
            // Removed alert and auto-reload. Now waits for user input.
        }, 500);
    }

    private updateHUD() {
        const hpEl = document.getElementById('hp');
        const scoreEl = document.getElementById('score');
        if (hpEl) {
            const hearts = '♥'.repeat(Math.max(0, this.player.hp));
            hpEl.innerText = hearts;
        }
        if (scoreEl) {
            // Use PlatformManager's max index
            const floor = this.platformManager.getMaxFloorIndex();
            scoreEl.innerText = `FLOOR: ${floor}`;
        }
    }

    private draw() {
        // Clear screen
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.platformManager.draw(this.ctx, this.lastTime);
        this.player.draw(this.ctx);

        // Draw Ceiling Spikes
        this.ctx.fillStyle = '#C0C0C0'; // Silver
        const spikeWidth = 20;
        const spikeHeight = 15;
        const spikeCount = Math.ceil(this.canvas.width / spikeWidth);

        this.ctx.beginPath();
        for (let i = 0; i < spikeCount; i++) {
            const x = i * spikeWidth;
            const y = 0;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + spikeWidth / 2, y + spikeHeight);
            this.ctx.lineTo(x + spikeWidth, y);
        }
        this.ctx.fill();

        // Draw Game Over UI
        if (this.showGameOverUI) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700'; // Gold/Yellow
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

            this.ctx.fillStyle = '#CCC'; // Gray
            this.ctx.font = '24px Arial';
            const floor = this.platformManager.getMaxFloorIndex();
            this.ctx.fillText(`FLOOR: ${floor}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('Press any key to restart', this.canvas.width / 2, this.canvas.height / 2 + 70);
            this.ctx.restore();
        }
    }

    private loop(time: number) {
        if (!this.isPlaying) return;

        const dt = (time - this.lastTime) / 1000; // seconds
        this.lastTime = time;

        // Only update game logic if not game over
        if (!this.isGameOver) {
            this.update(dt);
        }

        // Always draw (so death animation shows)
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
