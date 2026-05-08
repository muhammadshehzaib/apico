import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/tests/setup.ts'],
        include: ['./src/tests/**/*.test.ts'],
        pool: 'threads',
        fileParallelism: false,
        testTimeout: 30000,
        hookTimeout: 30000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/tests/**', 'src/**/*.d.ts', 'src/types/**', 'src/config/**'],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 50,
                statements: 60,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
