# client-vector-search

A client side vector search library that can embed, search, and cache. Works with TS and both on the client and server side.

Lots of bugs and improvements are coming!

TODOS:
[x] embed with gte-small model
[x] cosine similarity
[x] in-memory cache mechanism
[x] simple tests
[ ] fix the first batch of bugs (mnf, types etc.)
[ ] mock the @xenova/transformers for jest, it's not happy with it rn
[ ] write more tests for coverage and performance
[ ] include embedding API provider options
[ ] use browser APIs such as localStorage for caching


## Features

- Embed documents using transformer models.
- Calculate cosine similarity between embeddings.
- In-memory cache with browser caching support.

## Installation

```bash
npm install client-vector-search
```



