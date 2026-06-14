import type { Shard } from '../types/common';

interface PageQuery {
  pageSize?: number;
  offset?: number;
}

export const shardPath = (shard: Shard, path: string): string => `/shards/${shard}${path}`;

export const appendQuery = (path: string, params: URLSearchParams): string => {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

export const appendArrayFilter = (
  params: URLSearchParams,
  key: string,
  values?: string[]
): void => {
  if (values) {
    params.append(key, values.join(','));
  }
};

export const appendPageParams = (params: URLSearchParams, query: PageQuery): void => {
  if (query.pageSize) {
    params.append('page[limit]', query.pageSize.toString());
  }

  if (query.offset) {
    params.append('page[offset]', query.offset.toString());
  }
};

export const appendValue = (params: URLSearchParams, key: string, value?: string): void => {
  if (value) {
    params.append(key, value);
  }
};
