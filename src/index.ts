/** Author: yusufhilmi
 * Let's keep everything here until it gets too big
 * My first npm package, can use help about design patterns, best practices!
 */

export const getEmbedding = async (
  text: string,
  options = { pooling: "mean", normalize: false },
  model = "Xenova/gte-small"
): Promise<number[]> => {
  const transformersModule = await import("@xenova/transformers");
  const { pipeline } = transformersModule;
  const pipe = await pipeline("feature-extraction", model);
  const output = await pipe(text, options);
  return Array.from(output.data);
};

export const cosineSimilarity = (
  vecA: number[],
  vecB: number[],
  precision: number = 6
): number => {
  // Check if both vectors have the same length
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  // Compute dot product and magnitudes
  const dotProduct = vecA.reduce((sum, a, i) => {
    const b = vecB[i]; // Extract value safely
    return sum + a * (b !== undefined ? b : 0); // Check for undefined
  }, 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  // Check if either magnitude is zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Calculate cosine similarity and round to specified precision
  return parseFloat(
    (dotProduct / (magnitudeA * magnitudeB)).toFixed(precision)
  );
};

export const createIndex = () => {
  const objects: { [key: string]: any }[] = [];

  return {
    add: (obj: { [key: string]: any }) => {
      if (!Array.isArray(obj.embedding) || obj.embedding.some(isNaN)) {
        throw new Error(
          "Object must have an embedding property of type number[]"
        );
      }
      objects.push(obj);
    },
    search: (queryEmbedding: number[], options: { topK?: number } = {}) => {
      // Compute similarities
      const similarities = objects.map((obj) => ({
        similarity: cosineSimilarity(queryEmbedding, obj.embedding),
        object: obj,
      }));

      // Sort by similarity and return topK results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.topK);
    },
  };
};

export class EmbeddingIndex {
  private objects: { [key: string]: any }[];

  constructor(initialObjects?: { [key: string]: any }[]) {
    this.objects = [];

    if (initialObjects) {
      initialObjects.forEach((obj) => this.validateAndAdd(obj));
    }
  }

  private validateAndAdd(obj: { [key: string]: any }) {
    if (!Array.isArray(obj.embedding) || obj.embedding.some(isNaN)) {
      throw new Error(
        "Object must have an embedding property of type number[]"
      );
    }
    this.objects.push(obj);
  }

  add(obj: { [key: string]: any }) {
    this.validateAndAdd(obj);
  }

  search(queryEmbedding: number[], options: { topK?: number } = { topK: 3 }) {
    const topK = options.topK || 3;

    // Compute similarities
    const similarities = this.objects.map((obj) => ({
      similarity: cosineSimilarity(queryEmbedding, obj.embedding),
      object: obj,
    }));

    // Sort by similarity and return topK results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  printIndex() {
    console.log("Index Content:");
    this.objects.forEach((obj, idx) => {
      console.log(`Item ${idx + 1}:`, obj);
    });
  }
}
