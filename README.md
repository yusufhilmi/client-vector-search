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
- [ ] caching embeddings
- [ ] saving the index to IndexedDB or localStorage
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
npm install client-vector-search
```

## Usage

```ts
import { getEmbedding, cosineSimilarity, EmbeddingIndex } from 'client-vector-search';

// Generate embeddings for string
const embedding = await getEmbedding("Apple"); // Returns embedding as number[]

// Calculate cosine similarity
const similarity = cosineSimilarity(embedding1, embedding2, 6); // vecA, vecB: number[], precision: number (optional)

// Initial objects for the index
// Objects with 'embedding' property of type number[]
const initialObjects = [
{ id: 1, name: "Apple", embedding: await getEmbedding("Apple") },
{ id: 2, name: "Banana", embedding: await getEmbedding("Banana") },
{ id: 3, name: "Cheddar", embedding: await getEmbedding("Cheddar")},
{ id: 4, name: "Space", embedding: await getEmbedding("Space")},
{ id: 5, name: "database", embedding: await getEmbedding("database")},
];
const index = new EmbeddingIndex(initialObjects); // Creates an index

// Add an object to the index
const objectToAdd = { id: 6, name: 'Cat', embedding: await getEmbedding('Cat') };
index.add(objectToAdd); // Adds object with 'embedding' property

// Search the index
const queryEmbedding = await getEmbedding('Fruit'); // Query embedding
const results = index.search(queryEmbedding, { topK: 5 }); // Returns top similar objects

// Print the entire index
index.printIndex(); // Prints the content of the index
```
