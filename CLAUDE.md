# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

🔄 Project Awareness & Context
- Always review project planning and architecture documents (e.g., PLANNING.md) at the start of a new task or conversation.
- Check the task list (e.g., TASK.md) before starting work. If your task isn't listed, add it with a brief description and today's date.
- Follow established naming conventions, file structures, and architectural patterns as described in project documentation.

🧱 Code Structure & Modularity
- Avoid files longer than 500 lines. If a file grows too large, refactor by splitting it into smaller modules or helper files.
- Organize code into clearly separated modules or files, grouped by feature or responsibility.
- Use clear and consistent import/include/require statements as appropriate for the language and project.

🧪 Testing & Reliability
- Always create unit tests for new features (functions, classes, routes, etc.), using the preferred testing framework for the language.
- After updating any logic, review and update existing tests as needed.
- Place tests in a dedicated tests directory that mirrors the main code structure.
- For each feature, include at least:
  - One test for expected/typical use
  - One edge case test
  - One failure or error case test

✅ Task Completion
- Mark completed tasks in the task list (e.g., TASK.md) immediately after finishing them.
- Add any new sub-tasks or TODOs discovered during development to the task list under a "Discovered During Work" section.

📎 Style & Conventions
- Follow the official or community style guide for the language in use (e.g., PEP8, Google Java Style, Airbnb JavaScript Style).
- Use consistent naming conventions for variables, functions, classes, and files (e.g., camelCase, snake_case, PascalCase) as appropriate.
- Write clear, descriptive names for all identifiers; avoid unnecessary abbreviations.
- Indent code consistently (spaces or tabs as per project/language standard).
- Limit line length to 80–120 characters, depending on language norms.
- Use comments to explain non-obvious logic, intent, and complex algorithms.
- Write documentation comments for all public functions, classes, and modules.
- Group related code by feature or responsibility.
- Remove dead code and unused variables/functions promptly.
- Prefer immutability and pure functions where practical.
- Avoid deep nesting; refactor complex logic into smaller functions.
- Use version control best practices: small, focused commits with clear messages.
- Ensure code is understandable and maintainable by others.

📚 Documentation & Explainability
- Update project documentation (e.g., README.md) when new features are added, dependencies change, or setup steps are modified.
- Comment non-obvious code and ensure everything is understandable to a mid-level developer.
- When writing complex logic, add inline comments explaining the "why," not just the "what."

🧠 AI/Automation Behavior Rules
- Never assume missing context; ask questions if uncertain.
- Never invent or hallucinate libraries, functions, or APIs—only use known, verified components.
- Always confirm file paths and module names exist before referencing them in code or documentation.
- Never delete or overwrite existing code unless explicitly instructed or if it is part of a documented task.



## Common Development Commands

### Building and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/`
- `npm run dev` - Run the application in development mode with ts-node
- `npm run prepare` - Install Lefthook Git hooks

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

### Asset Management
- `npm run sync-assets` - Download and sync all PUBG assets from official repository
- `npm run prebuild` - Automatically syncs assets before building (runs sync-assets)

### Production Readiness
- `npm run security:audit` - Run comprehensive security audit with vulnerability scanning
- `npm run security:check` - Run both npm audit and custom security checks
- `npm run security:fix` - Fix npm audit vulnerabilities automatically
- `npm run perf:test` - Run performance testing and load validation
- `npm run perf:profile` - Profile performance with Node.js profiler

### CLI Tool
- `npx pubg-ts scaffold` - Create new PUBG TypeScript projects with templates
- `npx pubg-ts assets` - Manage and explore PUBG assets (search, export, info)
- `npx pubg-ts setup` - Setup development environment and configuration

### Documentation
- `npm run generate:docs` - Generate TypeDoc API documentation
- `npm run generate:types` - Generate TypeScript types from OpenAPI specification

## Code Architecture

### Core Structure
This is a TypeScript SDK for the PUBG API with a service-oriented architecture:

**Main Client (`src/api/client.ts`)**
- `PubgClient` - Main entry point that orchestrates all services
- Provides unified access to all API endpoints through service instances
- Handles configuration and exposes client-local health and response-cache utilities

**Runtime Layer (`src/api/client-runtime.ts`, `src/api/http-transaction.ts`)**
- `ClientRuntime` - Owns one client's cache, rate limiter, request deduplicator, and health state
- `HttpTransactionRunner` - Handles retries, caching, error mapping, and authenticated/external requests
- Uses axios for HTTP requests while keeping runtime state isolated per client

**Service Layer (`src/api/services/`)**
Each service corresponds to a major PUBG API endpoint:
- `PlayersService` - Player data and statistics
- `MatchesService` - Match details, history, and telemetry through `getTelemetry()`
- `SeasonsService` - Season information
- `LeaderboardsService` - Leaderboard data
- `SamplesService` - Sample data for testing

**Runtime & Utilities (`src/api/`, `src/utils/`)**
- `ClientRuntime` - Client-local request composition with response caching, rate limiting, request deduplication, and health state
- `PubgClient.getHealth()` - Synchronous, redacted request-health snapshot with response-cache and rate-limit state
- `RateLimiter` - Token bucket rate limiting implementation
- `Cache` - Memory-based caching with TTL and size limits
- `Logger` - Debug logging with namespaces (`pubg-ts:*`)
- `AssetManager` - Unified asset management system with zero-latency access to all PUBG assets
- `SecurityManager` - Input validation, sanitization, and threat detection

**Asset Management System (`src/utils/assets.ts`)**
The unified AssetManager provides comprehensive access to all PUBG assets:
- **Zero-latency performance**: Uses locally synced data by default (no network requests)
- **Full TypeScript type safety**: All asset IDs are typed with union types for IntelliSense
- **Enhanced search capabilities**: Fuzzy search, category filtering, and metadata enhancement
- **Complete asset coverage**: Items, vehicles, maps, seasons, survival titles, and dictionaries
- **Backward compatibility**: Maintains async methods for legacy code
- **Auto-synced data**: Assets are synced from official PUBG repository via `scripts/sync-assets.ts`

**Type Definitions (`src/types/`)**
- Comprehensive TypeScript types for all API responses
- Organized by domain (players, matches, seasons, etc.)
- Includes common types and API configuration interfaces

**Error Handling (`src/errors/`)**
- Custom error classes for different API error scenarios
- `PubgApiError`, `PubgRateLimitError`, `PubgAuthenticationError`, etc.

### Key Design Patterns
- **Service Pattern**: Each API domain has its own service class
- **Dependency Injection**: Services receive an endpoint transport and configuration
- **Caching Layer**: Transparent response caching within each client runtime
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Error Mapping**: HTTP errors mapped to domain-specific error types
- **Asset Management**: User-friendly transformation of technical IDs to human-readable names and metadata

### Testing Strategy
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: End-to-end API testing with mocked responses
- **Mocking**: Axios mocked in `tests/__mocks__/axios.ts`
- **Setup**: Common test setup in `tests/setup.ts`

### Configuration
- Uses Biome for linting and formatting (replaces ESLint/Prettier)
- Jest for testing with TypeScript support
- Lefthook for pre-commit hooks (Biome check + related tests)
- Target: ES2020, Node.js 18+

### Asset Synchronization
The project includes a comprehensive asset synchronization system:

**Sync Script (`scripts/sync-assets.ts`)**
- Downloads 15+ asset types from the official PUBG repository
- Generates TypeScript types automatically for type safety
- Creates local JSON files for zero-latency access
- Run with: `npm run sync-assets` (when script is added to package.json)

**Generated Assets (`src/assets/`)**
- `seasons.json` - All season data by platform
- `survival-titles.json` - Survival title and rating information
- `dictionaries/` - Asset name mappings and categorizations

**Generated Types (`src/types/assets/`)**
- `items.ts` - All item IDs as union types with dictionaries
- `vehicles.ts` - All vehicle IDs as union types with dictionaries
- `maps.ts` - All map IDs as union types with dictionaries
- `seasons.ts` - Season data interfaces and platform types
- `enums.ts` - Game mode, damage type, and other enumerations

**CLI Tool (`src/cli/`)**
Comprehensive command-line interface for development and project management:
- **Scaffolding**: Create new PUBG TypeScript projects with multiple templates (basic, advanced, bot)
- **Asset Management**: Search, explore, and export PUBG assets with fuzzy search capabilities
- **Development Setup**: Interactive configuration for API keys, testing, and linting

**Production Features (`scripts/`, `src/api/`, `src/utils/`)**
Runtime health, security, and performance tools:
- **Performance Testing**: Load testing with concurrent request validation and memory profiling
- **Security Auditing**: Vulnerability scanning, dependency analysis, and code security validation
- **Client Runtime Health**: Synchronous, redacted snapshots derived from each client's request outcomes, response cache, and rate limiter
- **Input Security**: Validation, sanitization, and threat detection for all user inputs

### Key Design Patterns
- **Service Pattern**: Each API domain has its own service class
- **Dependency Injection**: Services receive an `EndpointTransport` backed by the client-local runtime
- **Caching Layer**: Transparent response caching within each client runtime
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Error Mapping**: HTTP errors mapped to domain-specific error types
- **Asset Management**: User-friendly transformation of technical IDs to human-readable names and metadata
- **Runtime Health**: Client-local request outcomes feed synchronous, redacted health snapshots
- **Security Hardening**: All inputs validated and sanitized at entry points

### Testing Strategy
- **Unit Tests**: Individual service and utility testing (191 total tests)
- **Integration Tests**: End-to-end API testing with mocked responses
- **Mocking**: Axios mocked in `tests/__mocks__/axios.ts`
- **Setup**: Common test setup in `tests/setup.ts`
- **Coverage**: Comprehensive test coverage with detailed reporting

### Configuration
- Uses Biome for linting and formatting (replaces ESLint/Prettier)
- Jest for testing with TypeScript support
- Lefthook for pre-commit hooks (Biome check + related tests)
- Target: ES2020, Node.js 18+
- Client-local runtime health snapshots without global monitors or background health timers
- Security hardening with input validation and threat detection

### Asset Synchronization
The project includes a comprehensive asset synchronization system:

**Sync Script (`scripts/sync-assets.ts`)**
- Downloads 15+ asset types from the official PUBG repository
- Generates TypeScript types automatically for type safety
- Creates local JSON files for zero-latency access
- Automatically runs before builds (`npm run prebuild`)

**Generated Assets (`src/assets/`)**
- `seasons.json` - All season data by platform
- `survival-titles.json` - Survival title and rating information
- `dictionaries/` - Asset name mappings and categorizations

**Generated Types (`src/types/assets/`)**
- `items.ts` - All item IDs as union types with dictionaries
- `vehicles.ts` - All vehicle IDs as union types with dictionaries
- `maps.ts` - All map IDs as union types with dictionaries
- `seasons.ts` - Season data interfaces and platform types
- `enums.ts` - Game mode, damage type, and other enumerations

### Client Runtime Health
Each `PubgClient` owns a `ClientRuntime`; request state is not shared across client instances.

**Health Snapshot (`getHealth()`)**
- Returns synchronously with redacted status, reason, transition time, and request counts
- Includes response-cache size, capacity, hits, misses, and hit rate
- Includes the last-known rate-limit remaining count, limit, and reset time
- Reflects real request and telemetry outcomes without synthetic checks, background timers, or environment-specific monitoring variants

### Security Features
Built-in security hardening and validation:

**Input Validation**
- Player name validation with security checks
- API parameter sanitization
- SQL injection prevention
- XSS attack detection
- Command injection protection

**Security Auditing**
- NPM vulnerability scanning
- Dependency security analysis
- License compliance checking
- Code security pattern detection
- Configuration validation

### Debug Logging
Enable debug logging with `DEBUG=pubg-ts:*` environment variable.
Available namespaces: `http`, `cache`, `rate-limit`, `client`, `error`.

## Development Workflow

### Before Making Changes
1. **Run full test suite**: `npm test` - Ensure all 191 tests pass
2. **Check build**: `npm run build` - Automatically syncs assets and compiles
3. **Lint code**: `npm run lint` - Check for code quality issues

### When Adding New Features
1. **Add security validation**: Use `SecurityManager` for any user input processing
2. **Write tests**: Maintain test coverage - add unit tests in `tests/unit/`
3. **Update assets**: Run `npm run sync-assets` if working with PUBG asset data

### When Modifying Services
- **Transport Integration**: Services use the client runtime through the `EndpointTransport` boundary
- **Error Handling**: Throw appropriate error types from `src/errors/`
- **Caching**: Use the client-local response cache for eligible requests
- **Rate Limiting**: Respect the client-local rate limiter across all services

### Working with Assets
- **Local First**: Use `AssetManager` synchronous methods for zero-latency access
- **Type Safety**: All asset IDs have union types - use `ItemId`, `VehicleId`, `MapId`
- **Fuzzy Search**: Built-in search capabilities via `fuse.js` integration
- **Sync Required**: Run `npm run sync-assets` to update with latest PUBG data

### CLI Development
The CLI tool (`src/cli/`) provides scaffolding and asset management:
- **Commands**: Located in `src/cli/commands/` (scaffold, assets, setup)
- **Templates**: Project templates for different use cases (basic, advanced, bot)
- **Binary**: Available as `npx pubg-ts` after build

### Performance Considerations
- **Runtime Health**: Use synchronous `getHealth()` snapshots for request, cache, and rate-limit state
- **Caching Strategy**: TTL-based with size limits; inspect `getHealth().responseCache` for redacted statistics
- **Asset Performance**: Local assets preferred over network calls

### Security Guidelines
- **Input Validation**: All user inputs must go through `SecurityManager`
- **API Key Protection**: Never log or expose API keys in error messages
- **Dependency Security**: Run `npm run security:check` before releases
- **Audit Compliance**: Use `npm run security:audit` for comprehensive security analysis

### Production Deployment
- **Runtime Health**: Inspect each `PubgClient` through synchronous `getHealth()` snapshots
- **Performance Testing**: Run `npm run perf:test` for load validation
- **Security Validation**: Run `npm run security:check` before deployment
- **Asset Sync**: Ensure assets are synced with `npm run sync-assets`

## Important File Locations

### Core Architecture
- `src/api/client.ts` - Main PubgClient entry point
- `src/api/client-runtime.ts` - Client-local runtime composition and health snapshots
- `src/api/http-transaction.ts` - HTTP transaction, retry, cache, and error-mapping mechanics
- `src/api/services/` - Individual API service implementations

### Utilities & Infrastructure
- `src/utils/assets.ts` - AssetManager for zero-latency asset access
- `src/utils/security.ts` - Input validation and threat detection
- `src/utils/cache.ts` - Memory caching with hit rate tracking

### Production Tools
- `scripts/performance-test.ts` - Load testing and memory profiling
- `scripts/security-audit.ts` - Comprehensive security scanning
- `scripts/sync-assets.ts` - Asset synchronization from PUBG repository

### Generated Code (Do Not Edit Manually)
- `src/types/assets/` - Auto-generated TypeScript types for assets
- `src/assets/` - Auto-generated JSON files with PUBG asset data

### Testing
- `tests/unit/` - Unit tests for individual components
- `tests/integration/` - End-to-end API testing
- `tests/__mocks__/` - Mock implementations for testing
