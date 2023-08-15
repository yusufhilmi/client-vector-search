import { EmbeddingCache } from "../src/cache";

describe("EmbeddingCache", () => {
  it("should store and retrieve values", () => {
    const cache = new EmbeddingCache();
    const key = "test";
    const value = [1, 2, 3];
    cache.set(key, value);
    expect(cache.get(key)).toEqual(value);
  });
});
