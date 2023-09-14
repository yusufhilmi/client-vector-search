/** Author: yusufhilmi
 * Let's keep everything here until it gets too big
 * My first npm package, can use help about design patterns, best practices!
 */
const DEFAULT_TOP_K = 3;

interface Filter {
  [key: string]: any;
}

export const getEmbedding = async (
  text: string,
  precision: number = 7,
  options = { pooling: "mean", normalize: false },
  model = "Xenova/gte-small"
): Promise<number[]> => {
  const transformersModule = await import("@xenova/transformers");
  const { pipeline } = transformersModule;
  const pipe = await pipeline("feature-extraction", model);
  const output = await pipe(text, options);
  const roundedOutput = Array.from(output.data as number[]).map(
    (value: number) => parseFloat(value.toFixed(precision))
  );
  return Array.from(roundedOutput);
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

export class EmbeddingIndex {
  private objects: Filter[];
  private keys: string[];

  constructor(initialObjects?: Filter[]) {
    this.objects = [];
    this.keys = [];

    // if (initialObjects  && initialObjects.length > 0) {
    //   initialObjects.forEach((obj) => this.validateAndAdd(obj));
    //   this.keys = Object.keys(initialObjects[0]);
    //   // Find the index of the vector with the given filter
    // }
    if (initialObjects && initialObjects.length > 0) {
      initialObjects.forEach((obj) => this.validateAndAdd(obj));
      if (initialObjects[0]) {
        this.keys = Object.keys(initialObjects[0]);
      }
    }
  }

  private findVectorIndex(filter: Filter): number {
    return this.objects.findIndex((object) =>
      Object.keys(filter).every((key) => object[key] === filter[key])
    );
  }

  private validateAndAdd(obj: Filter) {
    if (!Array.isArray(obj.embedding) || obj.embedding.some(isNaN)) {
      throw new Error(
        "Object must have an embedding property of type number[]"
      );
    }
    if (!this.keys.every((key) => key in obj)) {
      throw new Error(
        "Object must have the same properties as the initial objects"
      );
    }
    this.objects.push(obj);
  }

  add(obj: Filter) {
    this.validateAndAdd(obj);
  }

  // Method to update an existing vector in the index
  update(filter: Filter, vector: Filter) {
    const index = this.findVectorIndex(filter);

    if (index === -1) {
      throw new Error("Vector not found");
    }
    // Validate and add the new vector
    this.validateAndAdd(vector);
    // Replace the old vector with the new one
    this.objects[index] = vector;
  }

  // Method to remove a vector from the index
  remove(filter: Filter) {
    const index = this.findVectorIndex(filter);

    if (index === -1) {
      throw new Error("Vector not found");
    }
    // Remove the vector from the index
    this.objects.splice(index, 1);
  }

  // Method to remove multiple vectors from the index
  removeBatch(filters: Filter[]) {
    filters.forEach((filter) => {
      const index = this.findVectorIndex(filter);

      if (index !== -1) {
        // Remove the vector from the index
        this.objects.splice(index, 1);
      }
    });
  }

  // Method to retrieve a vector from the index
  get(filter: Filter) {
    const vector = this.objects[this.findVectorIndex(filter)];

    return vector || null;
  }

  search(
    queryEmbedding: number[],
    options: { topK?: number; filter?: Filter } = { topK: DEFAULT_TOP_K }
  ) {
    const topK = options.topK || DEFAULT_TOP_K;
    const filter = options.filter || {};

    // Compute similarities
    const similarities = this.objects
      .filter((object) =>
        Object.keys(filter).every((key) => object[key] === filter[key])
      )
      .map((obj) => ({
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
