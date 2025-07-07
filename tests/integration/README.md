# Integration Tests for J03Fr0st User

This directory contains integration tests that validate the PUBG TypeScript SDK using real API calls with the player "J03Fr0st".

## Setup

### 1. Get a PUBG API Key
1. Visit [PUBG Developer Portal](https://developer.pubg.com)
2. Create an account and generate an API key
3. Note the rate limits (10 requests per minute for free tier)

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.test.example .env.test

# Edit .env.test and add your real API key
PUBG_API_KEY=your_actual_api_key_here
PUBG_SHARD=pc-na  # Adjust based on where J03Fr0st plays
```

### 3. Build the Project
```bash
npm run build
```

## Running the Tests

### Run J03Fr0st Specific Tests
```bash
# Run the J03Fr0st integration tests
npm run test:j03fr0st

# Run with verbose output for detailed information
npm run test:j03fr0st:verbose

# Run with debug logging
DEBUG=pubg-ts:* npm run test:j03fr0st
```

### Run All Integration Tests
```bash
# Run all integration tests (including J03Fr0st)
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage
```

## What the Tests Cover

### 🎮 Player Data Retrieval
- ✅ Find J03Fr0st by player name
- ✅ Validate player data structure
- ✅ Handle different shards (pc-na, pc-eu, etc.)

### 🎯 Match History Analysis
- ✅ Retrieve recent matches for J03Fr0st
- ✅ Get detailed match information
- ✅ Find J03Fr0st's participant data in matches
- ✅ Display match statistics (kills, damage, placement)

### 📊 Season Statistics
- ✅ Get current season information
- ✅ Retrieve J03Fr0st's season stats
- ✅ Display stats for all game modes (solo, duo, squad)

### 🔧 SDK Feature Validation
- ✅ Caching performance comparison
- ✅ Rate limiting status
- ✅ Asset integration with match data
- ✅ Error handling for invalid requests

### 🛡️ Error Handling
- ✅ Non-existent player handling
- ✅ Invalid match ID handling
- ✅ Authentication errors
- ✅ Rate limit exceeded scenarios

## Expected Output

When the tests run successfully, you'll see detailed console output like:

```
✅ Found player: J03Fr0st (ID: account.abc123...)
   Shard: pc-na
   Created: 2018-01-01T00:00:00Z

✅ Found 25 total matches for J03Fr0st
   Recent match IDs: a1b2c3d4, e5f6g7h8, i9j0k1l2...

✅ Retrieved match details for: a1b2c3d4...
   Game Mode: squad-fpp
   Map: Baltic_Main
   Match Type: official
   Duration: 1847s

✅ Found J03Fr0st in match participants
   Placement: #3
   Kills: 7
   Damage: 892
   Survival Time: 1734s

✅ Retrieved season stats for J03Fr0st
   Season: division.bro.official.pc-2018-19
   SOLO:
     Rounds Played: 45
     Wins: 2
     Top 10s: 12
     Kills: 156
     Average Damage: 287
```

## Troubleshooting

### ⚠️ Player Not Found
If J03Fr0st is not found, try different shards:
```bash
# Try EU servers
PUBG_SHARD=pc-eu npm run test:j03fr0st

# Try Asia servers  
PUBG_SHARD=pc-as npm run test:j03fr0st

# Try console (xbox/ps4)
PUBG_SHARD=xbox-na npm run test:j03fr0st
```

### 🔑 Authentication Errors
- Verify your API key is correct
- Check that the API key is active on the PUBG developer portal
- Ensure you haven't exceeded rate limits

### 🚫 Rate Limit Exceeded
- Wait 1 minute between test runs
- Consider upgrading to a paid API plan for higher limits
- Run tests individually instead of all at once

### 🌐 Network Issues
- Check your internet connection
- PUBG API servers might be temporarily unavailable
- Try running tests at a different time

## Useful Commands

```bash
# Run a specific test
npm run test:j03fr0st -- --testNamePattern="Player Data Retrieval"

# Run tests with timeout for slow connections
npm run test:j03fr0st -- --testTimeout=30000

# Run tests and save output to file
npm run test:j03fr0st > j03fr0st-test-results.txt 2>&1

# Check API key is working
DEBUG=pubg-ts:http npm run test:j03fr0st -- --testNamePattern="should successfully find"
```

## Test Data Usage

These integration tests use real PUBG API data for the player "J03Fr0st". The tests:
- Do NOT modify any data (read-only operations)
- Respect PUBG API rate limits
- Cache responses to minimize API calls
- Handle errors gracefully without breaking

The tests are designed to validate that the SDK works correctly with real-world data patterns and edge cases that might be encountered when using the API with actual player information.