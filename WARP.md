# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Apex_Nexus is a crypto trading bot platform with:
- Monorepo structure using pnpm workspaces
- TypeScript-based architecture  
- Support for multiple exchange adapters (Coinbase, MetaMask, eToro, Plus500)
- Paper trading capabilities for testing strategies

## Architecture

### Monorepo Layout
- **apps/**: Application services
  - `api/`: Fastify-based REST API server
- **packages/**: Shared libraries and tools
  - `shared/`: Core types and exchange adapters
  - `bot/`: CLI trading bot

### Package Dependencies
- `@apex-nexus/api` → depends on `@apex-nexus/shared`
- `@apex-nexus/bot` → depends on `@apex-nexus/shared`
- All packages use workspace protocol (`workspace:*`) for internal dependencies

### Exchange Adapter System
The platform uses a unified `ExchangeAdapter` interface defined in `packages/shared/src/types.ts`:
- Each adapter implements `getMarkets()` and `placeOrder()` methods
- Paper trading is handled via the same interface with a `paper: boolean` flag
- Current implementations are scaffolds - real trading not yet implemented

### API Endpoints
- `GET /health` - Service health check
- `GET /exchanges` - List available exchanges
- `GET /markets/:exchange` - Get markets for specific exchange
- `POST /orders` - Place trading orders
- `POST /wallet/connect` - Connect wallet URL
- `GET /wallet/connect` - Get connected wallet status

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Run all apps in parallel development mode
pnpm dev

# Run specific workspace in dev mode
pnpm --filter @apex-nexus/api dev
pnpm --filter @apex-nexus/bot dev
```

### Building
```bash
# Build all workspaces
pnpm build

# Build specific workspace
pnpm --filter @apex-nexus/api build
```

### Testing
```bash
# Run all tests
pnpm test

# Watch mode for tests
pnpm test:watch

# Run tests for specific workspace
pnpm --filter @apex-nexus/shared test

# Run specific test file
pnpm vitest run path/to/test.file.ts
```

### Code Quality
```bash
# Lint all workspaces
pnpm lint

# Check formatting
pnpm format

# Fix formatting
pnpm format:write

# Type checking
pnpm typecheck
```

### Running Applications
```bash
# Start API server
pnpm --filter @apex-nexus/api start

# Run bot CLI
pnpm --filter @apex-nexus/bot start

# Bot CLI with options
pnpm --filter @apex-nexus/bot start -- --exchange coinbase --symbol BTC-USD --paper
```

### Cleanup
```bash
# Clean build artifacts
pnpm clean
```

## Development Setup

### Requirements
- Node.js ≥ 20.9.0
- pnpm 9.12.0 (use `corepack enable` if needed)
- TypeScript 5.9.3

### Tools & Configuration
- **Testing**: Vitest with Node environment
- **Bundling**: tsup for ESM builds
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier (semicolons, single quotes, trailing commas, 100 char width)
- **Module System**: ESM (`"type": "module"` in all packages)

### Environment Variables
The API uses these optional environment variables (see `apps/api/src/lib/env.ts`):
- `NODE_ENV` - Development/production mode (default: "development")
- `PORT` - API server port (default: 4000)
- `HOST` - API server host (default: "0.0.0.0")

## Testing
- Test files use patterns: `*.test.ts` or `*.spec.ts`
- Vitest configuration is at root level in `vitest.config.ts`
- Tests can be run from root or within specific workspaces
- Each package has its own test scripts

## Key Files
- `packages/shared/src/types.ts` - Core type definitions for orders, exchanges, and adapters
- `packages/shared/src/adapters/exchanges.ts` - Exchange adapter implementations
- `packages/bot/src/cli.ts` - Bot CLI entry point with yargs configuration
- `apps/api/src/index.ts` - API server entry point with Fastify routes
- `apps/api/src/lib/env.ts` - Environment variable validation with Zod
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `tsconfig.base.json` - Base TypeScript configuration inherited by all packages