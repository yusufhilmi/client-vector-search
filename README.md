# client-vector-search

A client side vector search library that can embed, search, and cache. Works with TS and both on the client and server side.

Lots of bugs and improvements are coming!

TODOS:
- [x] embed with gte-small model
- [x] cosine similarity
- [ ] use browser APIs such as localStorage for caching
- [ ] fix the first batch of bugs (mnf, types etc.)
- [ ] write more tests for coverage and performance
- [ ] include embedding API provider options
- [ ] simple tests
- [ ] mock the @xenova/transformers for jest, it's not happy with it
- [ ] automatically switch to a local vs API endpoint to get Embeddings!


## Features

- Embed documents using transformer models.
- Calculate cosine similarity between embeddings.
- In-memory cache with browser caching support.

## Installation

```bash
npm install client-vector-search
```

## Usage





```
import {  cosineSimilarity, getEmbedding } from "client-vector-search

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
