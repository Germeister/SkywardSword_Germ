import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import generateFile from 'vite-plugin-generate-file';
import sassDts from 'vite-plugin-sass-dts';
import makeManifest from './manifest.js';

// It'd be really nice to have polyfills actually working in Vite,
// but Vite can't polyfill the code in web workers so why bother
// https://github.com/vitejs/vite/issues/15990
/*
import browserslist from 'browserslist';
import legacy from '@vitejs/plugin-legacy';
import packageJson from './package.json';


const polyfills = legacy({
    modernTargets: browserslist(packageJson.browserslist),
    modernPolyfills: true,
    renderLegacyChunks: false,
});
*/

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    const baseUrl = isProd ? '/SS-Randomizer-Tracker' : '/';

    return {
        base: baseUrl,
        build: {
            outDir: 'build',
        },
        define: {
            // Keep in sync with global.d.ts
            $PUBLIC_URL: JSON.stringify(baseUrl),
            $FEATURE_FLAG_HINTS_PARSER: JSON.stringify(!isProd),
            $DEBUG_PRINTS: JSON.stringify(mode === 'development'),
            $FATAL_APPERROR: JSON.stringify(mode === 'test'),
        },
        plugins: [
            sassDts({
                prettierFilePath: './.prettierrc.json',
            }),
            react(),
            generateFile({
                output: 'manifest.json',
                type: 'json',
                data: makeManifest(baseUrl),
            }),
        ],
        test: {
            coverage: {
                include: ['src/'],
                provider: 'v8',
            },
            setupFiles: ['@vitest/web-worker'],
            globals: true,
            environment: 'jsdom',
        },
    };
});
