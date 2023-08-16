# client-vector-search

A client side vector search library that can embed, search, and cache. Works with TS and both on the client and server side.

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
- [ ] create an index and implement search
  - [ ] k-d-tree
- [ ] list out the models we recommend
  - [ ] check their dimensions
- [ ] test the performance of embedding times, indexing and search
- [ ] use browser APIs such as localStorage for caching
- [ ] generalize getEmbedding
  - [ ] include embedding API provider options
- [ ] simple tests
  - [ ] mock the @xenova/transformers for jest, it's not happy with it
- [ ] automatically switch to a local vs API endpoint to get embeddings!


## Installation

```bash
npm install client-vector-search
```

## Usage


```ts
import { cosineSimilarity, getEmbedding } from "client-vector-search"

// super simple test for similarity, works with any 2 vectors
const similarity = cosineSimilarity([1, 2, 3], [9091, 3213212, 2]);
console.log(similarity);


const main = async () => {
  // Different subjects with gte-small should give ~0.748259 for similarity score
  const test1 = [
    "The sun rises in the east and sets in the west, creating a beautiful view.",
    "A cat is a small, furry mammal often kept as a pet.",
  ];

// old school one by one embeds
  const embedding = await getEmbedding(test1[0]);
  const embedding1 = await getEmbedding(test1[1]);

  const similarity1 = cosineSimilarity(embedding, embedding1);


  // batch embedding
  const embeddings = await Promise.all(
    test1.map(async (t) => await getEmbedding(t))
  );

  // console.log(embeddings);
  const similarity2 = cosineSimilarity(embeddings[0], embeddings[1]);
  console.log(similarity2);
};

main();

```
