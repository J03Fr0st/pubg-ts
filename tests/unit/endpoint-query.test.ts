import { endpointTarget } from '../../src/api/endpoint-query';

describe('endpointTarget', () => {
  it('builds a shard target from encoded path segments', () => {
    expect(endpointTarget('pc-na', ['players'])).toBe('/shards/pc-na/players');
    expect(endpointTarget('steam', ['matches', 'match/one?source=test'])).toBe(
      '/shards/steam/matches/match%2Fone%3Fsource%3Dtest'
    );
  });

  it('keeps an untrusted runtime shard within one path segment', () => {
    expect(endpointTarget('steam/../matches' as any, ['players'])).toBe(
      '/shards/steam%2F..%2Fmatches/players'
    );
  });

  it('serializes scalar, numeric, and array query values in call order', () => {
    expect(
      endpointTarget('pc-na', ['matches'], {
        'page[limit]': 10,
        sort: '-createdAt',
        'filter[playerIds]': ['player-1', 'player-2'],
      })
    ).toBe(
      '/shards/pc-na/matches?page%5Blimit%5D=10&sort=-createdAt&filter%5BplayerIds%5D=player-1%2Cplayer-2'
    );
  });

  it('omits absent and zero-valued query parameters', () => {
    expect(
      endpointTarget('pc-na', ['matches'], {
        'page[limit]': 0,
        'page[offset]': undefined,
      })
    ).toBe('/shards/pc-na/matches');
  });

  it('preserves empty array filters as empty query values', () => {
    expect(endpointTarget('pc-na', ['players'], { 'filter[playerIds]': [] })).toBe(
      '/shards/pc-na/players?filter%5BplayerIds%5D='
    );
  });
});
