# Architecture Documentation - pubg-ts

## Executive Summary

**pubg-ts** is a comprehensive TypeScript SDK for the PUBG (PlayerUnknown's Battlegrounds) API. It provides a type-safe, feature-rich client library with built-in rate limiting, caching, error handling, and asset management.

| Attribute | Value |
|-----------|-------|
| **Project Type** | SDK / API Wrapper |
| **Language** | TypeScript 5.9.x |
| **Target Runtime** | Node.js 18+, Browser |
| **Module System** | CommonJS |
| **Architecture** | Service-Oriented SDK |

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | ^5.9.3 | Type-safe development |
| Runtime | Node.js | >=18.0.0 | Server-side execution |
| HTTP Client | axios | ^1.13.2 | HTTP requests |
| Search | Fuse.js | ^7.1.0 | Fuzzy search for assets |
| Validation | validator | ^13.15.23 | Input validation |
| Testing | Jest | ^30.2.0 | Test framework |
| Linting | Biome | ^2.3.6 | Code quality |
| Docs | TypeDoc | ^0.28.14 | API documentation |

## Architecture Pattern

### Service-Oriented SDK Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PubgClient                               │
│                    (Facade / Entry Point)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │ Players │ │ Matches │ │ Seasons │ │ Leaders │ │ Telemetry │ │
│  │ Service │ │ Service │ │ Service │ │ Service │ │  Service  │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────┬─────┘ │
│       │           │           │           │             │       │
│       └───────────┴───────────┴───────────┴─────────────┘       │
│                               │                                  │
│                        ┌──────┴──────┐                          │
│                        │ HttpClient  │                          │
│                        │ (HTTP Layer)│                          │
│                        └──────┬──────┘                          │
│                               │                                  │
│  ┌────────────┐  ┌────────────┼────────────┐  ┌──────────────┐  │
│  │   Cache    │──│   Rate     │            │──│    Error     │  │
│  │  Manager   │  │  Limiter   │            │  │   Handler    │  │
│  └────────────┘  └────────────┴────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        AssetManager                              │
│                   (Zero-Latency Assets)                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │    PUBG API     │
                      │ (External REST) │
                      └─────────────────┘
```

### Design Principles

1. **Facade Pattern**: `PubgClient` provides a unified interface to all services
2. **Service Pattern**: Each API domain is encapsulated in a dedicated service
3. **Dependency Injection**: Services receive `HttpClient` and configuration
4. **Separation of Concerns**: Clear boundaries between layers
5. **Fail-Safe Design**: Built-in error handling, retries, and rate limiting

## Component Overview

### Core Components

#### PubgClient (`src/api/client.ts`)
The main entry point and facade for the SDK.

```typescript
class PubgClient {
  readonly players: PlayersService
  readonly matches: MatchesService
  readonly seasons: SeasonsService
  readonly leaderboards: LeaderboardsService
  readonly samples: SamplesService
  readonly telemetry: TelemetryService
  readonly assets: AssetManager
}
```

#### HttpClient (`src/api/http-client.ts`)
Handles all HTTP communication with built-in:
- Rate limiting (token bucket algorithm)
- Request caching (memory-based with TTL)
- Automatic retries with exponential backoff
- Error mapping to domain-specific types
- Monitoring integration

#### Services (`src/api/services/`)

| Service | Endpoint | Purpose |
|---------|----------|---------|
| `PlayersService` | `/players` | Player data and statistics |
| `MatchesService` | `/matches` | Match details and history |
| `SeasonsService` | `/seasons` | Season information |
| `LeaderboardsService` | `/leaderboards` | Ranking data |
| `SamplesService` | `/samples` | Sample data for testing |
| `TelemetryService` | N/A | Match telemetry parsing |

### Utility Components

#### Cache (`src/utils/cache.ts`)
Memory-based caching with:
- Configurable TTL (Time-To-Live)
- Maximum size limits
- Hit/miss statistics
- Automatic cleanup

#### Rate Limiter (`src/utils/rate-limiter.ts`)
Token bucket algorithm implementation:
- Default: 10 requests/minute
- Configurable limits
- Request queuing

#### AssetManager (`src/utils/assets.ts`)
Zero-latency asset access:
- Locally synced PUBG asset data
- Fuzzy search via Fuse.js
- TypeScript union types for type safety
- Backward-compatible async methods

#### Error Classes (`src/errors/index.ts`)

```
PubgApiError (base)
├── PubgRateLimitError
├── PubgAuthenticationError
├── PubgNotFoundError
├── PubgValidationError
├── PubgCacheError
├── PubgAssetError
├── PubgConfigurationError
└── PubgNetworkError
```

### Supporting Components

#### Monitoring (`src/utils/monitoring.ts`)
- Prometheus metrics collection
- OpenTelemetry tracing integration
- HTTP request/response timing
- Cache performance metrics

#### Security (`src/utils/security.ts`)
- Input validation and sanitization
- SQL injection prevention
- XSS attack detection
- Command injection protection

#### Health Check (`src/utils/health-check.ts`)
- Memory usage monitoring
- API connectivity validation
- Event loop responsiveness
- Custom health check support

## Data Flow

### Typical Request Flow

```
User Code
    │
    ▼
PubgClient.players.getByName("shroud", "steam")
    │
    ▼
PlayersService.getByName()
    │
    ├── Check cache → Hit? Return cached data
    │
    ▼ (Cache miss)
HttpClient.get("/players?filter[playerNames]=shroud")
    │
    ├── Rate limiter check
    │
    ├── Add authentication headers
    │
    ▼
axios.get(url) → PUBG API
    │
    ▼ (Response)
Error handling → Map to PubgApiError if needed
    │
    ▼
Cache response (if cacheable)
    │
    ▼
Return typed response to user
```

### Asset Resolution Flow

```
User Code
    │
    ▼
assetManager.getItemName("Item_Weapon_AKM")
    │
    ├── Synchronous: Read from local dictionary
    │
    ▼
Return "AKM" (zero-latency)
```

## API Design

### Public API Surface

```typescript
// Client initialization
const client = new PubgClient({
  apiKey: 'your-api-key',
  shard: 'steam',  // Optional, defaults to 'steam'
  cache: { enabled: true, ttl: 300000 },
  rateLimit: { requestsPerMinute: 10 }
})

// Service access
const player = await client.players.getByName('shroud', 'steam')
const match = await client.matches.get('match-id', 'steam')
const seasons = await client.seasons.list('steam')
const leaderboard = await client.leaderboards.get('division.bro.official.pc-2018-01', 'steam')

// Asset management
const itemName = client.assets.getItemName('Item_Weapon_AKM')
const mapName = client.assets.getMapName('Baltic_Main')
```

### Error Handling Pattern

```typescript
try {
  const player = await client.players.getByName('shroud', 'steam')
} catch (error) {
  if (error instanceof PubgRateLimitError) {
    // Handle rate limiting
  } else if (error instanceof PubgNotFoundError) {
    // Player not found
  } else if (error instanceof PubgAuthenticationError) {
    // Invalid API key
  }
}
```

## Configuration

### Client Options

```typescript
interface PubgClientConfig {
  apiKey: string                    // Required: PUBG API key
  shard?: PlatformRegion           // Default: 'steam'
  cache?: {
    enabled?: boolean              // Default: true
    ttl?: number                   // Default: 300000 (5 min)
    maxSize?: number               // Default: 100
  }
  rateLimit?: {
    requestsPerMinute?: number     // Default: 10
  }
  timeout?: number                 // Default: 30000 (30 sec)
  retries?: number                 // Default: 3
}
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `PUBG_API_KEY` | API authentication |
| `DEBUG=pubg-ts:*` | Enable debug logging |

## Browser Support

The SDK supports both Node.js and browser environments:

```json
{
  "browser": {
    "./dist/utils/monitoring.js": "./dist/utils/monitoring-browser.js",
    "./dist/utils/health-check.js": "./dist/utils/health-check-browser.js"
  }
}
```

## Testing Architecture

### Test Organization

```
tests/
├── unit/              # Isolated component tests
│   ├── client.test.ts
│   ├── http-client.test.ts
│   ├── cache.test.ts
│   ├── rate-limiter.test.ts
│   ├── errors.test.ts
│   ├── assets.test.ts
│   └── services/      # Service-specific tests
├── integration/       # E2E API tests
├── __mocks__/         # Test doubles
│   └── axios.ts       # HTTP mock
└── setup.ts           # Common setup
```

### Testing Strategy

- **Unit Tests**: Individual components in isolation
- **Integration Tests**: End-to-end API flow testing
- **Mocking**: Axios mocked for HTTP layer tests
- **Coverage**: Comprehensive test coverage (191 tests)

## Performance Considerations

### Caching

- Memory-based with configurable TTL
- Automatic size-based eviction
- Cache statistics for monitoring

### Rate Limiting

- Token bucket algorithm
- Respects PUBG API limits
- Transparent queuing

### Asset Performance

- Zero-latency synchronous access
- Locally synced data (no network calls)
- Fuse.js for efficient fuzzy search

## Security Considerations

### Input Validation

All user inputs validated through `SecurityManager`:
- Player name validation
- API parameter sanitization
- Injection attack prevention

### API Key Protection

- Never logged or exposed in errors
- Secure header transmission
- Environment variable support

## Future Considerations

### Extensibility Points

1. Additional platform support
2. WebSocket for real-time data
3. GraphQL wrapper
4. Response transformers
5. Plugin architecture

### Maintenance Notes

- Asset data synced from official PUBG repository
- Types auto-generated for type safety
- Monitoring for production observability
