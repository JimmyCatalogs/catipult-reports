class Cache {
  constructor(ttl = 300000) { // Default TTL: 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(params) {
    return JSON.stringify(params);
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const dataCache = new Cache();
