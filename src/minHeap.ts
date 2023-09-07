type Comparator<T> = (a: T, b: T) => number;

class MinHeap<T> {
  private heap: (T | undefined)[] = [];

  constructor(private comparator: Comparator<T>) {}

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | null {
    if (this.heap.length === 0) return null;
    [this.heap[0], this.heap[this.heap.length - 1]] = [this.heap[this.heap.length - 1], this.heap[0]];
    const poppedValue = this.heap.pop();
    this.bubbleDown(0);
    return poppedValue !== undefined ? poppedValue : null;
  }
  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] || null : null;
  }

  size(): number {
    return this.heap.length;
  }

  toArray(): T[] {
    return this.heap.filter(item => item !== undefined) as T[];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const child = this.heap[index];
      const parent = this.heap[parentIndex];
      if (child !== undefined && parent !== undefined && this.comparator(child, parent) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const lastIndex = this.heap.length - 1;
    while (index < lastIndex) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let minIndex = index;

      if (leftChild <= lastIndex && this.heap[leftChild] !== undefined && this.comparator(this.heap[leftChild] as T, this.heap[minIndex] as T) < 0) {
        minIndex = leftChild;
      }
      if (rightChild <= lastIndex && this.heap[rightChild] !== undefined && this.comparator(this.heap[rightChild] as T, this.heap[minIndex] as T) < 0) {
        minIndex = rightChild;
      }
      if (minIndex !== index) {
        [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
        index = minIndex;
      } else {
        break;
      }
    }
  }
}

export { MinHeap };