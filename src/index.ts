/** Author: yusufhilmi, lurrobert
 * Let's keep everything here until it gets too big
 * My first npm package, can use help about design patterns, best practices!
 */

import Cache from './cache';
import { IndexedDbManager } from './indexedDB';

// uncomment for testing only
// import { IDBFactory } from 'fake-indexeddb';
// const indexedDB = new IDBFactory();

interface SearchResult {
  similarity: number;
  object: any;
}

type StorageOptions = 'indexedDB' | 'localStorage' | 'none';

/**
 * Interface for search options in the EmbeddingIndex class.
 * topK: The number of top similar items to return.
 * filter: An optional filter to apply to the objects before searching.
 * useStorage: A flag to indicate whether to use storage options like indexedDB or localStorage.
 */
interface SearchOptions {
  topK?: number;
  filter?: { [key: string]: any };
  useStorage?: StorageOptions;
  storageOptions?: { indexedDBName: string; indexedDBObjectStoreName: string }; // TODO: generalize it to localStorage as well
}

const cacheInstance = Cache.getInstance();

export const getEmbedding = async (
  text: string,
  precision: number = 7,
  options = { pooling: 'mean', normalize: false },
  model = 'Xenova/gte-small',
): Promise<number[]> => {
  const cachedEmbedding = cacheInstance.get(text);
  if (cachedEmbedding) {
    return Promise.resolve(cachedEmbedding);
  }

  const transformersModule = await import('@xenova/transformers');
  const { pipeline } = transformersModule;
  const pipe = await pipeline('feature-extraction', model);
  const output = await pipe(text, options);
  const roundedOutput = Array.from(output.data as number[]).map(
    (value: number) => parseFloat(value.toFixed(precision)),
  );
  cacheInstance.set(text, roundedOutput);
  return Array.from(roundedOutput);
};

export const cosineSimilarity = (
  vecA: number[],
  vecB: number[],
  precision: number = 6,
): number => {
  // Check if both vectors have the same length
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
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
    (dotProduct / (magnitudeA * magnitudeB)).toFixed(precision),
  );
};

export class EmbeddingIndex {
  private objects: { [key: string]: any }[];
  private keys: string[];

  constructor(initialObjects?: { [key: string]: any }[]) {
    this.objects = [];
    this.keys = [];
    if (initialObjects && initialObjects.length > 0) {
      initialObjects.forEach((obj) => this.validateAndAdd(obj));
      if (initialObjects[0]) {
        this.keys = Object.keys(initialObjects[0]);
      }
    }
  }

  private validateAndAdd(obj: { [key: string]: any }) {
    if (!Array.isArray(obj.embedding) || obj.embedding.some(isNaN)) {
      throw new Error(
        'Object must have an embedding property of type number[]',
      );
    }
    if (this.keys.length === 0) {
      this.keys = Object.keys(obj);
    } else if (!this.keys.every((key) => key in obj)) {
      throw new Error(
        'Object must have the same properties as the initial objects',
      );
    }
    this.objects.push(obj);
  }

  add(obj: { [key: string]: any }) {
    this.validateAndAdd(obj);
  }

  // Method to update an existing vector in the index
  update(filter: { [key: string]: any }, vector: { [key: string]: any }) {
    // Find the index of the vector with the given filter
    const index = this.objects.findIndex((object) =>
      Object.keys(filter).every((key) => object[key] === filter[key]),
    );
    if (index === -1) {
      throw new Error('Vector not found');
    }
    // Validate and add the new vector
    this.validateAndAdd(vector);
    // Replace the old vector with the new one
    this.objects[index] = vector;
  }

  // Method to remove a vector from the index
  remove(filter: { [key: string]: any }) {
    // Find the index of the vector with the given filter
    const index = this.objects.findIndex((object) =>
      Object.keys(filter).every((key) => object[key] === filter[key]),
    );
    if (index === -1) {
      throw new Error('Vector not found');
    }
    // Remove the vector from the index
    this.objects.splice(index, 1);
  }

  // Method to remove multiple vectors from the index
  removeBatch(filters: { [key: string]: any }[]) {
    filters.forEach((filter) => {
      // Find the index of the vector with the given filter
      const index = this.objects.findIndex((object) =>
        Object.keys(filter).every((key) => object[key] === filter[key]),
      );
      if (index !== -1) {
        // Remove the vector from the index
        this.objects.splice(index, 1);
      }
    });
  }

  // Method to retrieve a vector from the index
  get(filter: { [key: string]: any }) {
    // Find the vector with the given filter
    const vector = this.objects.find((object) =>
      Object.keys(filter).every((key) => object[key] === filter[key]),
    );
    if (!vector) {
      return null;
    }
    // Return the vector
    return vector;
  }

  async search(
    queryEmbedding: number[],
    options: SearchOptions = {
      topK: 3,
      useStorage: 'none',
      storageOptions: {
        indexedDBName: 'clientVectorDB',
        indexedDBObjectStoreName: 'ClientEmbeddingStore',
      },
    },
  ): Promise<SearchResult[]> {
    const topK = options.topK || 3;
    const filter = options.filter || {};
    const useStorage = options.useStorage || 'none';

    if (useStorage === 'indexedDB') {
      const DBname = options.storageOptions?.indexedDBName || 'clientVectorDB';
      const objectStoreName =
        options.storageOptions?.indexedDBObjectStoreName ||
        'ClientEmbeddingStore';

      if (typeof indexedDB === 'undefined') {
        console.error('IndexedDB is not supported');
        throw new Error('IndexedDB is not supported');
      }
      const results = await this.loadAndSearchFromIndexedDB(
        DBname,
        objectStoreName,
        queryEmbedding,
        topK,
        filter,
      );
      return results;
    } else {
      // Compute similarities
      const similarities = this.objects
        .filter((object) =>
          Object.keys(filter).every((key) => object[key] === filter[key]),
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
  }

  printIndex() {
    console.log('Index Content:');
    this.objects.forEach((obj, idx) => {
      console.log(`Item ${idx + 1}:`, obj);
    });
  }

  async saveIndex(
    storageType: string,
    options: { DBName: string; objectStoreName: string } = {
      DBName: 'clientVectorDB',
      objectStoreName: 'ClientEmbeddingStore',
    },
  ) {
    if (storageType === 'indexedDB') {
      await this.saveToIndexedDB(options.DBName, options.objectStoreName);
    } else {
      throw new Error(
        `Unsupported storage type: ${storageType} \n Supported storage types: "indexedDB"`,
      );
    }
  }

  async saveToIndexedDB(
    DBname: string = 'clientVectorDB',
    objectStoreName: string = 'ClientEmbeddingStore',
  ): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.error('IndexedDB is not defined');
      throw new Error('IndexedDB is not supported');
    }
    return new Promise(async (resolve, reject) => {
      if (!this.objects || this.objects.length === 0) {
        reject(new Error('Index is empty. Nothing to save'));
        return;
      }

      const db = await IndexedDbManager.create(DBname, objectStoreName);

      await db
        .addToIndexedDB(this.objects)
        .then(() => {
          console.log(
            `Index saved to database '${DBname}' object store '${objectStoreName}'`,
          );
          resolve();
        })
        .catch((error) => {
          console.error('Error saving index to database:', error);
          reject(new Error('Error saving index to database'));
        });
    });
  }

  async loadAndSearchFromIndexedDB(
    DBname: string = 'clientVectorDB',
    objectStoreName: string = 'ClientEmbeddingStore',
    queryEmbedding: number[],
    topK: number,
    filter: { [key: string]: any },
  ): Promise<SearchResult[]> {
    const db = await IndexedDbManager.create(DBname, objectStoreName);
    const generator = db.dbGenerator();
    const results: { similarity: number; object: any }[] = [];

    for await (const record of generator) {
      if (Object.keys(filter).every((key) => record[key] === filter[key])) {
        const similarity = cosineSimilarity(queryEmbedding, record.embedding);
        results.push({ similarity, object: record });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  async deleteIndexedDB(DBname: string = 'clientVectorDB'): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.error('IndexedDB is not defined');
      throw new Error('IndexedDB is not supported');
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DBname);

      request.onsuccess = () => {
        console.log(`Database '${DBname}' deleted`);
        resolve();
      };
      request.onerror = (event) => {
        console.error('Failed to delete database', event);
        reject(new Error('Failed to delete database'));
      };
    });
  }

  async deleteIndexedDBObjectStore(
    DBname: string = 'clientVectorDB',
    objectStoreName: string = 'ClientEmbeddingStore',
  ): Promise<void> {
    const db = await IndexedDbManager.create(DBname, objectStoreName);

    try {
      await db.deleteIndexedDBObjectStoreFromDB(DBname, objectStoreName);
      console.log(
        `Object store '${objectStoreName}' deleted from database '${DBname}'`,
      );
    } catch (error) {
      console.error('Error deleting object store:', error);
      throw new Error('Error deleting object store');
    }
  }

  async getAllObjectsFromIndexedDB(
    DBname: string = 'clientVectorDB',
    objectStoreName: string = 'ClientEmbeddingStore',
  ): Promise<any[]> {
    const db = await IndexedDbManager.create(DBname, objectStoreName);
    const objects: any[] = [];
    for await (const record of db.dbGenerator()) {
      objects.push(record);
    }
    return objects;
  }
}
