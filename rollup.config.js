import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

function injectVersion() {
  const id = 'virtual:card-version';
  return {
    name: 'inject-version',
    resolveId(src) { return src === id ? id : null; },
    load(id_) { return id_ === id ? `export const CARD_VERSION = '${version}';` : null; },
  };
}

export default {
  input: 'src/recipe-manager-card.js',
  output: {
    file: 'recipe-manager-card.js',
    format: 'es',
  },
  plugins: [
    injectVersion(),
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    terser({
      ecma: 2021,
      module: true,
    }),
  ],
};