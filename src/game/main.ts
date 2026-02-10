import { Engine } from './Engine';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
        const engine = new Engine(canvas);
        engine.start();
    }
});
