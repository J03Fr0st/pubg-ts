import type { Shard } from '../types/common';

declare const endpointTargetBrand: unique symbol;

/**
 * Shard-scoped, fully encoded PUBG path and query.
 *
 * Only {@link endpointTarget} produces one, so a plain string — such as a Match Telemetry asset
 * URL — cannot be passed where PUBG data is being addressed. Identifiers stay single path
 * segments even when they contain reserved URL characters.
 */
export type EndpointTarget = string & { readonly [endpointTargetBrand]: 'EndpointTarget' };

type EndpointQueryValue = string | number | readonly string[] | undefined;

/**
 * Builds an Endpoint Target from path segments and query values.
 *
 * Absent and falsy scalar values (including `0`) are omitted; array values are joined with commas
 * and kept even when empty.
 */
export const endpointTarget = (
  shard: Shard,
  pathSegments: readonly string[],
  query: Readonly<Record<string, EndpointQueryValue>> = {}
): EndpointTarget => {
  const path = `/shards/${encodeURIComponent(shard)}/${pathSegments
    .map(encodeURIComponent)
    .join('/')}`;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    params.append(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const queryString = params.toString();
  return (queryString ? `${path}?${queryString}` : path) as EndpointTarget;
};

/** Decoded view of an Endpoint Target for callers that verify targets rather than send them. */
export interface EndpointTargetParts {
  /** Decoded path segments after the leading slash, e.g. `['shards', 'steam', 'players']`. */
  readonly segments: readonly string[];
  /** Decoded query values keyed by their PUBG parameter name, e.g. `filter[playerIds]`. */
  readonly query: Readonly<Record<string, string>>;
}

/** Inverse of {@link endpointTarget}: exposes the segments and query an encoded target carries. */
export const describeEndpointTarget = (target: EndpointTarget): EndpointTargetParts => {
  const [encodedPath, encodedQuery = ''] = target.split('?', 2);

  return {
    segments: encodedPath.split('/').slice(1).map(decodeURIComponent),
    query: Object.fromEntries(new URLSearchParams(encodedQuery)),
  };
};
