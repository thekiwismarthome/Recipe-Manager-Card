import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, scaleAmount } from '../src/services/ingredient-amount.js';

test('parse whole, decimal, ASCII, Unicode and mixed quantities', () => {
  for (const [input, expected] of [
    ['2', 2], ['0.25', 0.25], ['.125', 0.125], ['1/2', 0.5],
    ['1/4', 0.25], ['1/8', 0.125], ['1 1/2', 1.5],
    ['½', 0.5], ['1½', 1.5], ['1 ½', 1.5], ['1⁄2', 0.5],
    ['⅓', 1/3], ['0', 0], [2, 2], ['5e-8', 5e-8],
  ]) assert.equal(parseAmount(input), expected, String(input));
});

test('preserve original notation at normal serving size', () => {
  for (const input of ['1/2', '½', '1 1/2', '0.25', '1/8', '2', '0'])
    assert.equal(scaleAmount(input, 1), input);
});

test('scale fractions without one-decimal rounding', () => {
  for (const [input, multiplier, expected] of [
    ['1/2', 2, '1'], ['1/4', 2, '0.5'], ['1/8', 2, '0.25'],
    ['1 1/2', 2, '3'], ['½', 0.25, '0.125'],
    ['0.25', 0.25, '0.0625'], ['1', 0.75, '0.75'],
    ['⅓', 3, '1'], ['0.0000001', 0.5, '5e-8'],
  ]) assert.equal(scaleAmount(input, multiplier), expected);
});

test('never truncate unsupported quantities or invalid fractions', () => {
  for (const input of ['', 'to taste', '1-2', '2 heaped', '1/0', '1/2 extra', null]) {
    assert.equal(parseAmount(input), null);
    assert.equal(scaleAmount(input, 2), input);
  }
});
