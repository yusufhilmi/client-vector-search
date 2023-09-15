import { LRUCache } from 'lru-cache';

class Cache {
  private static instance: LRUCache<string, any[]>;

  private constructor() {}

  public static getInstance(
    max: number = 10000,
    maxAge: number = 1000 * 60 * 10,
  ): LRUCache<string, any[]> {
    if (!Cache.instance) {
      const options = {
        max: max,
        length: () => 1,
        maxAge: maxAge,
      };
      Cache.instance = new LRUCache<string, any[]>(options);
    }
    return Cache.instance;
  }
}

export default Cache;
