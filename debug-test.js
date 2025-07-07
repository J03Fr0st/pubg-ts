require('dotenv').config({ path: '.env.test' });

const { PubgClient } = require('./dist/index.js');

const DEBUG = require('debug');
DEBUG.enabled = function() { return true; };

async function testAPI() {
  console.log('Starting debug test...');
  console.log('API Key exists:', !!process.env.PUBG_API_KEY);
  console.log('API Key length:', process.env.PUBG_API_KEY?.length);
  console.log('Shard:', process.env.PUBG_SHARD);
  
  const client = new PubgClient({
    apiKey: process.env.PUBG_API_KEY,
    shard: process.env.PUBG_SHARD || 'pc-na'
  });

  try {
    console.log('Making API call...');
    const response = await client.players.getPlayerByName('J03Fr0st');
    console.log('Response received:', response);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

testAPI();