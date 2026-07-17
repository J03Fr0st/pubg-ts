import type { Shard } from '../types/common';

type EndpointQueryValue = string | number | readonly string[] | undefined;

/** Builds an encoded PUBG endpoint target from path segments and query values. */
export const endpointTarget = (
  shard: Shard,
  pathSegments: readonly string[],
  query: Readonly<Record<string, EndpointQueryValue>> = {}
): string => {
  const path = `/shards/${encodeURIComponent(shard)}/${pathSegments
    .map(encodeURIComponent)
    .join('/')}`;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    params.append(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};
