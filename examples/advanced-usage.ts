import 'dotenv/config';
import { PubgClient, PubgNotFoundError, PubgRateLimitError } from '../src/index';

async function advancedExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });

  try {
    // Batch player lookup with error handling
    const playerNames = ['shroud', 'ninja', 'DrDisrespect'];
    console.log('🔍 Looking up multiple players...');

    const playerPromises = playerNames.map(async (name) => {
      try {
        const response = await client.players.getPlayerByName(name);
        return { name, player: response.data[0], error: null };
      } catch (error) {
        return { name, player: null, error };
      }
    });

    const results = await Promise.all(playerPromises);

    results.forEach(({ name, player, error }) => {
      if (player) {
        console.log(`✅ Found ${name}: ${player.id}`);
      } else {
        console.log(`❌ Failed to find ${name}:`, error?.message);
      }
    });

    // Get matches with filtering
    console.log('🎮 Getting recent matches...');
    const matchesResponse = await client.matches.getMatches({
      pageSize: 5,
      sort: '-createdAt',
      filter: {
        createdAt: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        },
        gameMode: ['squad', 'squad-fpp'],
      },
    });

    console.log(`✅ Found ${matchesResponse.data.length} recent matches`);

    // Get detailed match information
    if (matchesResponse.data.length > 0) {
      const firstMatch = matchesResponse.data[0];
      console.log('📊 Getting match details...');

      const matchDetails = await client.matches.getMatch(firstMatch.id);

      console.log('✅ Match details:', {
        id: matchDetails.data.id,
        gameMode: matchDetails.data.attributes.gameMode,
        mapName: matchDetails.data.attributes.mapName,
        duration: `${Math.round(matchDetails.data.attributes.duration / 60)} minutes`,
        players: matchDetails.included.filter((item) => item.type === 'participant').length,
      });

      // Get telemetry data if available
      const telemetryAsset = matchDetails.included.find(
        (item) => item.type === 'asset' && item.attributes.name === 'telemetry'
      );

      if (telemetryAsset) {
        console.log('📡 Getting telemetry data...');
        const telemetryData = await client.telemetry.getTelemetryData(
          telemetryAsset.attributes.URL
        );

        console.log(`✅ Telemetry events: ${telemetryData.length}`);

        // Analyze kill events
        const killEvents = telemetryData.filter((event) => event._T === 'LogPlayerKill');
        console.log(`🔫 Kill events: ${killEvents.length}`);
      }
    }

    // Get leaderboards
    console.log('🏆 Getting leaderboards...');
    const seasonsResponse = await client.seasons.getCurrentSeason();
    const currentSeason = seasonsResponse.data[0];

    const leaderboardResponse = await client.leaderboards.getLeaderboard({
      seasonId: currentSeason.id,
      gameMode: 'squad',
      pageSize: 10,
    });

    console.log('✅ Top 10 squad players:');
    leaderboardResponse.data[0].attributes.rankedStats.slice(0, 10).forEach((player, index) => {
      console.log(`${index + 1}. ${player.playerName} (${player.rankPoints} RP)`);
    });
  } catch (error) {
    if (error instanceof PubgRateLimitError) {
      console.error(`⏳ Rate limited. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof PubgNotFoundError) {
      console.error('🔍 Resource not found:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Rate limiting and retry example
async function rateLimitExample() {
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY || 'your-api-key-here',
    shard: 'pc-na',
  });

  console.log('🚀 Testing rate limiting...');

  // Make multiple rapid requests to test rate limiting
  const requests = Array.from({ length: 15 }, (_, i) =>
    client.players.getPlayerByName(`player${i}`).catch((error) => ({ error }))
  );

  const results = await Promise.all(requests);

  const successful = results.filter((r) => !('error' in r)).length;
  const rateLimited = results.filter(
    (r) => 'error' in r && r.error instanceof PubgRateLimitError
  ).length;

  console.log(`✅ Successful requests: ${successful}`);
  console.log(`⏳ Rate limited requests: ${rateLimited}`);

  const status = client.getRateLimitStatus();
  console.log('📊 Current rate limit status:', status);
}

if (require.main === module) {
  Promise.resolve()
    .then(() => advancedExample())
    .then(() => rateLimitExample())
    .catch(console.error);
}
