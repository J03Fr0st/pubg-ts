import { PubgClient } from '../src/index';

async function basicExample() {
  // Initialize client with API key and shard
  const client = new PubgClient({
    apiKey: 'your-api-key-here', // Get from https://developer.pubg.com
    shard: 'pc-na', // Platform and region
    timeout: 10000, // Request timeout
    retryAttempts: 3, // Retry failed requests
  });

  try {
    // Get player by name
    console.log('🔍 Looking up player...');
    const playerResponse = await client.players.getPlayerByName('shroud');
    const player = playerResponse.data[0];

    console.log('✅ Player found:', {
      name: player.attributes.name,
      id: player.id,
      created: player.attributes.createdAt,
    });

    // Get current season
    console.log('📅 Getting current season...');
    const seasonResponse = await client.seasons.getCurrentSeason();
    const currentSeason = seasonResponse.data[0];

    console.log('✅ Current season:', currentSeason.id);

    // Get player season stats
    console.log('📊 Getting player stats...');
    const statsResponse = await client.players.getPlayerSeasonStats({
      playerId: player.id,
      seasonId: currentSeason.id,
    });

    const stats = statsResponse.data[0].attributes.gameModeStats.squad;
    if (stats) {
      console.log('✅ Squad stats:', {
        kills: stats.kills,
        wins: stats.wins,
        top10s: stats.top10s,
        kd: (stats.kills / Math.max(stats.losses, 1)).toFixed(2),
      });
    }

    // Check rate limit status
    const rateLimitStatus = client.getRateLimitStatus();
    console.log('⏱️  Rate limit:', {
      remaining: rateLimitStatus.remaining,
      resetIn: `${Math.ceil((rateLimitStatus.resetTime - Date.now()) / 1000)}s`,
    });

    // Check cache statistics
    const cacheStats = client.getCacheStats();
    console.log('💾 Cache stats:', cacheStats);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Enable debug logging by setting environment variable:
// DEBUG=pubg-ts:* node examples/basic-usage.js
if (require.main === module) {
  basicExample().catch(console.error);
}
