import { adapters } from '@apex-nexus/shared';
import { expect, test } from 'vitest';

test('coinbase adapter exists', () => {
  expect(adapters.coinbase.name).toBe('coinbase');
});
