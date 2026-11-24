// Parse complete ingredient quantities without silently truncating fractions or ranges.
const VULGAR_FRACTIONS = {
  '¼': '1/4', '½': '1/2', '¾': '3/4', '⅐': '1/7', '⅑': '1/9',
  '⅒': '1/10', '⅓': '1/3', '⅔': '2/3', '⅕': '1/5', '⅖': '2/5',
  '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8',
  '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

export function parseAmount(amount) {
  if (typeof amount !== 'string' && typeof amount !== 'number') return null;
  const value = String(amount).trim()
    .replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, c => ' ' + VULGAR_FRACTIONS[c])
    .replace(/⁄/g, '/').trim();
  const fraction = value.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[3]);
    const result = Number(fraction[1] || 0) + Number(fraction[2]) / denominator;
    return denominator && Number.isFinite(result) ? result : null;
  }
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export function scaleAmount(amount, multiplier) {
  const value = parseAmount(amount);
  if (value === null || multiplier === 1) return amount;
  const scaled = value * multiplier;
  return Number.isFinite(scaled) ? String(Number(scaled.toPrecision(12))) : amount;
}
