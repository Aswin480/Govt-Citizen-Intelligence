import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        visualizer({
            open: false,
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
                secure: false,
            },
            '/nlp': {
                target: 'http://127.0.0.1:8001',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/nlp/, ''); },
                secure: false,
            },
            '/parli': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/parli/, ''); },
                secure: false,
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return;
                    if (id.includes('/react') || id.includes('/react-dom') || id.includes('/@tanstack/react-query')) {
                        return 'react-vendor';
                    }
                    if (id.includes('/axios')) {
                        return 'network-vendor';
                    }
                    if (id.includes('/lodash')) {
                        return 'lodash-vendor';
                    }
                    if (id.includes('/date-fns')) {
                        return 'date-fns-vendor';
                    }
                    if (id.includes('/recharts') || id.includes('/chart.js') || id.includes('/d3') || id.includes('/victory')) {
                        return 'charts-vendor';
                    }
                    if (id.includes('/react-leaflet') || id.includes('/leaflet')) {
                        return 'map-vendor';
                    }
                    return 'vendor';
                }
            }
        }
    }
});
