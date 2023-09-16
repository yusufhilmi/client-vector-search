# client-vector-search

A client side vector search library that can embed, search, and cache. Works on the browser and server side.

It outperforms OpenAI's text-embedding-ada-002 and is way faster than Pinecone and other VectorDBs

I'm the founder of [searchbase.app](https://searchbase.app) and we needed this for our product and customers. We'll be using this library in production. You can be sure it'll be maintained and improved.

- Embed documents using transformers by default: gte-small (~30mb).
- Calculate cosine similarity between embeddings.
- Create an index and search on the client side
- Cache vectors with browser caching support.

Lots of improvements are coming!

## Roadmap

Our goal is to build a super simple, fast vector search that works with couple hundred to thousands vectors. ~1k vectors covers 99% of the use cases.

We'll initially keep things super simple and sub 100ms

### TODOs
- [x] embed with gte-small model
- [x] cosine similarity
- [x] create an index and implement search
  - [x] brute force
  - sub 10ms for to search 1k vectors
  - sub 15ms for to create an index with 1k vectors
  - takes around 20s to generate 100 embeddings with Xenova/gte-small
  - creating 1k embeddings takes too much time and space tho!
- [x] proper crud!
  - [x] add
  - [x] update
  - [x] remove
  - [x] get
  - [x] batch remove
- [x] reduce precision of embeddings, 7 decimal places is enough
  - increased search speed by 3x
  - reduced index size by 10x
- [x] caching embeddings
  - LRU cache embedding
- [x] saving the index to [IndexedDB]([IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API))
- [ ] localStorage
- [ ] list out the models we recommend
  - [ ] check their dimensions
- [ ] test the performance of embedding times, indexing and search
- [ ] use browser APIs such as localStorage for caching
- [ ] generalize getEmbedding
  - [ ] include embedding API provider options
- [ ] simple tests
  - [ ] mock the @xenova/transformers for jest, it's not happy with it
- [ ] automatically switch to a local vs API endpoint to get embeddings!
- [ ] better index creation, search with k-d-tree, ball-tree etc. (wip)
  - not a priority for now, 1k index takes sub 15ms to create, main problem is to get embeddings faster!

## Installation

```bash
npm i client-vector-search
```


## Quickstart

This library provides a plug-and-play solution for embedding and vector search. It's designed to be easy to use, efficient, and versatile. Here's a quick start guide:


```ts
  import { getEmbedding, EmbeddingIndex } from 'client-vector-search';

  // getEmbedding is an async function, so you need to use 'await' or '.then()' to get the result
  const embedding = await getEmbedding("Apple"); // Returns embedding as number[]

  // Each object should have an 'embedding' property of type number[]
  const initialObjects = [
  { id: 1, name: "Apple", embedding: embedding },
  { id: 2, name: "Banana", embedding: await getEmbedding("Banana") },
  { id: 3, name: "Cheddar", embedding: await getEmbedding("Cheddar")},
  { id: 4, name: "Space", embedding: await getEmbedding("Space")},
  { id: 5, name: "database", embedding: await getEmbedding("database")},
  ];
  const index = new EmbeddingIndex(initialObjects); // Creates an index

  // The query should be an embedding of type number[]
  const queryEmbedding = await getEmbedding('Fruit'); // Query embedding
  const results = await index.search(queryEmbedding, { topK: 5 }); // Returns top similar objects

  // specify the storage type
  await index.saveIndex('indexedDB');
  const results = await index.search([1, 2, 3], {
    topK: 5,
    useStorage: 'indexedDB',
    // storageOptions: { // use only if you overrode the defaults
    //   indexedDBName: 'clientVectorDB',
    //   indexedDBObjectStoreName: 'ClientEmbeddingStore',
    // },
  });

  console.log(results);

  await index.deleteIndexedDB(); // if you overrode default, specify db name
```


## Usage Guide

This guide provides a step-by-step walkthrough of the library's main features. It covers everything from generating embeddings for a string to performing operations on the index such as adding, updating, and removing objects. It also includes instructions on how to save the index to a database and perform search operations within it.

Until we have a reference documentation, you can find all the methods and their usage in this guide. Each step is accompanied by a code snippet to illustrate the usage of the method in question. Make sure to follow along and try out the examples in your own environment to get a better understanding of how everything works.

Let's get started!

### Step 1: Generate Embeddings for String
Generate embeddings for a given string using the `getEmbedding` method.

```ts
const embedding = await getEmbedding("Apple"); // Returns embedding as number[]
```
> **Note**: `getEmbedding` is asynchronous; make sure to use `await`.

---

### Step 2: Calculate Cosine Similarity
Calculate the cosine similarity between two embeddings.

```ts
const similarity = cosineSimilarity(embedding1, embedding2, 6);
```
> **Note**: Both embeddings should be of the same length.

---

### Step 3: Create an Index
Create an index with an initial array of objects. Each object must have an 'embedding' property.

```ts
const initialObjects = [...];
const index = new EmbeddingIndex(initialObjects);
```

---

### Step 4: Add to Index
Add an object to the index.

```ts
const objectToAdd = { id: 6, name: 'Cat', embedding: await getEmbedding('Cat') };
index.add(objectToAdd);
```

---

### Step 5: Update Index
Update an existing object in the index.

```ts
const vectorToUpdate = { id: 6, name: 'Dog', embedding: await getEmbedding('Dog') };
index.update({ id: 6 }, vectorToUpdate);
```

---

### Step 6: Remove from Index
Remove an object from the index.

```ts
index.remove({ id: 6 });
```

---

### Step 7: Retrieve from Index
Retrieve an object from the index.

```ts
const vector = index.get({ id: 1 });
```

---

### Step 8: Search the Index
Search the index with a query embedding.

```ts
const queryEmbedding = await getEmbedding('Fruit');
const results = await index.search(queryEmbedding, { topK: 5 });
```

---

### Step 9: Print the Index
Print the entire index to the console.

```ts
index.printIndex();
```

---

### Step 10: Save Index to IndexedDB (for browser)
Save the index to a persistent IndexedDB database. Note

```ts
await index.saveIndex("indexedDB", { DBName: "clientVectorDB", objectStoreName:"ClientEmbeddingStore"})
```

---

### Important: Search in indexedDB
Perform a search operation in the IndexedDB.

```ts
const results = await index.search(queryEmbedding, {
  topK: 5,
  useStorage: "indexedDB",
  storageOptions: { // only if you want to override the default options, defaults are below
    indexedDBName: 'clientVectorDB',
    indexedDBObjectStoreName: 'ClientEmbeddingStore'
  }
});

---

### Delete Database
To delete an entire database.

```ts
await IndexedDbManager.deleteIndexedDB("clientVectorDB");
```

---

### Delete Object Store
To delete an object store from a database.

```ts
await IndexedDbManager.deleteIndexedDBObjectStore("clientVectorDB", "ClientEmbeddingStore");
```

---

### Retrieve All Objects
To retrieve all objects from a specific object store.

```ts
const allObjects = await IndexedDbManager.getAllObjectsFromIndexedDB("clientVectorDB", "ClientEmbeddingStore");
```
