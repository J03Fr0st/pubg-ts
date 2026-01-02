# Source Tree Analysis - pubg-ts

## Project Structure Overview

**Repository Type:** Monolith
**Project Type:** TypeScript SDK/API Wrapper
**Primary Tech:** TypeScript + Node.js

## Directory Tree

```
pubg-ts/
├── src/                         # Main source code (36 files)
│   ├── index.ts                 # 📌 Library entry point - exports public API
│   ├── api/                     # API layer
│   │   ├── client.ts            # 📌 PubgClient facade - main SDK entry
│   │   ├── http-client.ts       # HTTP layer with rate limiting, caching, retries
│   │   └── services/            # Service implementations
│   │       ├── players.ts       # Player data and statistics
│   │       ├── matches.ts       # Match details and history
│   │       ├── seasons.ts       # Season information
│   │       ├── leaderboards.ts  # Leaderboard data
│   │       ├── samples.ts       # Sample data for testing
│   │       └── telemetry.ts     # Match telemetry data
│   ├── types/                   # TypeScript type definitions
│   │   ├── index.ts             # Type barrel exports
│   │   ├── api.ts               # API configuration types
│   │   ├── common.ts            # Shared/common types
│   │   ├── player.ts            # Player-related types
│   │   ├── match.ts             # Match-related types
│   │   ├── season.ts            # Season types
│   │   ├── leaderboard.ts       # Leaderboard types
│   │   ├── telemetry.ts         # Telemetry event types
│   │   ├── telemetry-sample-types.ts  # Telemetry sample types
│   │   └── assets/              # Auto-generated asset types
│   │       ├── index.ts         # Asset type exports
│   │       ├── items.ts         # Item ID union types
│   │       ├── vehicles.ts      # Vehicle ID union types
│   │       ├── maps.ts          # Map ID union types
│   │       ├── seasons.ts       # Season data types
│   │       ├── enums.ts         # Game mode and other enums
│   │       └── dictionaries.ts  # Name mapping dictionaries
│   ├── errors/                  # Custom error classes
│   │   └── index.ts             # Error hierarchy (PubgApiError, PubgRateLimitError, etc.)
│   ├── utils/                   # Utility modules
│   │   ├── cache.ts             # Memory caching with TTL and size limits
│   │   ├── rate-limiter.ts      # Token bucket rate limiting
│   │   ├── logger.ts            # Debug logging with namespaces
│   │   ├── assets.ts            # AssetManager - zero-latency asset access
│   │   ├── security.ts          # Input validation and sanitization
│   │   ├── monitoring.ts        # Prometheus metrics collection
│   │   ├── monitoring-node.ts   # Node.js-specific monitoring
│   │   ├── health-check.ts      # System health monitoring
│   │   ├── health-check-node.ts # Node.js-specific health checks
│   │   └── request.ts           # Request utilities
│   └── assets/                  # Synced PUBG asset data (JSON)
│       ├── seasons.json         # Season data by platform
│       ├── survival-titles.json # Survival title information
│       └── dictionaries/        # Asset name mappings
├── tests/                       # Test suite (18 files)
│   ├── setup.ts                 # Jest test setup
│   ├── __mocks__/               # Test mocks
│   │   └── axios.ts             # Axios mock for HTTP testing
│   ├── unit/                    # Unit tests
│   │   ├── client.test.ts       # PubgClient tests
│   │   ├── http-client.test.ts  # HttpClient tests
│   │   ├── cache.test.ts        # Cache tests
│   │   ├── rate-limiter.test.ts # Rate limiter tests
│   │   ├── errors.test.ts       # Error class tests
│   │   ├── enhanced-errors.test.ts
│   │   ├── assets.test.ts       # AssetManager tests
│   │   ├── asset-manager-errors.test.ts
│   │   └── services/            # Service unit tests
│   │       ├── players.test.ts
│   │       ├── matches.test.ts
│   │       ├── seasons.test.ts
│   │       ├── leaderboards.test.ts
│   │       ├── samples.test.ts
│   │       └── telemetry.test.ts
│   └── integration/             # Integration tests
│       ├── api.test.ts          # API integration tests
│       └── j03fr0st-user.test.ts # User-specific tests
├── examples/                    # Usage examples (7 files)
│   ├── basic-usage.ts           # Simple SDK usage
│   ├── advanced-usage.ts        # Advanced patterns
│   ├── asset-usage.ts           # Asset management examples
│   ├── modern-asset-usage.ts    # Modern asset API
│   ├── synced-assets-usage.ts   # Synced asset access
│   ├── unified-assets-usage.ts  # Unified asset manager
│   └── damage-info-usage.ts     # Damage information usage
├── scripts/                     # Build and utility scripts
│   ├── sync-assets.ts           # Asset synchronization from PUBG repo
│   ├── performance-test.ts      # Load testing and profiling
│   └── security-audit.ts        # Security scanning
├── dist/                        # Compiled output (git-ignored)
├── docs/                        # Generated documentation
│   └── api/                     # TypeDoc API documentation
└── config files
    ├── package.json             # NPM manifest
    ├── tsconfig.json            # TypeScript configuration
    ├── biome.json               # Biome linting/formatting
    ├── jest.config.js           # Jest test configuration
    └── .github/workflows/       # CI/CD pipelines
```

## Critical Directories

### `/src/api/` - API Layer
The core SDK implementation following the Facade pattern:
- **client.ts**: Main entry point, orchestrates all services
- **http-client.ts**: Handles HTTP communication, rate limiting, caching, error handling
- **services/**: Individual API endpoint implementations

### `/src/types/` - Type Definitions
Comprehensive TypeScript types for all API responses:
- Domain-specific types (player, match, season, etc.)
- Auto-generated asset types from PUBG repository sync
- API configuration interfaces

### `/src/utils/` - Utilities
Cross-cutting concerns and infrastructure:
- **cache.ts**: Memory-based caching with TTL
- **rate-limiter.ts**: Token bucket algorithm
- **assets.ts**: Zero-latency asset management
- **security.ts**: Input validation and threat detection
- **monitoring.ts**: Prometheus metrics and OpenTelemetry

### `/src/errors/` - Error Handling
Custom error class hierarchy:
- `PubgApiError` (base)
- `PubgRateLimitError`
- `PubgAuthenticationError`
- `PubgNotFoundError`
- `PubgValidationError`
- `PubgCacheError`
- `PubgAssetError`
- `PubgConfigurationError`
- `PubgNetworkError`

### `/tests/` - Test Suite
Organized by test type:
- **unit/**: Individual component testing (191 total tests)
- **integration/**: End-to-end API testing
- **__mocks__/**: Test doubles for external dependencies

### `/examples/` - Usage Examples
Progressive complexity examples demonstrating SDK usage patterns

## Entry Points

| Entry Point | File | Purpose |
|------------|------|---------|
| Library Export | `src/index.ts` | Public API exports |
| Main Client | `src/api/client.ts` | SDK initialization |
| Types | `src/types/index.ts` | Type definitions |
| HTTP Layer | `src/api/http-client.ts` | Network communication |

## Key Patterns

1. **Service Pattern**: Each PUBG API domain has dedicated service class
2. **Facade Pattern**: PubgClient provides unified interface to all services
3. **Dependency Injection**: Services receive HttpClient and configuration
4. **Caching Layer**: Transparent caching with configurable TTL
5. **Rate Limiting**: Built-in rate limiting (10 req/min default)
6. **Error Mapping**: HTTP errors mapped to domain-specific types

## File Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Source Files | 36 | TypeScript source code |
| Test Files | 18 | Jest test suites |
| Example Files | 7 | Usage demonstrations |
| Asset Files | 3+ | JSON asset data |
| Config Files | 6 | Build/lint configuration |
