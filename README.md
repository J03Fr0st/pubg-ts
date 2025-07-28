# PUBG TypeScript API Wrapper

A comprehensive TypeScript wrapper for the PUBG API with full type safety, rate limiting, error handling, and caching.

## Features

- 🔒 **Full TypeScript support** with comprehensive type definitions
- 🚦 **Built-in rate limiting** (10 requests per minute by default)
- 🛡️ **Comprehensive error handling** with custom error types
- 🔄 **Automatic retries** for failed requests
- 💾 **Smart caching** with TTL and size limits
- 📡 **All PUBG API endpoints** supported
- 🎯 **Easy-to-use service-based architecture**
- 🐛 **Debug logging** with multiple namespaces
- ⚡ **Performance monitoring** with timing utilities

## Installation

```bash
npm install @j03fr0st/pubg-ts
```

## Quick Start

```typescript
import { PubgClient } from '@j03fr0st/pubg-ts';

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

### Assets

The wrapper includes comprehensive asset management with both networked and synced local data:

#### Synced Assets (Recommended)
Zero-latency access to all PUBG assets with full TypeScript type safety:

```typescript
import { ItemId, VehicleId, MapId } from '@j03fr0st/pubg-ts';

// Type-safe item access with zero network requests
const itemId: ItemId = 'Item_Weapon_AK47_C';
const itemName = client.syncedAssets.getItemName(itemId); // "AKM"
const itemInfo = client.syncedAssets.getItemInfo(itemId);

// Enhanced search and filtering
const weapons = client.syncedAssets.getItemsByCategory('weapon');
const searchResults = client.syncedAssets.searchItems('AK');

// Vehicle information with type safety
const vehicleId: VehicleId = 'BP_Motorbike_04_C';
const vehicleName = client.syncedAssets.getVehicleName(vehicleId);
const vehicleInfo = client.syncedAssets.getVehicleInfo(vehicleId);

// Map data with comprehensive coverage
const allMaps = client.syncedAssets.getAllMaps();
const mapName = client.syncedAssets.getMapName('Baltic_Main');

// Season data by platform
const pcSeasons = client.syncedAssets.getSeasonsByPlatform('PC');
const currentSeason = client.syncedAssets.getCurrentSeason('PC');

// Survival titles with rating ranges
const title = client.syncedAssets.getSurvivalTitle(1500);

// Asset statistics and insights
const stats = client.syncedAssets.getAssetStats();
console.log(`Total items: ${stats.totalItems}`);
```

#### Network Assets (Legacy)
Dynamic fetching from PUBG API assets repository:

```typescript
// Get user-friendly item names from real PUBG data
const itemName = await client.assets.getItemName('Item_Weapon_AK47_C');
console.log(itemName); // "AKM"

// Get detailed item information
const itemInfo = await client.assets.getItemInfo('Item_Weapon_AK47_C');
console.log(itemInfo.category); // "weapon"

// Get map names from real PUBG data
const mapName = await client.assets.getMapName('Baltic');
console.log(mapName); // "Erangel (Remastered)"

// Get asset URLs for images
const weaponIconUrl = client.assets.getWeaponAssetUrl('Item_Weapon_AK47_C', 'icon');
const vehicleImageUrl = client.assets.getVehicleAssetUrl('BP_Motorbike_04_C', 'image');
```

## Advanced Features

### Caching

The wrapper includes automatic caching for API responses:

```typescript
// Check cache statistics
const cacheStats = client.getCacheStats();
console.log(`Cache: ${cacheStats.size}/${cacheStats.maxSize} entries`);

// Clear cache manually
client.clearCache();
```

### Debug Logging

Enable debug logging by setting the `DEBUG` environment variable:

```bash
# Enable all debug logs
DEBUG=pubg-ts:* node your-app.js

# Enable specific component logs
DEBUG=pubg-ts:http,pubg-ts:cache node your-app.js
```

Available debug namespaces:
- `pubg-ts:http` - HTTP requests and responses
- `pubg-ts:cache` - Cache hits, misses, and operations
- `pubg-ts:rate-limit` - Rate limiting events
- `pubg-ts:client` - Client initialization and configuration
- `pubg-ts:error` - Error handling and retries

### Rate Limiting

Monitor and manage rate limits:

```typescript
// Check rate limit status
const status = client.getRateLimitStatus();
console.log(`Remaining requests: ${status.remaining}`);
console.log(`Reset time: ${new Date(status.resetTime)}`);
```

## Error Handling

```typescript
import { 
  PubgApiError, 
  PubgRateLimitError, 
  PubgAuthenticationError 
} from '@j03fr0st/pubg-ts';

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

## Examples

Check out the [examples](./examples/) directory for comprehensive usage examples:

- [`basic-usage.ts`](./examples/basic-usage.ts) - Simple API usage
- [`advanced-usage.ts`](./examples/advanced-usage.ts) - Advanced features and error handling
- [`asset-usage.ts`](./examples/asset-usage.ts) - Network-based asset management
- [`synced-assets-usage.ts`](./examples/synced-assets-usage.ts) - Local synced assets with type safety

## Development

### Code Formatting

This project uses [Biome](https://biomejs.dev/) for fast, reliable linting and formatting:

```bash
# Format all files
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check and fix both formatting and linting
npm run check:fix
```

### Asset Synchronization

The project includes a comprehensive asset sync system:

```bash
# Sync all PUBG assets from the official repository
npm run sync-assets

# Assets are automatically synced during build
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Pre-commit Hooks

This project uses Husky with lint-staged for pre-commit validation:
- Automatic code formatting with Biome
- Linting and type checking
- Running tests for changed files

The hooks run automatically on `git commit`. To bypass (not recommended):
```bash
git commit --no-verify
```

### Editor Setup

The project includes:
- **EditorConfig** (.editorconfig) for consistent formatting across editors
- **VS Code settings** (.vscode/) with recommended extensions and settings
- **Biome integration** for automatic formatting on save

Recommended VS Code extensions:
- EditorConfig for VS Code
- Biome

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Line endings**: LF (Unix)
- **Line length**: 100 characters
- **Trailing commas**: ES5 style
- **Import organization**: Automatic sorting and grouping

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development process and how to submit pull requests.

## Security

Please see [SECURITY.md](./.github/SECURITY.md) for information about reporting security vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

### Open Source

This is an open source project and anyone is free to:
- Use this software for any purpose
- Modify and distribute the software
- Include it in other projects (commercial or non-commercial)
- Contribute improvements back to the project

The MIT License is one of the most permissive open source licenses, placing minimal restrictions on reuse.