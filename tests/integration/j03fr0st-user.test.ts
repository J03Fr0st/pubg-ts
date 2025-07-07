import 'dotenv/config';

// Disable axios mock for integration tests
jest.unmock('axios');

import { PubgClient } from '../../src/api/client';
import type { PubgClientConfig } from '../../src/types/api';
import {
  PubgApiError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgAuthenticationError
} from '../../src/errors';

describe('J03Fr0st User Integration Tests', () => {
  let client: PubgClient;
  let config: PubgClientConfig;
  const testPlayerName = 'J03Fr0st';

  beforeEach(() => {
    config = {
      apiKey: process.env.PUBG_API_KEY || 'test-api-key',
      shard: 'steam',
    };

    client = new PubgClient(config);
  });

  beforeAll(() => {
    // Skip all tests if no API key is provided
    if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
      console.warn('⚠️  Skipping J03Fr0st integration tests - no valid PUBG_API_KEY provided');
      console.warn('   Set PUBG_API_KEY environment variable to run these tests');
    }
  });

  describe('Player Data Retrieval', () => {
    it('should successfully find J03Fr0st player by name', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      try {
        const response = await client.players.getPlayers({
          playerNames: [testPlayerName]
        });

        expect(response).toBeDefined();
        expect(response.data).toBeInstanceOf(Array);
        expect(response.data.length).toBeGreaterThan(0);

        const player = response.data[0];
        expect(player).toBeDefined();
        expect(player.attributes.name).toBe(testPlayerName);
        expect(player.id).toBeDefined();
        expect(player.attributes.shardId).toBeDefined();

        console.log(`✅ Found player: ${player.attributes.name} (ID: ${player.id})`);
        console.log(`   Shard: ${player.attributes.shardId}`);
        console.log(`   Created: ${player.attributes.createdAt}`);

      } catch (error) {
        if (error instanceof PubgNotFoundError) {
          console.warn(`⚠️  Player '${testPlayerName}' not found on shard '${config.shard}'`);
          console.warn('   Try different shard or check player name spelling');
        } else if (error instanceof PubgAuthenticationError) {
          console.error('❌ Authentication failed - check your API key');
        } else if (error instanceof PubgRateLimitError) {
          console.warn('⏱️  Rate limit exceeded - try again later');
        } else {
          console.error('❌ Unexpected error:', error);
        }
        throw error;
      }
    });

    it('should get J03Fr0st player by direct name lookup', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      try {
        const response = await client.players.getPlayerByName(testPlayerName);

        expect(response).toBeDefined();
        expect(response.data).toBeInstanceOf(Array);
        expect(response.data.length).toBeGreaterThan(0);

        const player = response.data[0];
        expect(player.attributes.name).toBe(testPlayerName);
        expect(player.id).toBeDefined();

        console.log(`✅ Direct lookup successful for ${testPlayerName}`);
        console.log(`   Player ID: ${player.id}`);

      } catch (error) {
        if (error instanceof PubgNotFoundError) {
          // Try different shards if player not found
          const alternateShard = config.shard === 'pc-na' ? 'pc-eu' : 'pc-na';
          console.warn(`⚠️  Player not found on ${config.shard}, you might try shard: ${alternateShard}`);
        }
        throw error;
      }
    });
  });

  describe('Player Match History', () => {
    it('should retrieve recent matches for J03Fr0st', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      try {
        const response = await client.players.getPlayerByName(testPlayerName);
        const player = response.data[0];

        expect(player.relationships.matches.data).toBeDefined();

        if (player.relationships.matches.data.length === 0) {
          console.warn(`⚠️  Player ${testPlayerName} has no recent matches - this is normal for inactive players`);
          return;
        }

        const recentMatches = player.relationships.matches.data.slice(0, 3); // Get 3 most recent
        console.log(`✅ Found ${player.relationships.matches.data.length} total matches for ${testPlayerName}`);
        console.log(`   Recent match IDs: ${recentMatches.map(m => m.id.slice(0, 8)).join(', ')}...`);

        // Test getting detailed match data
        if (recentMatches.length > 0) {
          const matchId = recentMatches[0].id;
          const matchDetails = await client.matches.getMatch(matchId);

          expect(matchDetails).toBeDefined();
          expect(matchDetails.data.id).toBe(matchId);
          expect(matchDetails.data.attributes).toBeDefined();

          console.log(`✅ Retrieved match details for: ${matchId.slice(0, 8)}...`);
          console.log(`   Game Mode: ${matchDetails.data.attributes.gameMode}`);
          console.log(`   Map: ${matchDetails.data.attributes.mapName}`);
          console.log(`   Match Type: ${matchDetails.data.attributes.matchType}`);
          console.log(`   Duration: ${matchDetails.data.attributes.duration}s`);

          // Find J03Fr0st's participant data in the match
          const participants = matchDetails.included?.filter(item => item.type === 'participant') || [];
          const playerParticipant = participants.find(p =>
            p.attributes?.stats?.name === testPlayerName
          );

          if (playerParticipant) {
            console.log(`✅ Found ${testPlayerName} in match participants`);
            console.log(`   Placement: #${playerParticipant.attributes.stats.winPlace}`);
            console.log(`   Kills: ${playerParticipant.attributes.stats.kills}`);
            console.log(`   Damage: ${Math.round(playerParticipant.attributes.stats.damageDealt)}`);
            console.log(`   Survival Time: ${Math.round(playerParticipant.attributes.stats.timeSurvived)}s`);
          }
        }

      } catch (error) {
        console.error('❌ Failed to retrieve match history:', error);
        throw error;
      }
    });
  });

  describe('Player Season Statistics', () => {
    it('should retrieve season stats for J03Fr0st', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      try {
        // First get the player
        const response = await client.players.getPlayerByName(testPlayerName);
        const player = response.data[0];

        // Get current season
        const seasons = await client.seasons.getSeasons();
        const currentSeason = seasons.data.find(s => s.attributes.isCurrentSeason) || seasons.data[0];

        if (!currentSeason) {
          console.warn('⚠️  No current season found, skipping season stats test');
          return;
        }

        // Get player season stats
        const seasonStats = await client.players.getPlayerSeasonStats({
          playerId: player.id,
          seasonId: currentSeason.id
        });

        expect(seasonStats).toBeDefined();

        // Handle both array and object responses for season stats
        let playerSeasonData;
        if (Array.isArray(seasonStats.data)) {
          expect(seasonStats.data.length).toBeGreaterThan(0);
          playerSeasonData = seasonStats.data[0];
        } else {
          // Some endpoints return an object instead of array
          playerSeasonData = seasonStats.data;
        }
        expect(playerSeasonData.attributes.gameModeStats).toBeDefined();

        console.log(`✅ Retrieved season stats for ${testPlayerName}`);
        console.log(`   Season: ${currentSeason.id}`);

        // Display stats for each game mode
        const gameModeStats = playerSeasonData.attributes.gameModeStats;
        Object.entries(gameModeStats).forEach(([mode, stats]) => {
          if (stats && typeof stats === 'object' && 'roundsPlayed' in stats) {
            const modeStats = stats as any; // Type assertion for game mode stats
            console.log(`   ${mode.toUpperCase()}:`);
            console.log(`     Rounds Played: ${modeStats.roundsPlayed}`);
            console.log(`     Wins: ${modeStats.wins}`);
            console.log(`     Top 10s: ${modeStats.top10s}`);
            console.log(`     Kills: ${modeStats.kills}`);
            console.log(`     Average Damage: ${Math.round(modeStats.damageDealt / Math.max(modeStats.roundsPlayed, 1))}`);
          }
        });

      } catch (error) {
        console.error('❌ Failed to retrieve season stats:', error);
        throw error;
      }
    });
  });

  describe('Asset Integration with Player Data', () => {
    it('should enhance match data with asset information', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      try {
        const response = await client.players.getPlayerByName(testPlayerName);
        const player = response.data[0];

        if (player.relationships.matches.data.length === 0) {
          console.warn('⚠️  No matches found for asset integration test');
          return;
        }

        const matchId = player.relationships.matches.data[0].id;
        const matchDetails = await client.matches.getMatch(matchId);

        // Test asset integration
        const mapId = matchDetails.data.attributes.mapName;
        const enhancedMapName = client.assets.getMapName(mapId as any);

        console.log(`✅ Asset integration test:`);
        console.log(`   Raw map ID: ${mapId}`);
        console.log(`   Enhanced map name: ${enhancedMapName || 'Unknown'}`);

        // Test telemetry URL if available
        const telemetryAsset = matchDetails.included?.find(
          item => item.type === 'asset' && item.attributes.name === 'telemetry'
        );

        if (telemetryAsset?.attributes && 'URL' in telemetryAsset.attributes) {
          const telemetryUrl = (telemetryAsset.attributes as any).URL;
          console.log(`   Telemetry URL available: ${telemetryUrl.substring(0, 50)}...`);

          // Test telemetry data retrieval (first few events only)
          try {
            const telemetryData = await client.telemetry.getTelemetryData(telemetryUrl);
            console.log(`   Telemetry events: ${telemetryData.length}`);

            if (telemetryData.length > 0) {
              console.log(`   First event type: ${telemetryData[0]._T}`);
              console.log(`   Last event type: ${telemetryData[telemetryData.length - 1]._T}`);
            }
          } catch (telemetryError) {
            console.warn('⚠️  Could not retrieve telemetry data (this is often normal)');
          }
        }

      } catch (error) {
        console.error('❌ Failed asset integration test:', error);
        throw error;
      }
    });
  });

  describe('SDK Features with Real Data', () => {
    it('should demonstrate caching with J03Fr0st lookups', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      // Clear cache first
      client.clearCache();
      let initialStats = client.getCacheStats();
      expect(initialStats.size).toBe(0);

      // First lookup (should cache)
      const startTime1 = Date.now();
      await client.players.getPlayerByName(testPlayerName);
      const duration1 = Date.now() - startTime1;

      let afterFirstCall = client.getCacheStats();
      expect(afterFirstCall.size).toBeGreaterThan(0);

      // Second lookup (should use cache)
      const startTime2 = Date.now();
      await client.players.getPlayerByName(testPlayerName);
      const duration2 = Date.now() - startTime2;

      console.log(`✅ Cache performance test:`);
      console.log(`   First call: ${duration1}ms`);
      console.log(`   Second call (cached): ${duration2}ms`);
      console.log(`   Cache entries: ${afterFirstCall.size}`);
      console.log(`   Speed improvement: ${Math.round(((duration1 - duration2) / duration1) * 100)}%`);

      // Second call should generally be faster due to caching
      expect(duration2).toBeLessThanOrEqual(duration1);
    });

    it('should demonstrate rate limiting', () => {
      const initialStatus = client.getRateLimitStatus();

      expect(initialStatus.remaining).toBeGreaterThan(0);
      expect(initialStatus.resetTime).toBeGreaterThan(Date.now());

      console.log(`✅ Rate limiting status:`);
      console.log(`   Requests remaining: ${initialStatus.remaining}`);
      console.log(`   Reset time: ${new Date(initialStatus.resetTime).toISOString()}`);
    });

    it('should test asset search with items from J03Fr0st matches', async () => {
      // Test asset search functionality
      const akResults = client.assets.searchItems('ak');
      const sniperResults = client.assets.searchItems('sniper');

      expect(akResults.length).toBeGreaterThan(0);
      console.log(`✅ Asset search test:`);
      console.log(`   'ak' search results: ${akResults.length} items`);
      console.log(`   'sniper' search results: ${sniperResults.length} items`);

      // Test specific item lookups
      const ak47Name = client.assets.getItemName('Item_Weapon_AK47_C');
      const m416Name = client.assets.getItemName('Item_Weapon_HK416_C');

      console.log(`   AK47: ${ak47Name}`);
      console.log(`   M416: ${m416Name}`);

      expect(ak47Name).toBeDefined();
      expect(m416Name).toBeDefined();
    });
  });

  describe('Error Handling with Real API', () => {
    it('should handle non-existent player gracefully', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      const fakePlayerName = 'ThisPlayerDoesNotExist12345XYZ';

      await expect(client.players.getPlayerByName(fakePlayerName))
        .rejects.toThrow(PubgNotFoundError);

      console.log(`✅ Correctly handled non-existent player: ${fakePlayerName}`);
    });

    it('should handle invalid match ID gracefully', async () => {
      if (!process.env.PUBG_API_KEY || process.env.PUBG_API_KEY === 'test-api-key') {
        return; // Skip test
      }

      const fakeMatchId = 'invalid-match-id-12345';

      await expect(client.matches.getMatch(fakeMatchId))
        .rejects.toThrow(PubgNotFoundError);

      console.log(`✅ Correctly handled invalid match ID: ${fakeMatchId}`);
    });
  });
});
