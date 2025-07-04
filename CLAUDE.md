# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/`
- `npm run dev` - Run the application in development mode with ts-node
- `npm run prepare` - Set up Husky pre-commit hooks

### Testing
- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run only unit tests in `tests/unit/`
- `npm run test:integration` - Run only integration tests in `tests/integration/`

### Code Quality
- `npm run lint` - Lint code with Biome
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Biome
- `npm run check` - Run both linting and formatting checks
- `npm run check:fix` - Fix both linting and formatting issues

### Legacy ESLint (if needed)
- `npm run legacy:lint` - Lint with ESLint
- `npm run legacy:lint:fix` - Fix ESLint issues

## Code Architecture

### Core Structure
This is a TypeScript SDK for the PUBG API with a service-oriented architecture:

**Main Client (`src/api/client.ts`)**
- `PubgClient` - Main entry point that orchestrates all services
- Provides unified access to all API endpoints through service instances
- Handles configuration and provides utility methods for cache and rate limiting

**HTTP Layer (`src/api/http-client.ts`)**
- `HttpClient` - Handles all HTTP communication with the PUBG API
- Implements rate limiting (10 requests/minute default)
- Provides automatic retries, caching, and error handling
- Uses axios for HTTP requests with custom interceptors

**Service Layer (`src/api/services/`)**
Each service corresponds to a major PUBG API endpoint:
- `PlayersService` - Player data and statistics
- `MatchesService` - Match details and history
- `SeasonsService` - Season information
- `LeaderboardsService` - Leaderboard data
- `SamplesService` - Sample data for testing
- `TelemetryService` - Match telemetry data

**Utilities (`src/utils/`)**
- `RateLimiter` - Token bucket rate limiting implementation
- `Cache` - Memory-based caching with TTL and size limits
- `Logger` - Debug logging with namespaces (`pubg-ts:*`)

**Type Definitions (`src/types/`)**
- Comprehensive TypeScript types for all API responses
- Organized by domain (players, matches, seasons, etc.)
- Includes common types and API configuration interfaces

**Error Handling (`src/errors/`)**
- Custom error classes for different API error scenarios
- `PubgApiError`, `PubgRateLimitError`, `PubgAuthenticationError`, etc.

### Key Design Patterns
- **Service Pattern**: Each API domain has its own service class
- **Dependency Injection**: Services receive HttpClient and configuration
- **Caching Layer**: Transparent caching with configurable TTL
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Error Mapping**: HTTP errors mapped to domain-specific error types

### Testing Strategy
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: End-to-end API testing with mocked responses
- **Mocking**: Axios mocked in `tests/__mocks__/axios.ts`
- **Setup**: Common test setup in `tests/setup.ts`

### Configuration
- Uses Biome for linting and formatting (replaces ESLint/Prettier)
- Jest for testing with TypeScript support
- Husky + lint-staged for pre-commit hooks
- Target: ES2020, Node.js 18+

### Debug Logging
Enable debug logging with `DEBUG=pubg-ts:*` environment variable.
Available namespaces: `http`, `cache`, `rate-limit`, `client`, `error`.