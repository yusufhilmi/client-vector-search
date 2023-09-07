// Basic entrance test

// import { createIndex, cosineSimilarity } from '../client-vector-search/dist'

// console.log(createIndex)


// async function calculateSimilarity() {
//     try {
//       const embedding1 = await getEmbedding("Apple");
//       const embedding2 = await getEmbedding("Orange");
  
//       const similarity = cosineSimilarity(embedding1, embedding2, 6)
//       console.log(similarity);
//     } catch (error) {
//       console.error('An error occurred:', error);
//     }
//   }
  
// calculateSimilarity();


// let message: string = 'Hello World';
// console.log(message);



//////////////////////////////////////////////////////////////////////////////////////////
// LRU cache
// import { LRUCache } from 'lru-cache'
// import { getEmbedding } from 'client-vector-search'


// const options = {
//   max: 10000, // Limit to 10,000 items
//   length: () => 1, // Assume each item is 1 unit (customize if needed)
//   maxAge: 1000 * 60 * 10 // 10-minute cache expiration
// };

// // Create the cache
// const cache = new LRUCache<string, any[]>(options);

// async function getEmbedding_cache(text: string): Promise<any[]> {
//   const cachedEmbedding = cache.get(text);
//   if (cachedEmbedding) {
//       return Promise.resolve(cachedEmbedding);
//   }
  
//   // Compute the embedding
//   const embedding = await getEmbedding(text);

//   // Store the result in cache
//   cache.set(text, embedding);

//   return embedding;
// }

// // running it
// // getEmbedding_cache("Apple").then((embedding) => {
// //   console.log(embedding);
// // });


// // Testing

// import { performance } from 'perf_hooks';

// async function experiment() {
//   const texts = Array.from({length: 100}, () => `Text ${Math.floor(Math.random() * 10001)}`);

//   // Without cache
//   let start = performance.now();
//   for (const text of texts) {
//     await getEmbedding(text);
//   }
//   let end = performance.now();
//   console.log(`Time without cache: ${(end - start).toFixed(2)} ms`);

//   // With cache
//   start = performance.now();
//   for (const text of texts) {
//     await getEmbedding_cache(text);
//   }
//   end = performance.now();
//   console.log(`Time with cache: ${(end - start).toFixed(2)} ms`);
// }

// experiment();


//////////////////////////////////////////////////////////////////////////////////////////
// runing on the code

import { getEmbedding } from 'client-vector-search'

// simple run test
getEmbedding("Apple").then((embedding) => {
  console.log("Success 1");
  getEmbedding("Apple").then((embedding) => {
    console.log("Success 2");
  }
  );
}
);



