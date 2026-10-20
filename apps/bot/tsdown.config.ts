import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  target: 'es2022',
  format: 'esm',
  dts: false,
  minify: true,
  skipNodeModulesBundle: true,
  external: [/^@repo\//],
  ignoreWatch: ['**/node_modules/**', '**/.git/**'],
});
