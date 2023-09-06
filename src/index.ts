/** Author: yusufhilmi, lurrobert
 * Let's keep everything here until it gets too big
 * My first npm package, can use help about design patterns, best practices!
 */

import Cache from './cache';
import { MinHeap } from './minHeap';

// import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
// Whenever you want a fresh indexedDB
const indexedDB = new IDBFactory();


const cacheInstance = Cache.getInstance();

let versionDict: Record<string, number> = {};


export const getEmbedding = async (
  text: string,
  precision: number = 7,
  options = { pooling: "mean", normalize: false },
  model = "Xenova/gte-small",
): Promise<number[]> => {
  const cachedEmbedding = cacheInstance.get(text);
  if (cachedEmbedding) {
    return Promise.resolve(cachedEmbedding);
  }

  const transformersModule = await import("@xenova/transformers");
  const { pipeline } = transformersModule;
  const pipe = await pipeline("feature-extraction", model);
  const output = await pipe(text, options);
  const roundedOutput = Array.from(output.data as number[]).map(
    (value: number) => parseFloat(value.toFixed(precision))
  );
  cacheInstance.set(text, roundedOutput);
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
  private objects: { [key: string]: any }[];
  private keys: string[];
  private db: DynamicDB = new DynamicDB();

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
        "Object must have an embedding property of type number[]"
      );
    }
    if (this.keys.length === 0) {
      this.keys = Object.keys(obj);
    } else if (!this.keys.every((key) => key in obj)) {
      throw new Error(
        "Object must have the same properties as the initial objects"
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
      Object.keys(filter).every((key) => object[key] === filter[key])
    );
    if (index === -1) {
      throw new Error("Vector not found");
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
      Object.keys(filter).every((key) => object[key] === filter[key])
    );
    if (index === -1) {
      throw new Error("Vector not found");
    }
    // Remove the vector from the index
    this.objects.splice(index, 1);
  }

  // Method to remove multiple vectors from the index
  removeBatch(filters: { [key: string]: any }[]) {
    filters.forEach((filter) => {
      // Find the index of the vector with the given filter
      const index = this.objects.findIndex((object) =>
        Object.keys(filter).every((key) => object[key] === filter[key])
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
      Object.keys(filter).every((key) => object[key] === filter[key])
    );
    if (!vector) {
      return null;
    }
    // Return the vector
    return vector;
  }

  search(
    queryEmbedding: number[],
    options: { topK?: number; filter?: { [key: string]: any } } = { topK: 3 },
    useDB: boolean = false,
    DBname: string = 'defaultDB',
    objectStoreName: string = 'DefaultStore'
  ) {
    const topK = options.topK || 3;
    const filter = options.filter || {};

    if (useDB) {
      if (typeof indexedDB === 'undefined') {
        console.error("IndexedDB is not supported");
        throw new Error("IndexedDB is not supported");
      }
      return this.loadAndSearchFromDB(DBname, objectStoreName, queryEmbedding, topK, filter);
    }
    else {
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
  }

  printIndex() {
    console.log("Index Content:");
    this.objects.forEach((obj, idx) => {
      console.log(`Item ${idx + 1}:`, obj);
    });
  }

  async saveIndexToDB(DBname: string = 'defaultDB', objectStoreName: string = 'DefaultStore'): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.error("IndexedDB is not defined");
      throw new Error("IndexedDB is not supported");
    }
    return new Promise((resolve, reject) => {
      if (!this.objects || this.objects.length === 0) {
        reject(new Error("Index is empty"));
        return;
      }

      this.db.makeObjectStore(DBname, objectStoreName)
        .then( async () => {
          this.objects.forEach((obj) => {
            this.db.addToDB(objectStoreName, obj);
          });
          console.log(`Index saved to database '${DBname}' object store '${objectStoreName}'`);
          await this.db.closeDB();
          resolve();
        })
        .catch((error) => {
          console.error("Error saving index to database:", error);
          reject(new Error("Error saving index to database"));
        });
    });
  }

  async loadAndSearchFromDB(
    DBname: string = 'defaultDB',
    objectStoreName: string = 'DefaultStore',
    queryEmbedding: number[],
    topK: number,
    filter: { [key: string]: any }
  ): Promise<{ similarity: number, object: any }[]> {
    const topKResults = new MinHeap<{ similarity: number, object: any }>((a, b) => a.similarity - b.similarity);
  
    const generator = this.db.dbGenerator(DBname, objectStoreName);
    for await (const record of generator) {
      if (Object.keys(filter).every((key) => record[key] === filter[key])) {
        const similarity = cosineSimilarity(queryEmbedding, record.embedding);
        if (topKResults.size() < topK) {
          topKResults.push({ similarity, object: record });
        } else {
          const peekResult = topKResults.peek();
          if (peekResult && similarity > peekResult.similarity) {
            topKResults.pop();
            topKResults.push({ similarity, object: record });
          }
        }
      }
    }
    return topKResults.toArray().sort((a, b) => b.similarity - a.similarity);
  }
}

export class DynamicDB {
  private db: IDBDatabase | null = null;
  private objectStores: { [key: string]: IDBObjectStore } = {};
  private version: number = 1;

  async initializeDB(name: string): Promise<void> {
    this.version = await this.getLatestVersionOfDb(name)
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(name, this.version);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject(new Error("Database initialization failed"));
      };

      request.onupgradeneeded = () => {
        this.db = request.result;
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.version = this.db.version;
        resolve();
      };
    });
  }

  async closeDB(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }


  async getDB(DBname: string, objectStoreName: string): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB(DBname);
    }
    else {
      if (this.db.name !== DBname) {
        await this.createNewVersion(DBname, objectStoreName);
      }
    }
    return this.db as IDBDatabase;
  }

  async getLatestVersionOfDb(name: string): Promise<number> {
    if (!this.db) {
      return versionDict[name] ?? 1;
    }
    return versionDict[name] ?? this.db.version;
  }

    

  private async createNewVersion(DBname: string, objectStoreName: string, index: string | null = null): Promise<void> {
    this.closeDB();
    this.version = await this.getLatestVersionOfDb(DBname) + 1

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DBname, this.version);
      
      request.onupgradeneeded = () => {
        this.db = request.result;
        if (!this.db.objectStoreNames.contains(objectStoreName)) {
          const objectStore = this.db.createObjectStore(objectStoreName, { autoIncrement: true });
          if (index) {
            objectStore.createIndex(`by_${index}`, index, { unique: false });
          }
          this.objectStores[objectStoreName] = objectStore;
        }
        // else {
          // console.log(`Object store ${objectStoreName} already exists`);
        // }
      };

      request.onsuccess = () => {
        this.db = request.result;
        versionDict[DBname] = this.db.version;
        resolve();
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject(new Error("Failed to create new version"));
      };
    });
  }

  async getDBNames(): Promise<string[]> {
    const databases = await indexedDB.databases();
    return databases.filter(db => db.name !== undefined).map(db => db.name as string);
  }


  async makeObjectStore(
    DBname: string,
    objectStoreName: string,
    index: string | null = null
  ): Promise<void> {
    if (!this.db) {
      const dbNames = await this.getDBNames();
      if (dbNames.includes(DBname)) {
        this.db = await this.getDB(DBname, objectStoreName);
      }
      else {
        await this.initializeDB(DBname);
    }
    await this.createNewVersion(DBname, objectStoreName, index);
  }
}

  async addToDB(name: string, obj: { [key: string]: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (!this.objectStores || !this.objectStores[name]) {
        reject(new Error("Object store not initialized"));
        return;
      }

      const transaction = this.db.transaction([name], "readwrite");
      const objectStore = transaction.objectStore(name);
      const request = objectStore.add(obj);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error("Failed to add object", event);
        reject(new Error("Failed to add object"));
      };
    });
  }
  async getAllFromDB(name: string): Promise<any> {
    const transaction = this.db?.transaction([name], "readonly");
    const objectStore = transaction?.objectStore(name);
    return new Promise((resolve, reject) => {
      if (!objectStore) {
        reject(new Error("Object store not found"));
        return;
      }

      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error("Failed to get objects", event);
        reject(new Error("Failed to get objects"));
      };
    });
  }

  async *dbGenerator(
    DBname: string,
    objectStoreName: string
  ): AsyncGenerator<any, void, undefined> {
    if (!this.db) {
      await this.initializeDB(DBname);
      if (!this.db) {
        throw new Error("Database not initialized");
      }
    }
    const transaction = this.db.transaction([objectStoreName], 'readonly');
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.openCursor();

    let promiseResolver: (value: any) => void;

    request.onsuccess = function(event: Event) {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        promiseResolver(cursor.value);
        cursor.continue();
      } else {
        promiseResolver(null);
      }
    };

    while (true) {
      const promise = new Promise<any>((resolve) => {
        promiseResolver = resolve;
      });
      const value = await promise;
      if (value === null) break;
      yield value;
    }
  }
}

