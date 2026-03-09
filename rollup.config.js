import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/recipe-manager-card.js',
  output: {
    file: 'recipe-manager-card.js',
    format: 'es',
  },
  plugins: [
    resolve(),
    commonjs(),
    terser({
      ecma: 2021,
      module: true,
    }),
  ],
};