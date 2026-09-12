import debug from 'debug';

const createLogger = (namespace: string) => debug(`pubg-ts:${namespace}`);

/** Debug loggers per runtime concern; enable with `DEBUG=pubg-ts:*`. */
export const logger = {
  http: createLogger('http'),
  cache: createLogger('cache'),
  client: createLogger('client'),
};

/** Runs `fn` while logging its start, duration, and failure through `loggerFn`. */
export const withTiming = async <T>(
  loggerFn: debug.Debugger,
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  loggerFn(`Starting ${operation}`);

  try {
    const result = await fn();
    const duration = Date.now() - start;
    loggerFn(`Completed ${operation} in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    loggerFn(`Failed ${operation} after ${duration}ms:`, error);
    throw error;
  }
};
