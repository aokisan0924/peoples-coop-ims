import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            outDir: 'public',
            filename: 'sw.js',
            workbox: {
                globPatterns: ['**/*.{js,css,woff2}'],
                globDirectory: 'public/build',
                modifyURLPrefix: {
                    '': '/build/', // precached files live under public/build/, but are served at /build/... — fix the URL mismatch
                },
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: ({ url, request }) =>
                            request.mode === 'navigate' && url.pathname === '/pos',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pos-page-cache',
                            networkTimeoutSeconds: 3,
                            expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                ],
            },
            manifest: false,
        }),
    ],
});
