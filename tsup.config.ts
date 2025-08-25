import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  dts: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs'
    };
  },
  external: ['react', 'react-dom']
});