export class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    const promise = factory();
    this.pending.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }
}
