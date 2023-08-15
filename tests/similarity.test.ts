import { Similarity } from "../src/similarity";

describe("Similarity", () => {
  it("should calculate cosine similarity", () => {
    const vecA = [1, 2];
    const vecB = [2, 3];
    const result = Similarity.cosineSimilarity(vecA, vecB);
    expect(result).toBeCloseTo(0.9923, 4);
  });
});
