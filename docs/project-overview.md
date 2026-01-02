# Project Overview - pubg-ts

## Introduction

**pubg-ts** is a comprehensive TypeScript SDK for the PUBG (PlayerUnknown's Battlegrounds) API. It provides developers with a type-safe, feature-rich client library for accessing PUBG game data including player statistics, match history, leaderboards, and telemetry.

## Quick Facts

| Attribute | Value |
|-----------|-------|
| **Package Name** | `@j03fr0st/pubg-ts` |
| **Version** | 1.0.10 |
| **License** | MIT |
| **Repository Type** | Monolith |
| **Project Type** | SDK / API Wrapper |
| **Primary Language** | TypeScript |
| **Runtime** | Node.js 18+ / Browser |

## Key Features

- **Type-Safe API Access**: Full TypeScript support with comprehensive type definitions
- **Built-in Rate Limiting**: Automatic rate limiting to respect PUBG API limits
- **Intelligent Caching**: Memory-based caching with configurable TTL
- **Error Handling**: Domain-specific error classes for precise error handling
- **Asset Management**: Zero-latency access to PUBG game assets (items, maps, vehicles)
- **Monitoring Ready**: Prometheus metrics and OpenTelemetry tracing support
- **Security Hardened**: Input validation and threat detection

## Technology Stack Summary

| Category | Technology |
|----------|------------|
| Language | TypeScript 5.9.x |
| Runtime | Node.js 18+, Browser |
| HTTP Client | axios 1.13.x |
| Testing | Jest 30.x |
| Linting | Biome 2.3.x |
| Documentation | TypeDoc 0.28.x |

## Architecture Overview

The SDK follows a **Service-Oriented Architecture** pattern:

```
PubgClient (Facade)
    │
    ├── PlayersService     → /players endpoints
    ├── MatchesService     → /matches endpoints
    ├── SeasonsService     → /seasons endpoints
    ├── LeaderboardsService → /leaderboards endpoints
    ├── SamplesService     → /samples endpoints
    ├── TelemetryService   → Telemetry parsing
    └── AssetManager       → Local asset data
```

## Quick Start

### Installation

```bash
npm install @j03fr0st/pubg-ts
```

### Basic Usage

```typescript
import { PubgClient } from '@j03fr0st/pubg-ts'

const client = new PubgClient({
  apiKey: 'your-api-key',
  shard: 'steam'
})

// Get player by name
const player = await client.players.getByName('shroud', 'steam')

// Get match details
const match = await client.matches.get(player.matches[0].id, 'steam')

// Access asset information
const weaponName = client.assets.getItemName('Item_Weapon_AKM') // "AKM"
```

## Project Structure

```
pubg-ts/
├── src/                # Source code (36 files)
│   ├── api/           # API client and services
│   ├── types/         # TypeScript definitions
│   ├── errors/        # Custom error classes
│   ├── utils/         # Utilities and helpers
│   └── assets/        # Synced PUBG asset data
├── tests/             # Test suite (18 files)
├── examples/          # Usage examples (7 files)
├── docs/              # Documentation
└── scripts/           # Build and utility scripts
```

## Available Services

| Service | Description | Example |
|---------|-------------|---------|
| `players` | Player data and statistics | `client.players.getByName()` |
| `matches` | Match details and history | `client.matches.get()` |
| `seasons` | Season information | `client.seasons.list()` |
| `leaderboards` | Ranking data | `client.leaderboards.get()` |
| `samples` | Sample data for testing | `client.samples.get()` |
| `telemetry` | Match telemetry parsing | `client.telemetry.get()` |
| `assets` | Game asset information | `client.assets.getItemName()` |

## Documentation Structure

This documentation set includes:

- **[Architecture](./architecture.md)** - System design and component details
- **[Source Tree](./source-tree-analysis.md)** - Annotated directory structure
- **[Development Guide](./development-guide.md)** - Setup and contribution guide
- **[API Documentation](./api/)** - TypeDoc-generated API reference

## Links

- **Repository**: [GitHub](https://github.com/J03Fr0st/pubg-ts)
- **Issues**: [GitHub Issues](https://github.com/J03Fr0st/pubg-ts/issues)
- **npm Package**: [@j03fr0st/pubg-ts](https://www.npmjs.com/package/@j03fr0st/pubg-ts)
- **PUBG API**: [Official Documentation](https://documentation.pubg.com)

## Status

| Metric | Value |
|--------|-------|
| Tests | 191 passing |
| Coverage | Comprehensive |
| Build Status | Stable |
| npm Downloads | Active |
