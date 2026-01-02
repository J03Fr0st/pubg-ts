# Development Guide - pubg-ts

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | >= 18.0.0 | Runtime environment |
| npm | >= 8.0.0 | Package management |
| Git | Latest | Version control |

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/J03Fr0st/pubg-ts.git
cd pubg-ts

# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Setup

Create a `.env` file for testing (optional):
```env
PUBG_API_KEY=your-api-key-here
DEBUG=pubg-ts:*
```

## Development Commands

### Build & Development

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Run with ts-node (development) |
| `npm run prepare` | Set up Husky pre-commit hooks |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (191 tests) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Lint code with Biome |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Biome |
| `npm run check` | Run both lint and format checks |
| `npm run check:fix` | Fix both lint and format issues |

### Documentation

| Command | Description |
|---------|-------------|
| `npm run generate:docs` | Generate TypeDoc API documentation |
| `npm run generate:types` | Generate types from OpenAPI spec |

### Production Readiness

| Command | Description |
|---------|-------------|
| `npm run security:audit` | Run security vulnerability scan |
| `npm run security:check` | Run npm audit + custom checks |
| `npm run perf:test` | Run performance testing |
| `npm run health:check` | Check system health status |

## Project Architecture

### Directory Structure

```
src/
├── api/           # API layer (client, http-client, services)
├── types/         # TypeScript type definitions
├── errors/        # Custom error classes
├── utils/         # Utilities (cache, rate-limiter, etc.)
└── assets/        # Synced PUBG asset data
```

### Key Design Patterns

1. **Service Pattern**: Each API domain has its own service class
2. **Facade Pattern**: `PubgClient` provides unified interface
3. **Dependency Injection**: Services receive `HttpClient` and config
4. **Caching Layer**: Transparent caching with configurable TTL
5. **Rate Limiting**: Built-in rate limiting (10 req/min default)

## Testing Strategy

### Test Organization

```
tests/
├── unit/              # Individual component tests
│   ├── client.test.ts
│   ├── services/      # Service tests
│   └── ...
├── integration/       # E2E API tests
├── __mocks__/         # Test doubles
└── setup.ts           # Jest configuration
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- tests/unit/client.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="PubgClient"

# Run with verbose output
npm test -- --verbose
```

### Writing Tests

Follow the existing patterns:
- Use Jest with TypeScript (`ts-jest`)
- Mock axios in `tests/__mocks__/axios.ts`
- Common setup in `tests/setup.ts`

## Code Style

### Biome Configuration

The project uses Biome for linting and formatting:
- Configuration: `biome.json`
- Auto-fixes on commit via lint-staged

### Commit Conventions

Pre-commit hooks enforce:
- Biome lint and format checks
- Related tests must pass

### TypeScript Standards

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- No implicit any

## Debug Logging

Enable debug logging:
```bash
DEBUG=pubg-ts:* npm run dev
```

Available namespaces:
- `pubg-ts:http` - HTTP requests/responses
- `pubg-ts:cache` - Cache operations
- `pubg-ts:rate-limit` - Rate limiting events
- `pubg-ts:client` - Client operations
- `pubg-ts:error` - Error handling
- `pubg-ts:monitoring` - Metrics collection
- `pubg-ts:security` - Security validation

## Asset Synchronization

### Syncing Assets

```bash
npm run sync-assets
```

This downloads from the official PUBG repository:
- Season data
- Item/vehicle/map dictionaries
- Survival titles

### Auto-sync

Assets are automatically synced during build via `prebuild` hook.

## Release Process

### Changesets

The project uses Changesets for versioning:

```bash
# Create a changeset
npm run changeset

# Version packages
npm run changeset:version

# Publish to npm
npm run release
```

### Publishing

```bash
npm run prepublishOnly  # Runs build
npm publish             # Publish to npm
```

## Troubleshooting

### Common Issues

**Tests failing with axios errors:**
- Ensure `tests/__mocks__/axios.ts` is present
- Check mock implementation matches expected interface

**Build errors:**
- Run `npm run check:fix` to fix lint issues
- Verify TypeScript version compatibility

**Asset sync fails:**
- Check network connectivity
- Verify PUBG repository is accessible
- Try manual sync: `npx ts-node scripts/sync-assets.ts`

### Getting Help

- [GitHub Issues](https://github.com/J03Fr0st/pubg-ts/issues)
- Debug with `DEBUG=pubg-ts:*` environment variable
