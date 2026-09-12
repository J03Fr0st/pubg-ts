import type { AxiosRequestConfig } from 'axios';
import {
  PubgApiError,
  PubgAuthenticationError,
  PubgNetworkError,
  PubgNotFoundError,
  PubgRateLimitError,
  PubgValidationError,
} from '../../errors';
import type { RequestOutcome } from '../client-health';

const SERVER_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const DEFAULT_RETRY_AFTER_SECONDS = 60;
const TELEMETRY_ENDPOINT = 'external_telemetry';
const TELEMETRY_ERROR_MESSAGE = 'External telemetry request failed';

/**
 * One interpretation of a failed adapter call. Retry, Client Health, and error mapping all read
 * this value so a status code is decoded exactly once per failure.
 */
export type RequestFailure =
  | {
      kind: 'authentication' | 'not_found' | 'validation';
      outcome: RequestOutcome;
      statusCode: number;
    }
  | {
      kind: 'rate_limited';
      outcome: RequestOutcome;
      retryAfter: number;
      statusCode: 429;
    }
  | { kind: 'server'; outcome: RequestOutcome; statusCode: number }
  | { kind: 'api'; outcome: RequestOutcome; statusCode?: number }
  | {
      kind: 'network';
      errorCode?: string;
      networkOperation: PubgNetworkError['networkOperation'];
      outcome: RequestOutcome;
    };

type NetworkFailure = Extract<RequestFailure, { kind: 'network' }>;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const networkOperationFor = (code: string | undefined): PubgNetworkError['networkOperation'] => {
  switch (code) {
    case 'ECONNREFUSED':
    case 'ECONNRESET':
    case 'ECONNABORTED':
      return 'connect';
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'dns';
    case 'ETIMEDOUT':
      return 'timeout';
    case 'CERT_HAS_EXPIRED':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      return 'ssl';
    default:
      return 'unknown';
  }
};

/** Decodes an adapter rejection into the semantic failure the runtime acts on. */
export const interpretFailure = (error: unknown): RequestFailure => {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord.response);
  const status = typeof response.status === 'number' ? response.status : undefined;

  if (status === 401) {
    return {
      kind: 'authentication',
      outcome: { kind: 'authentication_failed', statusCode: 401 },
      statusCode: 401,
    };
  }
  if (status === 400 || status === 404) {
    return {
      kind: status === 400 ? 'validation' : 'not_found',
      outcome: { kind: 'request_rejected', statusCode: status },
      statusCode: status,
    };
  }
  if (status === 429) {
    const headers = asRecord(response.headers);
    const parsedRetryAfter = Number.parseInt(
      String(headers['retry-after'] ?? DEFAULT_RETRY_AFTER_SECONDS),
      10
    );
    return {
      kind: 'rate_limited',
      outcome: { kind: 'rate_limited', statusCode: 429 },
      retryAfter:
        Number.isFinite(parsedRetryAfter) && parsedRetryAfter >= 0
          ? parsedRetryAfter
          : DEFAULT_RETRY_AFTER_SECONDS,
      statusCode: 429,
    };
  }
  if (typeof status === 'number' && status >= 500) {
    return {
      kind: SERVER_RETRY_STATUSES.has(status) ? 'server' : 'api',
      outcome: { kind: 'server_failed', statusCode: status },
      statusCode: status,
    };
  }

  if (Object.keys(response).length === 0) {
    const errorCode = typeof errorRecord.code === 'string' ? errorRecord.code : undefined;
    return {
      errorCode,
      kind: 'network',
      networkOperation: networkOperationFor(errorCode),
      outcome: { kind: 'network_failed' },
    };
  }

  return {
    kind: 'api',
    outcome:
      typeof status === 'number' && status >= 400 && status < 500
        ? { kind: 'request_rejected', statusCode: status }
        : { kind: 'network_failed' },
    statusCode: status,
  };
};

/** Only transient PUBG server errors are retried; everything else is a terminal outcome. */
export const isRetryable = (failure: RequestFailure): boolean => failure.kind === 'server';

/** Prefers the adapter's own request config so retries replay exactly what was sent. */
export const requestConfigOf = (
  error: unknown,
  fallbackConfig: AxiosRequestConfig
): AxiosRequestConfig => {
  const errorConfig = asRecord(error).config;
  return typeof errorConfig === 'object' && errorConfig !== null
    ? (errorConfig as AxiosRequestConfig)
    : fallbackConfig;
};

const mapNetworkError = (
  url: string,
  failure: NetworkFailure,
  timeout: number
): PubgNetworkError => {
  const messages: Record<PubgNetworkError['networkOperation'], string> = {
    connect: 'Connection failed',
    dns: 'DNS lookup failed',
    request: 'Request failed',
    ssl: 'SSL certificate error',
    timeout: 'Request timeout',
    unknown: 'Network error',
  };
  const metadata: Record<string, unknown> = { url, errorCode: failure.errorCode };
  if (failure.networkOperation === 'timeout') metadata.timeout = timeout;

  return new PubgNetworkError(
    messages[failure.networkOperation],
    failure.networkOperation,
    undefined,
    {
      operation: `network_${failure.networkOperation}`,
      metadata,
    }
  );
};

/**
 * Maps an authenticated PUBG request failure to its public error. The original error is never
 * attached, so request headers and credentials cannot leak through the error surface.
 */
export const mapRequestError = (
  error: unknown,
  fallbackConfig: AxiosRequestConfig,
  failure: RequestFailure,
  timeout: number
): PubgApiError => {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord.response);
  const responseData = asRecord(response.data);
  const responseErrors = Array.isArray(responseData.errors) ? responseData.errors : [];
  const firstResponseError = asRecord(responseErrors[0]);
  const message =
    typeof firstResponseError.detail === 'string'
      ? firstResponseError.detail
      : error instanceof Error
        ? error.message
        : 'Request failed';
  const errorConfig = requestConfigOf(error, fallbackConfig);
  const url = errorConfig.url || 'unknown';
  const context = { operation: 'http_request', metadata: { url, method: errorConfig.method } };

  switch (failure.kind) {
    case 'authentication':
      return new PubgAuthenticationError(message, context);
    case 'not_found':
      return new PubgNotFoundError(message, context);
    case 'validation':
      return new PubgValidationError(message, context);
    case 'rate_limited':
      return new PubgRateLimitError(message, failure.retryAfter, {
        ...context,
        metadata: { ...context.metadata, retryAfter: failure.retryAfter },
      });
    case 'server':
      return new PubgNetworkError(`Server error: ${message}`, 'request', undefined, {
        ...context,
        metadata: { ...context.metadata, statusCode: failure.statusCode },
      });
    case 'network':
      return mapNetworkError(url, failure, timeout);
    default:
      return new PubgApiError(message, failure.statusCode, response.data, context);
  }
};

/**
 * Maps a Match Telemetry failure to its public error. Telemetry URLs may carry credentials, so
 * the message and metadata are fixed strings that never echo the request.
 */
export const mapTelemetryError = (failure: RequestFailure): PubgApiError => {
  const metadata = { endpoint: TELEMETRY_ENDPOINT, method: 'get' };
  const context = { operation: TELEMETRY_ENDPOINT, metadata };

  switch (failure.kind) {
    case 'authentication':
      return new PubgAuthenticationError(TELEMETRY_ERROR_MESSAGE, context);
    case 'not_found':
      return new PubgNotFoundError(TELEMETRY_ERROR_MESSAGE, context);
    case 'validation':
      return new PubgValidationError(TELEMETRY_ERROR_MESSAGE, context);
    case 'rate_limited':
      return new PubgRateLimitError(TELEMETRY_ERROR_MESSAGE, failure.retryAfter, {
        ...context,
        metadata: { ...metadata, retryAfter: failure.retryAfter },
      });
    case 'server':
      return new PubgNetworkError(TELEMETRY_ERROR_MESSAGE, 'request', undefined, {
        ...context,
        metadata: { ...metadata, statusCode: failure.statusCode },
      });
    case 'network':
      return new PubgNetworkError(TELEMETRY_ERROR_MESSAGE, failure.networkOperation, undefined, {
        ...context,
        metadata: { ...metadata, errorCode: failure.errorCode },
      });
    default:
      return new PubgApiError(TELEMETRY_ERROR_MESSAGE, failure.statusCode, undefined, context);
  }
};
