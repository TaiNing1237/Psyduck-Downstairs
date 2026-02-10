import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'popup.html'),
                game: resolve(__dirname, 'game.html'),
                background: resolve(__dirname, 'src/background.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        },
        outDir: 'dist',
        emptyOutDir: true
    },
    plugins: [
        {
            name: 'copy-manifest',
            closeBundle() {
                copyFileSync('manifest.json', 'dist/manifest.json');
            }
        }
    ]
});
