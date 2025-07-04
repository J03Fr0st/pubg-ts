# PUBG TypeScript API Wrapper

A comprehensive TypeScript wrapper for the PUBG API with full type safety, rate limiting, and error handling.

## Features

- 🔒 **Full TypeScript support** with comprehensive type definitions
- 🚦 **Built-in rate limiting** (10 requests per minute by default)
- 🛡️ **Comprehensive error handling** with custom error types
- 🔄 **Automatic retries** for failed requests
- 📡 **All PUBG API endpoints** supported
- 🎯 **Easy-to-use service-based architecture**

## Installation

```bash
npm install pubg-ts
```

## Quick Start

```typescript
import { PubgClient } from 'pubg-ts';

const client = new PubgClient({
  apiKey: 'your-api-key',
  shard: 'pc-na'
});

// Get player by name
const player = await client.players.getPlayerByName('playerName');

// Get match details
const match = await client.matches.getMatch('match-id');

// Get current season
const season = await client.seasons.getCurrentSeason();
```

## API Reference

### Players

```typescript
// Get players by name
const players = await client.players.getPlayers({
  playerNames: ['player1', 'player2']
});

// Get player by ID
const player = await client.players.getPlayerById('player-id');

// Get player season stats
const stats = await client.players.getPlayerSeasonStats({
  playerId: 'player-id',
  seasonId: 'season-id'
});
```

### Matches

```typescript
// Get match details
const match = await client.matches.getMatch('match-id');

// Get matches with filters
const matches = await client.matches.getMatches({
  filter: {
    createdAt: {
      start: '2023-01-01T00:00:00Z',
      end: '2023-01-31T23:59:59Z'
    }
  }
});
```

### Seasons

```typescript
// Get all seasons
const seasons = await client.seasons.getSeasons();

// Get current season
const currentSeason = await client.seasons.getCurrentSeason();
```

### Leaderboards

```typescript
// Get leaderboard
const leaderboard = await client.leaderboards.getLeaderboard({
  seasonId: 'season-id',
  gameMode: 'squad'
});
```

### Telemetry

```typescript
// Get telemetry data from a match
const telemetry = await client.telemetry.getTelemetryData(telemetryUrl);
```

## Error Handling

```typescript
import { 
  PubgApiError, 
  PubgRateLimitError, 
  PubgAuthenticationError 
} from 'pubg-ts';

try {
  const player = await client.players.getPlayerByName('nonexistent');
} catch (error) {
  if (error instanceof PubgRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof PubgAuthenticationError) {
    console.log('Invalid API key');
  }
}
```

## Rate Limiting

The wrapper automatically handles rate limiting with a default of 10 requests per minute:

```typescript
// Check rate limit status
const status = client.getRateLimitStatus();
console.log(`Remaining requests: ${status.remaining}`);
console.log(`Reset time: ${new Date(status.resetTime)}`);
```

## Configuration

```typescript
const client = new PubgClient({
  apiKey: 'your-api-key',
  shard: 'pc-na',
  baseUrl: 'https://api.pubg.com', // optional
  timeout: 10000, // optional, default 10s
  retryAttempts: 3, // optional, default 3
  retryDelay: 1000 // optional, default 1s
});
```

## License

MIT