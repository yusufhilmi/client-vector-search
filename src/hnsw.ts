// an experimental implementation of hnsw that doesn't rely on the hnsw binding libs which only works in browser or node
// TODOS:
// - bare bones
// - find # layers and optimal params
// - test the speed, accuracy, and memory usage

type Vector = number[];
type Distance = number;
type NodeIndex = number;
type Layer = Node[];

interface Node {
  vector: Vector;
  connections: NodeIndex[];
  layerBelow: NodeIndex | null;
}

// Simple Priority Queue Implementation
class PriorityQueue<T> {
  private elements: T[];
  private compareFn: (a: T, b: T) => number;

  constructor(elements: T[], compareFn: (a: T, b: T) => number) {
    this.elements = elements;
    this.compareFn = compareFn;
    this.elements.sort(this.compareFn);
  }

  push(element: T) {
    this.elements.push(element);
    this.elements.sort(this.compareFn);
  }

  pop(): T | null {
    return this.elements.shift() || null;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}

const EuclideanDistance = (a: Vector, b: Vector): Distance => {
  return Math.sqrt(a.reduce((acc, val, i) => acc + Math.pow(val - b[i], 2), 0));
};

const getInsertLayer = (L: number, mL: number): number => {
  return Math.min(-Math.floor(Math.log(Math.random()) * mL), L - 1);
};
