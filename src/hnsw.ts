// an experimental implementation of hnsw that doesn't rely on the hnsw binding libs which only works in browser or node
// TODOS:
// - bare bones
// - find # layers and optimal params
// - test the speed, accuracy, and memory usage

type Vector = number[];
type Distance = number;
type NodeIndex = number;
type Layer = LayerNode[];

interface LayerNode {
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

const _searchLayer = (
  graph: Layer,
  entry: NodeIndex,
  query: Vector,
  ef: number,
): [Distance, NodeIndex][] => {
  if (entry < 0 || entry >= graph.length) {
    throw new Error(`Invalid entry index: ${entry}`);
  }

  const best: [Distance, NodeIndex] = [
    EuclideanDistance(graph[entry].vector, query),
    entry,
  ];
  const nns: [Distance, NodeIndex][] = [best];
  const visited = new Set([best[1]]);
  const candidates = new PriorityQueue<[Distance, NodeIndex]>(
    [best],
    (a, b) => a[0] - b[0],
  );

  while (!candidates.isEmpty()) {
    const current = candidates.pop()!;
    if (nns[nns.length - 1][0] < current[0]) break;

    for (const e of graph[current[1]].connections) {
      const dist = EuclideanDistance(graph[e].vector, query);
      if (!visited.has(e)) {
        visited.add(e);
        if (dist < nns[nns.length - 1][0] || nns.length < ef) {
          candidates.push([dist, e]);
          nns.push([dist, e]);
          nns.sort((a, b) => a[0] - b[0]);
          if (nns.length > ef) {
            nns.pop();
          }
        }
      }
    }
  }

  return nns;
};

class HNSW {
  private L: number;
  private mL: number;
  private efc: number;
  private index: Layer[];

  constructor(L = 5, mL = 0.62, efc = 10) {
    this.L = L;
    this.mL = mL;
    this.efc = efc;
    this.index = Array.from({ length: L }, () => []);
  }

  insert(vec: Vector) {
    const l = getInsertLayer(this.L, this.mL);
    let startV = 0;

    for (let n = 0; n < this.L; n++) {
      const graph = this.index[n];

      if (graph?.length === 0) {
        // If the graph layer is empty, add a new node to it
        graph.push({
          vector: vec,
          connections: [],
          layerBelow: n < this.L - 1 ? this.index[n + 1].length : null,
        });
        continue;
      }

      if (n < l) {
        startV = _searchLayer(graph, startV, vec, 1)[0][1];
      } else {
        const node: LayerNode = {
          vector: vec,
          connections: [],
          layerBelow: n < this.L - 1 ? this.index[n + 1].length : null,
        };
        const nns = _searchLayer(graph, startV, vec, this.efc);
        for (const nn of nns) {
          node.connections.push(nn[1]);
          graph[nn[1]].connections.push(graph.length);
        }
        graph.push(node);
        startV = graph[startV].layerBelow!;
      }
    }
  }
}
