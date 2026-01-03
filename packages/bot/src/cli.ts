#!/usr/bin/env node
import { adapters } from '@apex-nexus/shared';
import type { OrderRequest } from '@apex-nexus/shared';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = await yargs(hideBin(process.argv))
  .scriptName('apex-bot')
  .option('exchange', {
    type: 'string',
    default: 'coinbase',
    choices: ['coinbase', 'metamask', 'etoro', 'plus500']
  })
  .option('strategy', { type: 'string', default: 'demo' })
  .option('paper', { type: 'boolean', default: true })
  .option('symbol', { type: 'string', default: 'BTC-USD' })
  .option('client-wallet-url', { type: 'string' })
  .help()
  .parse();

const exchangeName = (argv as any).exchange as string;
const adapter = (adapters as any)[exchangeName];

if (!adapter) {
  console.error('Unknown exchange: ' + exchangeName);
  process.exit(1);
}

const markets = await adapter.getMarkets();
console.log('[bot] ' + adapter.name + ' markets: ' + markets.join(', '));

if ((argv as any).strategy === 'demo') {
  const order: OrderRequest = {
    exchange: adapter.name,
    symbol: (argv as any).symbol as string,
    side: 'buy',
    quantity: 0.001,
    clientWalletUrl: (argv as any)['client-wallet-url'] as string | undefined,
    paper: Boolean((argv as any).paper)
  };

  const res = await adapter.placeOrder(order);
  console.log('[bot] demo strategy order result:', res);
} else {
  console.error('Strategy not implemented: ' + (argv as any).strategy);
  process.exit(1);
}
