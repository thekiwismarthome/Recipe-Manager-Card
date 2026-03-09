import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/recipe-manager-card.js',
  output: {
    file: 'recipe-manager-card.js',
    format: 'es',
    sourcemap: false
  },
  plugins: [resolve({ browser: true }), commonjs(), terser()]
  plugins: [
    resolve(),
    commonjs(),
    terser({
      ecma: 2021,
      module: true,
    }),
  ],
};
