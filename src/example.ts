import 'dotenv/config';
import { PubgClient } from './index';

async function _example() {
  const client = new PubgClient({
    apiKey: 'your-api-key-here',
    shard: 'pc-na',
  });

  try {
    // Get player by name
    const playerResponse = await client.players.getPlayerByName('shroud');
    console.log('Player:', playerResponse.data[0].attributes.name);

    // Get current season
    const seasonResponse = await client.seasons.getCurrentSeason();
    console.log('Current Season:', seasonResponse.data[0].id);

    // Get player season stats
    const statsResponse = await client.players.getPlayerSeasonStats({
      playerId: playerResponse.data[0].id,
      seasonId: seasonResponse.data[0].id,
    });
    console.log('Player Stats:', statsResponse.data[0].attributes.gameModeStats);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage (uncomment to run):
// example().catch(console.error);
