// an experimental implementation of hnsw that doesn't rely on the hnsw binding libs which only works in browser or node
// TODOS:
// - bare bones
// - find # layers and optimal params
// - test the speed, accuracy, and memory usage
import { encode, decode } from '@msgpack/msgpack';

type Vector = number[];
type Distance = number;
type NodeIndex = number;
type Layer = LayerNode[];

interface LayerNode {
  vector: Vector;
  connections: NodeIndex[];
  layerBelow: NodeIndex | null;
}

interface HNSWData {
  L: number;
  mL: number;
  efc: number;
  index: Layer[];
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
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  return Math.sqrt(
    a.reduce((acc, val, i) => {
      const bVal = b[i]; // Check b[i] in a variable
      if (bVal === undefined) throw new Error('b[i] is undefined');
      return acc + Math.pow(val - bVal, 2);
    }, 0),
  );
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

  // Check if the graph at the entry index is defined
  const graphEntry = graph[entry];
  if (!graphEntry) {
    throw new Error(`Graph entry at index ${entry} is undefined`);
  }

  const best: [Distance, NodeIndex] = [
    EuclideanDistance(graphEntry.vector, query),
    entry,
  ];
  const nns: [Distance, NodeIndex][] = [best];
  const visited = new Set([best[1]]);
  const candidates = new PriorityQueue<[Distance, NodeIndex]>(
    [best],
    (a, b) => a[0] - b[0],
  );

  while (!candidates.isEmpty()) {
    const current = candidates.pop();
    // Define a variable to hold the last element of nns array
    const lastNnsElement = nns.length > 0 ? nns[nns.length - 1] : null;
    // Check if current is not null and lastNnsElement is not undefined before comparing their values
    if (!current || (lastNnsElement && lastNnsElement[0] < current[0])) break;

    const graphCurrent = graph[current[1]];
    if (!graphCurrent) continue;

    for (const e of graphCurrent.connections) {
      const graphE = graph[e];
      if (!graphE) continue;

      const dist = EuclideanDistance(graphE.vector, query);
      if (!visited.has(e)) {
        visited.add(e);
        const lastNn = nns[nns.length - 1];
        if (!lastNn || dist < lastNn[0] || nns.length < ef) {
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
export class ExperimentalHNSWIndex {
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
  setIndex(index: Layer[]): void {
    this.index = index;
  }

  insert(vec: Vector) {
    const l = getInsertLayer(this.L, this.mL);
    let startV = 0;

    for (let n = 0; n < this.L; n++) {
      const graph = this.index[n];

      if (graph?.length === 0) {
        // If the graph layer is empty, add a new node to it
        // Assign next layer to a variable and check if it's undefined
        const nextLayer = this.index[n + 1];
        const nextLayerLength = nextLayer ? nextLayer.length : null;
        graph?.push({
          vector: vec,
          connections: [],
          layerBelow: n < this.L - 1 ? nextLayerLength : null,
        });
        continue;
      }

      if (n < l && graph) {
        // Check if the search layer result is not undefined before accessing its properties
        const searchLayerResult = _searchLayer(graph, startV, vec, 1);
        startV =
          searchLayerResult && searchLayerResult[0]
            ? searchLayerResult[0][1]
            : startV;
      } else if (graph) {
        // Assign next layer to a variable and check if it's undefined
        const nextLayer = this.index[n + 1];
        const nextLayerLength = nextLayer ? nextLayer.length : null;
        const node: LayerNode = {
          vector: vec,
          connections: [],
          layerBelow: n < this.L - 1 ? nextLayerLength : null,
        };
        const nns = _searchLayer(graph, startV, vec, this.efc);
        for (const nn of nns) {
          node.connections.push(nn[1]);
          graph[nn[1]]?.connections.push(graph.length);
        }
        graph?.push(node);
        // Assign graph[startV] to a variable and check if it's undefined before accessing its properties
        const graphStartV = graph[startV];
        if (graphStartV) startV = graphStartV.layerBelow!;
      }
    }
  }

  search(query: Vector, ef = 1): [Distance, NodeIndex][] {
    if (this.index && this.index[0] && this.index[0].length === 0) {
      return [];
    }

    let bestV = 0;
    for (const graph of this.index) {
      const searchLayer = _searchLayer(graph, bestV, query, ef);
      if (searchLayer && searchLayer[0]) {
        bestV = searchLayer[0][1];
        if (graph[bestV]?.layerBelow === null) {
          return _searchLayer(graph, bestV, query, ef);
        }
        bestV = graph[bestV]?.layerBelow!;
      }
    }
    return [];
  }

  toJSON() {
    return {
      L: this.L,
      mL: this.mL,
      efc: this.efc,
      index: this.index,
    };
  }

  static fromJSON(json: any): ExperimentalHNSWIndex {
    const hnsw = new ExperimentalHNSWIndex(json.L, json.mL, json.efc);
    return hnsw;
  }

  toBinary() {
    return encode({
      L: this.L,
      mL: this.mL,
      efc: this.efc,
      index: this.index,
    });
  }

  static fromBinary(binary: Uint8Array): ExperimentalHNSWIndex {
    const data = decode(binary) as HNSWData;
    const hnsw = new ExperimentalHNSWIndex(data.L, data.mL, data.efc);
    hnsw.setIndex(data.index);
    return hnsw;
  }
}
