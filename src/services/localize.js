/**
 * Runtime locale configuration for @lit/localize.
 * Locale modules under src/locales/ and src/locale-codes.js are generated
 * by `npx lit-localize build` (see lit-localize.json) — do not hand-edit them.
 */
import { configureLocalization } from '@lit/localize';
import { sourceLocale, targetLocales, allLocales } from '../locale-codes.js';

export { sourceLocale, targetLocales, allLocales };

const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  // Path is relative to the built bundle's own location (repo root / HA
  // www/ dir), not this source file's location — the build emits
  // recipe-manager-card.js and locales/*.js as siblings (see rollup.config.js).
  loadLocale: locale => import(`./locales/${locale}.js`),
});

export { getLocale };

export async function setActiveLocale(code) {
  const next = allLocales.includes(code) ? code : sourceLocale;
  if (next === getLocale()) return;
  await setLocale(next);
}
