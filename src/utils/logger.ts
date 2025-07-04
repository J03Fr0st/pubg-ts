import debug from 'debug';

// Create different debug loggers for different components
const createLogger = (namespace: string) => debug(`pubg-ts:${namespace}`);

export const logger = {
  http: createLogger('http'),
  rateLimit: createLogger('rate-limit'),
  cache: createLogger('cache'),
  error: createLogger('error'),
  client: createLogger('client'),
};

// Performance timing utility
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
