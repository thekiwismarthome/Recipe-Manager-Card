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
  input: {
    'recipe-manager-card': 'src/recipe-manager-card.js',
    'locales/de': 'src/locales/de.js',
    'locales/es': 'src/locales/es.js',
    'locales/fr': 'src/locales/fr.js',
    'locales/it': 'src/locales/it.js',
    'locales/nl': 'src/locales/nl.js',
    'locales/pt': 'src/locales/pt.js',
  },
  output: {
    dir: '.',
    format: 'es',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunks/[name]-[hash].js',
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