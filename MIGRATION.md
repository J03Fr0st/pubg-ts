# Migrating to v3

Version 3 removes a second, hand-maintained copy of the Asset Catalog data from the package root,
gives the two "current season" lookups distinct names, and uses typed `Pubg*Error` classes for
the no-current-season and invalid-player-batch failures.

| v2 | v3 |
|---|---|
| `client.assets.getCurrentSeason(platform)` | `client.assets.getActiveSeason(platform)` — reads Season Activity from bundled dates. `client.seasons.getCurrentSeason()` (asks PUBG) is unchanged |
| `ITEM_DICTIONARY`, `VEHICLE_DICTIONARY`, `MAP_DICTIONARY`, `MAP_NAMES`, `GAME_MODE_DICTIONARY`, `GAME_MODES`, `DAMAGE_CAUSER_DICTIONARY`, `DAMAGE_CAUSER_NAME`, `SEASONS_DATA` | Removed. Use `client.assets.getItemName()`, `getVehicleName()`, `getMapName()`, `getGameModeName()`, `getDamageCauserName()`, `getSeasonsByPlatform()` |
| `AssetItemDictionary`, `AssetVehicleDictionary`, `MapDictionary` types | Removed; they were `Record<string, string>` |
| `PubgClientOptions` type | Removed; it duplicated the request settings already on `PubgClientConfig` |
| `Seasons.getCurrentSeason()` rejecting with a plain `Error` | Rejects with `PubgNotFoundError` |
| `Players.getPlayerSeasonStatsBatch()` / `getPlayerLifetimeStatsBatch()` rejecting with `RangeError` | Reject with `PubgValidationError` |

`ItemId`, `VehicleId`, `MapId`, `AssetMapName`, `AssetPlatform`, `SeasonData`, `SeasonsData`, and
the telemetry enum types remain exported and are now generated from the bundled JSON, so they can
no longer drift from what the catalog resolves at runtime.

`debug` is now declared as a runtime dependency (the compiled package always imported it);
`validator` is no longer installed.

Item and vehicle metadata, including category and search results, are now caller-owned copies.
Compare records by `id` rather than object identity. Editing a returned record no longer changes
future catalog reads. Inherited object properties are treated as unknown identifiers.

Dot-only endpoint identifiers (`.` and `..`) now raise `PubgValidationError` before a request is
sent. Production request timeouts now report `PubgNetworkError.networkOperation === 'timeout'`
instead of being classified as connection failures; telemetry errors remain redacted.

## Season lookups

```ts
// Bundled dates, synchronous, no network
const active = client.assets.getActiveSeason('PC');

// What PUBG reports right now
const current = await client.seasons.getCurrentSeason();
```

## Catching errors

```ts
import { PubgApiError, PubgValidationError } from '@j03fr0st/pubg-ts';

try {
  await client.players.getPlayerSeasonStatsBatch({ seasonId, gameMode, playerIds: [] });
} catch (error) {
  if (error instanceof PubgValidationError) {
    // batch size was invalid; no request was sent
  }
}
```

The errors listed above extend `PubgApiError`, as do mapped request failures and the Asset
Catalog's explicit validation errors. An `instanceof PubgApiError` check covers those failures.
Other malformed inputs can still produce native JavaScript errors; for example, catalog name
lookups expect strings and do not validate their arguments. Their behavior is unchanged.

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
