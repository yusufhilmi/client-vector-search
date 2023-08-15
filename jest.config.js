module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./tests"],
  testMatch: ["**/*.test.ts"],
  transformIgnorePatterns: ["node_modules/(?!@xenova/transformers/)"],
};
