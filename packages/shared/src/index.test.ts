import { expect, test } from 'vitest';
import { adapters, listAdapters } from './adapters/exchanges';

test('adapters expose expected names', () => {
  expect(listAdapters().sort()).toEqual(['coinbase', 'etoro', 'metamask', 'plus500'].sort());
  expect(adapters.coinbase.name).toBe('coinbase');
});
