import {
  appendArrayFilter,
  appendPageParams,
  appendQuery,
  appendValue,
  shardPath,
} from '../../src/api/endpoint-query';

describe('endpoint query helpers', () => {
  it('builds shard paths without hiding endpoint paths', () => {
    expect(shardPath('pc-na', '/players')).toBe('/shards/pc-na/players');
    expect(shardPath('steam', '/matches/match-1')).toBe('/shards/steam/matches/match-1');
  });

  it('appends URLSearchParams queries only when parameters exist', () => {
    const params = new URLSearchParams();

    expect(appendQuery('/shards/pc-na/players', params)).toBe('/shards/pc-na/players');

    params.append('filter[playerNames]', 'TestPlayer');

    expect(appendQuery('/shards/pc-na/players', params)).toBe(
      '/shards/pc-na/players?filter%5BplayerNames%5D=TestPlayer'
    );
  });

  it('appends comma-joined array filters in call order', () => {
    const params = new URLSearchParams();

    appendArrayFilter(params, 'filter[playerIds]', ['player-1', 'player-2']);
    appendArrayFilter(params, 'filter[gameMode]', ['squad', 'duo']);
    appendArrayFilter(params, 'filter[playerNames]');

    expect(params.toString()).toBe(
      'filter%5BplayerIds%5D=player-1%2Cplayer-2&filter%5BgameMode%5D=squad%2Cduo'
    );
  });

  it('appends page parameters using existing truthy value rules', () => {
    const params = new URLSearchParams();

    appendPageParams(params, { pageSize: 10, offset: 20 });
    appendPageParams(params, { pageSize: 0, offset: 0 });

    expect(params.toString()).toBe('page%5Blimit%5D=10&page%5Boffset%5D=20');
  });

  it('appends scalar values only when present', () => {
    const params = new URLSearchParams();

    appendValue(params, 'sort', '-createdAt');
    appendValue(params, 'filter[createdAt-start]');

    expect(params.toString()).toBe('sort=-createdAt');
  });
});
