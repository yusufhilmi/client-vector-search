import {
  cosineSimilarity,
  getEmbedding,
  EmbeddingIndex,
} from "client-vector-search";

const texts = [
  "The sun rises in the east and sets in the west, creating a beautiful view.",
  "A cat is a small, furry mammal often kept as a pet.",
  "Basketball is a popular sport played by two teams on a rectangular court.",
  "The ocean is a vast body of salt water that covers most of the Earth.",
  "Books provide knowledge, entertainment, and can be a source of inspiration.",
  "Cars are motor vehicles used for transportation and come in various models.",
  "A mountain is a large landform that rises above the surrounding land.",
  "A computer is an electronic device capable of performing complex calculations.",
  "A tree is a tall plant with a trunk and branches.",
  "A guitar is a stringed musical instrument played with fingers or a pick.",
  "The rose is a beautiful flower known for its fragrance and color.",
  "A tulip is a spring-blooming perennial that comes in various bright colors.",
  "A laptop is a portable computer suitable for work and entertainment.",
  "A tablet is a touchscreen device larger than a phone but smaller than a laptop.",
  "Basketball is a sport played with a round ball by two teams.",
  "Soccer is a game played by two teams, where the ball is kicked into goals.",
  "The sun warms the Earth, providing light and energy for life.",
  "The moon orbits the Earth, affecting tides and illuminating the night sky.",
  "Coffee is a popular beverage made from roasted coffee beans.",
  "Tea is a refreshing drink made by steeping tea leaves in hot water.",
  "A novel is a long fictional narrative, often complex in plot.",
  "A short story is a brief work of fiction, typically focusing on a single incident.",
  "A bicycle is a two-wheeled vehicle powered by pedaling.",
  "A motorcycle is a two-wheeled motor vehicle that can travel at high speeds.",
  "A river is a natural flowing watercourse, usually freshwater.",
  "A lake is an inland body of water, often freshwater, surrounded by land.",
  "A painting is a piece of art created with paint on a surface.",
  "A sculpture is a three-dimensional work of art, often carved or modeled.",
];

const testEmbeddingPrecision = async () => {
  const embeddings = await Promise.all(
    texts.map((text) => getEmbedding(text, 16))
  );

  // Create index with default precision
  const indexDefault = new EmbeddingIndex();
  embeddings.forEach((embedding, i) => {
    indexDefault.add({ id: i, embedding, text: texts[i] });
  });

  // indexDefault.printIndex();

  const topK = embeddings.length;
  const queryEmbedding = embeddings[0];

  // Search the index with the query embedding
  console.time("Default precision");
  const resultsDefault = indexDefault.search(queryEmbedding, { topK });
  console.timeEnd("Default precision");

  console.log(
    "Order of results with default precision:",
    resultsDefault.map((result) => result.object.id)
  );

  // Create index with lower precision
  const indexLowerPrecision = new EmbeddingIndex();

  const roundedEmbeddings = await Promise.all(
    texts.map((text) => getEmbedding(text))
  );

  roundedEmbeddings.forEach((embedding, i) => {
    indexLowerPrecision.add({ id: i, embedding, text: texts[i] });
  });

  // Search the index with the rounded query embedding
  console.time("Lower precision");
  const resultsLowerPrecision = indexLowerPrecision.search(
    roundedEmbeddings[0],
    { topK }
  );
  console.timeEnd("Lower precision");

  console.log(
    "Order of results with lower precision:",
    resultsLowerPrecision.map((result) => result.object.id)
  );
};

testEmbeddingPrecision();
