import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { adapters, listAdapters } from '@apex-nexus/shared';
import Fastify from 'fastify';
import { z } from 'zod';
import { env } from './lib/env';

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
await server.register(helmet, { contentSecurityPolicy: false });

server.get('/health', async () => {
  return { status: 'ok', service: 'api', time: new Date().toISOString() };
});

server.get('/exchanges', async () => {
  return { exchanges: listAdapters() };
});

server.get('/markets/:exchange', async (req, reply) => {
  const params = z.object({ exchange: z.string() }).parse(req.params as any);
  const adapter = adapters[params.exchange];
  if (!adapter) return reply.code(404).send({ error: 'Unknown exchange' });
  const markets = await adapter.getMarkets();
  return { exchange: adapter.name, markets };
});

server.post('/orders', async (req, reply) => {
  const body = z
    .object({
      exchange: z.enum(['coinbase', 'metamask', 'etoro', 'plus500']),
      symbol: z.string(),
      side: z.enum(['buy', 'sell']),
      quantity: z.number().positive(),
      price: z.number().positive().optional(),
      clientWalletUrl: z.string().url().optional(),
      paper: z.boolean().default(true)
    })
    .parse(req.body as any);

  const adapter = adapters[body.exchange];
  if (!adapter) return reply.code(400).send({ error: 'Unknown exchange' });

  const res = await adapter.placeOrder(body as any);
  return res;
});

let preferredWalletUrl: string | undefined;

server.post('/wallet/connect', async (req) => {
  const body = z.object({ url: z.string().url() }).parse(req.body as any);
  preferredWalletUrl = body.url;
  return { ok: true, preferredWalletUrl };
});

server.get('/wallet/connect', async () => {
  return { preferredWalletUrl: preferredWalletUrl ?? null };
});

const port = env.PORT ?? 4000;
const host = env.HOST ?? '0.0.0.0';

server
  .listen({ port, host })
  .then(() => {
    server.log.info('API listening on http://' + host + ':' + port.toString());
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
