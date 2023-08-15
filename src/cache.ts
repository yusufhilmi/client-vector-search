export class EmbeddingCache {
  private cache: Map<string, number[]> = new Map();

  set(key: string, value: number[]): void {
    this.cache.set(key, value);
  }

  get(key: string): number[] | undefined {
    return this.cache.get(key);
  }
}
