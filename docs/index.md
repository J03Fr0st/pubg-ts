# pubg-ts Documentation Index

## Project Documentation Index

### Project Overview

- **Type:** Monolith (Single cohesive codebase)
- **Project Type:** TypeScript SDK / API Wrapper
- **Primary Language:** TypeScript 5.9.x
- **Architecture:** Service-Oriented SDK

### Quick Reference

| Attribute | Value |
|-----------|-------|
| **Package** | `@j03fr0st/pubg-ts` |
| **Version** | 1.0.10 |
| **Tech Stack** | TypeScript + axios + Jest |
| **Entry Point** | `src/index.ts` |
| **Architecture Pattern** | Service-Oriented with Facade |
| **Runtime** | Node.js 18+ / Browser |

### Generated Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](./project-overview.md) | Project introduction and quick start |
| [Architecture](./architecture.md) | System design, patterns, and components |
| [Source Tree Analysis](./source-tree-analysis.md) | Annotated directory structure |
| [Development Guide](./development-guide.md) | Setup, testing, and contribution |

### Existing Documentation

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Main project readme with quick start |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |
| [CLAUDE.md](../CLAUDE.md) | AI assistant guidance |
| [CHANGELOG.md](../CHANGELOG.md) | Version history |

### API Reference

- [TypeDoc API Documentation](./api/) - Auto-generated API reference

### Key Entry Points

| Entry Point | File | Purpose |
|------------|------|---------|
| Library Export | `src/index.ts` | Public API exports |
| Main Client | `src/api/client.ts` | SDK initialization |
| Types | `src/types/index.ts` | Type definitions |

### Available Services

```
client.players      → Player data and statistics
client.matches      → Match details and history
client.seasons      → Season information
client.leaderboards → Ranking data
client.samples      → Sample data for testing
client.telemetry    → Match telemetry parsing
client.assets       → Game asset information
```

### Getting Started

1. **Install the package:**
   ```bash
   npm install @j03fr0st/pubg-ts
   ```

2. **Initialize the client:**
   ```typescript
   import { PubgClient } from '@j03fr0st/pubg-ts'

   const client = new PubgClient({
     apiKey: 'your-api-key',
     shard: 'steam'
   })
   ```

3. **Make API calls:**
   ```typescript
   const player = await client.players.getByName('shroud', 'steam')
   const match = await client.matches.get(player.matches[0].id, 'steam')
   ```

### Development Quick Start

```bash
# Clone and install
git clone https://github.com/J03Fr0st/pubg-ts.git
cd pubg-ts
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run check
```

### File Statistics

| Category | Count |
|----------|-------|
| Source Files | 36 |
| Test Files | 18 |
| Example Files | 7 |
| Test Count | 191 |

---

**Generated:** 2026-01-02
**Workflow Version:** 1.2.0
**Scan Level:** Deep
