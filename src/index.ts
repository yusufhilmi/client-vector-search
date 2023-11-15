const DEFAULT_TOP_K = 3;

interface Filter {
  [key: string]: any;
}

import Cache from './cache';
import { IndexedDbManager } from './indexedDB';
import { cosineSimilarity } from './utils';
export { ExperimentalHNSWIndex } from './hnsw';

// uncomment if you want to test indexedDB implementation in node env for faster dev cycle
// import { IDBFactory } from 'fake-indexeddb';
// const indexedDB = new IDBFactory();

export interface SearchResult {
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
  batchSize?: number;
  filter?: Filter;
  useStorage?: StorageOptions;
  storageOptions?: { indexedDBName: string; indexedDBObjectStoreName: string }; // TODO: generalize it to localStorage as well
}

const cacheInstance = Cache.getInstance();

let pipe: any;
let currentModel: string;

export const initializeModel = async (
  model: string = 'Xenova/gte-small',
): Promise<void> => {
  if (model !== currentModel) {
    const transformersModule = await import('@xenova/transformers');
    const pipeline = transformersModule.pipeline;
    pipe = await pipeline('feature-extraction', model);
    currentModel = model;
  }
};

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

  if (model !== currentModel) {
    await initializeModel(model);
  }

  const output = await pipe(text, options);
  const roundedOutput = Array.from(output.data as number[]).map(
    (value: number) => parseFloat(value.toFixed(precision)),
  );
  cacheInstance.set(text, roundedOutput);
  return Array.from(roundedOutput);
};

export class EmbeddingIndex {
  private objects: Filter[];
  private keys: string[];

  constructor(initialObjects?: Filter[]) {
    // TODO: add support for options while creating index such as  {... indexedDB: true, ...}
    this.objects = [];
    this.keys = [];
    if (initialObjects && initialObjects.length > 0) {
      initialObjects.forEach((obj) => this.validateAndAdd(obj));
      if (initialObjects[0]) {
        this.keys = Object.keys(initialObjects[0]);
      }
    }
  }

  private findVectorIndex(filter: Filter): number {
    return this.objects.findIndex((object) =>
      Object.keys(filter).every((key) => object[key] === filter[key]),
    );
  }

  private validateAndAdd(obj: Filter) {
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

  add(obj: Filter) {
    this.validateAndAdd(obj);
  }

  // Method to update an existing vector in the index
  update(filter: Filter, vector: Filter) {
    const index = this.findVectorIndex(filter);
    if (index === -1) {
      throw new Error('Vector not found');
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
      throw new Error('Vector not found');
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

  size(): number {
    // Returns the size of the index
    return this.objects.length;
  }

  clear() {
    this.objects = [];
  }

  async search(
    queryEmbedding: number[],
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    const topK = options.topK || DEFAULT_TOP_K;
    const filter = options.filter || {};
    const useStorage = options.useStorage || 'none';
    const batchSize = options.batchSize || 2000;

    if (useStorage === 'indexedDB') {
      const DBname = options.storageOptions?.indexedDBName || 'clientVectorDB';
      const objectStoreName =
        options.storageOptions?.indexedDBObjectStoreName ||
        'ClientEmbeddingStore';

      if (typeof indexedDB === 'undefined') {
        console.error('IndexedDB is not supported');
        throw new Error('IndexedDB is not supported');
      }

      return await this.loadAndSearchFromIndexedDB(
        DBname,
        objectStoreName,
        queryEmbedding,
        topK,
        filter,
        batchSize,
      );
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

    if (!this.objects || this.objects.length === 0) {
      throw new Error('Index is empty. Nothing to save');
    }

    try {
      const db = await IndexedDbManager.create(DBname, objectStoreName);
      await db.addToIndexedDB(this.objects);
      console.log(
        `Index saved to database '${DBname}' object store '${objectStoreName}'`,
      );
    } catch (error) {
      console.error('Error saving index to database:', error);
      throw new Error('Error saving index to database');
    }
  }

  async loadAndSearchFromIndexedDB(
    DBname: string,
    objectStoreName: string,
    queryEmbedding: number[],
    topK: number,
    filter: { [key: string]: any },
    batchSize: number = 2000,
  ): Promise<SearchResult[]> {
    const manager = await IndexedDbManager.create(DBname, objectStoreName);

    const transaction = manager.startTransaction(objectStoreName, 'readonly');
    const store = transaction.objectStore(objectStoreName);

    let request = store.openCursor();
    let results: { similarity: number; object: any }[] = [];
    let batch: any[] = [];

    const processBatch = (batch: any[]) => {
      batch.forEach((item: any) => {
        const similarity = cosineSimilarity(queryEmbedding, item.embedding);
        results.push({ similarity, object: item });
      });
    };

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (
          Object.keys(filter).every((key) => cursor.value[key] === filter[key])
        ) {
          batch.push(cursor.value);
          
          if (batch.length === batchSize) {
            processBatch(batch);
            batch = [];
          }
        }
        cursor.continue();
      } else {
        if (batch.length > 0) {
          processBatch(batch);
        }
        return results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK);
      }
    };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(new Error('Transaction failed'));
    });
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
