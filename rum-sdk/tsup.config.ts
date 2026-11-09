import { defineConfig } from 'tsup';

export default defineConfig([
  // npm consumers: ESM + CJS with type definitions
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2019',
    outDir: 'dist',
  },
  // <script> tag consumers: exposes window.WebVizion
  {
    entry: { 'webvizion.min': 'src/index.ts' },
    format: ['iife'],
    globalName: 'WebVizion',
    minify: true,
    sourcemap: true,
    target: 'es2017',
    outDir: 'dist',
  },
]);
