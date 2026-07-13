# Migrating to v2

Version 2 removes the v1 compatibility facades immediately. Update imports and call sites before
upgrading; there are no deprecated aliases in the v2 package root.

| v1 | v2 |
|---|---|
| `AssetManager` / `assetManager` | `AssetCatalog` |
| `AssetConfig.baseUrl` | `AssetCatalogConfig.assetBaseUrl` |
| `version`, `cacheAssets`, `useLocalData` | Removed; catalog is always local |
| `client.telemetry.getTelemetryData(url)` | `client.matches.getTelemetry(matchId)` |
| `getCacheStats()` / `getRateLimitStatus()` | `getHealth()` |
| `clearCache()` | `clearResponseCache()` |
| `PlayersService`, `MatchesService`, etc. | `Players`, `Matches`, etc. |
| health/monitoring/observability deep imports | Removed; use `getHealth()` |

## Client health and response cache

```ts
const health = client.getHealth();

console.log(health.status);
console.log(health.responseCache);
console.log(health.rateLimit);

client.clearResponseCache();
```

Client Health is a synchronous, redacted snapshot derived from real request outcomes. Each client
owns its response cache, rate limiter, request deduplicator, and health state.

## Match telemetry

```ts
const telemetry = await client.matches.getTelemetry(matchId);
```

Pass the match ID rather than a telemetry URL. The Matches module resolves the telemetry asset and
fetches it without authenticated headers or response caching.

## Local asset catalog

```ts
import { AssetCatalog } from '@j03fr0st/pubg-ts';

const assets = new AssetCatalog({
  assetBaseUrl: 'https://cdn.example.com/pubg',
});

const item = assets.getItemInfo('Item_Weapon_AK47_C');
const iconUrl = assets.getWeaponAssetUrl('Item_Weapon_AK47_C');
```

Catalog lookups always use bundled local data. `assetBaseUrl` changes only generated image URLs.
The same catalog is available as `client.assets`.

## Package-root modules

Endpoint modules are exported by their domain names: `Players`, `Matches`, `Seasons`,
`Leaderboards`, and `Samples`. Runtime composition, endpoint transport, transaction execution, and
mutable health-state internals remain private implementation details.
