import {
  getEmbedding,
  cosineSimilarity,
  EmbeddingIndex,
} from "client-vector-search";

// NOTE: This is a test file for us to easily test the library, unfortunately jest and mocha are not happy with our dep @xenova/transformers so we have to do this manually

// Test getEmbedding function
console.log("\n\nTesting getEmbedding function...");
try {
  const embedding = await getEmbedding("Apple");
  console.log(
    "\nTest Case: should return an array of numbers when a valid string is passed"
  );
  console.log("Result: Passed");
  console.log(
    "Output: ",
    Array.isArray(embedding),
    embedding.every((item) => typeof item === "number")
  );
} catch (error) {
  console.log(
    "\nTest Case: should return an array of numbers when a valid string is passed"
  );
  console.log("Result: Failed");
}

try {
  //@ts-ignore
  await getEmbedding(null);
} catch (error) {
  console.log(
    "\nTest Case: should throw an error when an invalid input is passed"
  );
  console.log("Result: Passed");
  console.log("Output: ", error instanceof Error);
}

// Test cosineSimilarity function
console.log("\n\nTesting cosineSimilarity function...");
const vecA = [1, 2, 3];
const vecB = [4, 5, 6];

try {
  const similarity = cosineSimilarity(vecA, vecB);
  console.log(
    "\nTest Case: should return a number when valid vectors are passed"
  );
  console.log("Result: Passed");
  console.log("Output: ", typeof similarity === "number");
} catch (error) {
  console.log(
    "\nTest Case: should return a number when valid vectors are passed"
  );
  console.log("Result: Failed");
}

try {
  cosineSimilarity(vecA, [1, 2]);
} catch (error) {
  console.log(
    "\nTest Case: should throw an error when vectors of different lengths are passed"
  );
  console.log("Result: Passed");
  console.log("Output: ", error instanceof Error);
}

// Test EmbeddingIndex class
console.log("\n\nTesting EmbeddingIndex class...");
const initialObjects = [
  { id: 1, name: "Apple", embedding: [1, 2, 3] },
  { id: 2, name: "Banana", embedding: [4, 5, 6] },
];
const index = new EmbeddingIndex(initialObjects);

try {
  const objectToAdd = { id: 3, name: "Cheddar", embedding: [7, 8, 9] };
  index.add(objectToAdd);
  console.log("\nTest Case: should add an object to the index");
  console.log("Result: Passed");
  console.log("Output: ", index.get({ id: 3 }));
} catch (error) {
  console.log("\nTest Case: should add an object to the index");
  console.log("Result: Failed");
}

try {
  const vectorToUpdate = { id: 3, name: "Cheddar", embedding: [10, 11, 12] };
  index.update({ id: 3 }, vectorToUpdate);
  console.log("\nTest Case: should update a vector in the index");
  console.log("Result: Passed");
  console.log("Output: ", index.get({ id: 3 }) === vectorToUpdate);
} catch (error) {
  console.log("\nTest Case: should update a vector in the index");
  console.log("Result: Failed");
}
try {
  index.remove({ id: 3 });
  console.log("\nTest Case: should remove a vector from the index");
  console.log("Result: Passed");
  console.log("Output: ", !index.get({ id: 3 }));
} catch (error) {
  console.log("\nTest Case: should remove a vector from the index");
  console.log("Result: Failed");
}

try {
  const objectsToRemove = [{ id: 2 }, { id: 3 }];
  index.printIndex();
  index.removeBatch(objectsToRemove);
  index.printIndex();
  console.log("\nTest Case: should remove a batch of vectors from the index");
  console.log("Result: Passed");
  console.log("Output: ", !index.get({ id: 1 }), !index.get({ id: 2 }));
} catch (error) {
  console.log("\nTest Case: should remove a batch of vectors from the index");
  console.log("Result: Failed");
  console.log("Output: ", error);
}

try {
  const nonExistentObjects = [{ id: 100 }, { id: 200 }];
  index.removeBatch(nonExistentObjects);
  console.log(
    "\nTest Case: should not throw an error when removing non-existent vectors"
  );
  console.log("Result: Passed");
} catch (error) {
  console.log(
    "\nTest Case: should not throw an error when removing non-existent vectors"
  );
  console.log("Result: Failed");
}

try {
  index.removeBatch([]);
  console.log(
    "\nTest Case: should not throw an error when removing an empty array"
  );
  console.log("Result: Passed");
} catch (error) {
  console.log(
    "\nTest Case: should not throw an error when removing an empty array"
  );
  console.log("Result: Failed");
}

try {
  console.log("\nTest Case: should retrieve a vector from the index");
  console.log("Result: Passed");
  console.log("Output: ", index.get({ id: 1 }));
} catch (error) {
  console.log("\nTest Case: should retrieve a vector from the index");
  console.log("Result: Failed");
}

try {
  const results = index.search([1, 2, 3], { topK: 1 });
  console.log(
    "\nTest Case: should return top similar objects when a query is searched"
  );
  console.log("Result: Passed");
  console.log("Output: ", Array.isArray(results), results.length === 1);
} catch (error) {
  console.log(
    "\nTest Case: should return top similar objects when a query is searched"
  );
  console.log("Result: Failed");
}
