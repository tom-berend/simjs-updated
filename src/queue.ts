import { Population } from './stats.js';


// adapted from   https://github.com/davidnguyen11/p-queue-ts
// Copyright (c) 2020 Nguyen Ngoc Dzung
// MIT License

// lightly modified
//  - changed 'push' to 'insert', changed 'pop' to 'remove


/**
 * The priority queue is a collection in which items can be added at any time, but the only item that can be removed is the one with the highest priority.
 * A heap is a complete binary tree in which the value of a node is less than or greater than all the values in its subtrees.
 * By convention, the smallest or largest element is the one with the highest priority.
 * This lib using "Max Heap" as the default to heapify.
 * @example Changing from Max Priority Queue to Min Priority Queue
 * const p = new PriorityQueue(function(a, b) { return a > b; });
 * @example Add elements to queue
 * const p = new PriorityQueue();
 * p.insert(1); // adding "1" to queue
 * p.insert(2); // adding "2" to queue
 * p.insert(3); // adding "3" to queue
 * // After "insert", queue looks like this: [3, 1, 2]
 * @example Extract the largest or smallest element from the queue
 * const elmenet = p.remove(); // return "3" which is the largest element in queue
 * // After "remove", queue looks like this: [2, 1]
 * @example Peek the element (get the largest or smallest element without removing it from queue)
 * const elmenet = p.top(); // return "3" which is the largest element in queue
 * // After "remove", queue looks like this: [3, 1, 2]
 * @example Get the size of the queue
 * const size = p.size(); // return "3", because the queue has 3 elements
 * @example Check whether the queue is empty or not
 * const isEmpty = p.empty();
 * // return true, if the queue has elements
 * // return false, if the queue is empty
 * @example Extract queue to array
 * const array = p.toArray(); // This will extract all elements from queue to array
 * // return array = [3, 1, 2];
 */

export class PriorityQueue<T>  {
  private _queue: T[];
  private _comparator?: (item1: T, item2: T) => boolean;

  constructor(comparator?: (item1: T, item2: T) => boolean) {
    this._queue = [];
    this._comparator = comparator;
  }

  /**
   * Inserts the specified element into this priority queue.
   * Everytime adding new element to queue, the queue is started "sift up" to rebuild the heap
   * @param value
   */
  public insert(value: T) {         // was 'push', I want to avoid using JS names
    this._queue.push(value);
    let pos = this._queue.length - 1;

    while (
      pos !== 0 &&
      this._compare(this._queue[this._parentOf(pos)], this._queue[pos])
    ) {
      this._swap(pos, this._parentOf(pos));
      pos = this._parentOf(pos);
    }
  }

  /**
   * Retrieves, but does not remove, the head of this queue, or returns null if this queue is empty.
   */
  public top() {
    return this._queue.length > 0 ? this._queue[0] : null;
  }

  /**
   * Retrieves and removes the head of this queue, or returns null if this queue is empty.
   * Everytime remove element from queue, the queue is started "sift down" to rebuild the heap
   */
  public remove() {         // was 'pop'  I want to avoid using JS names
    if (this._queue.length === 0) {
      return null;
    }

    const item = this._queue[0];
    this._queue[0] = this._queue[this._queue.length - 1];
    this._swap(0, this._queue.length - 1);
    this._queue.pop();
    this._heapify(0);
    return item;
  }

  /**
   * Returns the number of elements in this collection.
   */
  public size() {
    return this._queue.length;
  }

  /**
   * Checks whether the queue is empty.
   */
  public empty() {
    return !this._queue.length;
  }

  /**
   * Returns an array containing all of the elements in this queue.
   */
  public toArray() {
    return [...this._queue];
  }

  /**
   * Removes all of the elements from this priority queue.
   */
  public clear() {
    this._queue = [];
  }

  /**
   * Returns true if this queue contains the specified element.
   * @param value
   * @param comparator
   */
  public contains(value: T, comparator?: (item: T) => boolean) {
    if (!this._queue.length) return false;

    const func = comparator || ((item: T): boolean => item === value);

    const mid = Math.floor(this._queue.length / 2);
    let childIndex1: number;
    let childIndex2: number;
    let index = 0;

    while (index <= mid - 1) {
      childIndex1 = 2 * index + 1;
      childIndex2 = 2 * index + 2;

      if (
        (this._queue[index] && func(this._queue[index])) ||
        (this._queue[childIndex1] && func(this._queue[childIndex1])) ||
        (this._queue[childIndex2] && func(this._queue[childIndex2]))
      ) {
        return true;
      }

      index++;
    }
    return false;
  }

  /**
   * Compare parent value and children value and swap them if conditions are satisfied
   * @param index
   */
  private _heapify(index: number) {
    const mid = Math.floor(this._queue.length / 2);
    let childIndex1: number;
    let childIndex2: number;
    let swapIndex: number;

    while (index <= mid - 1) {
      childIndex1 = 2 * index + 1;
      childIndex2 = 2 * index + 2;
      swapIndex = childIndex1;

      if (this._compare(this._queue[childIndex1], this._queue[childIndex2])) {
        swapIndex = childIndex2;
      }

      if (this._compare(this._queue[index], this._queue[swapIndex])) {
        this._swap(index, swapIndex);
      }

      index = swapIndex;
    }
  }

  /**
   * Swap 2 elememts
   * @param index1
   * @param index2
   */
  private _swap(index1: number, index2: number) {
    const temp = this._queue[index1];
    this._queue[index1] = this._queue[index2];
    this._queue[index2] = temp;
  }

  /**
   * Compare 2 elements
   * @param item1
   * @param item2
   */
  private _compare(item1: T, item2: T) {
    if (this._comparator) {
      return this._comparator(item1, item2);
    }
    return item1 < item2;
  }

  /**
   * Get parent's index of the current element
   * @param position
   */
  private _parentOf(position: number) {
    return Math.floor((position - 1) / 2);
  }
}



////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////




type QueueElement = {
    request: Request
    timestamp: number
}

export class Queue {

    requestQueue: QueueElement[]
    stats: Population
    name: string

    constructor(name: string) {
        this.name = name
        this.requestQueue = [];
        this.stats = new Population(name);
    }

    /** return the Request from the START of the queue, without removing from queue */
    q_top(): Request {
        if (this.requestQueue.length == 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }
        return this.requestQueue[0].request
    }

    /** return the Request from the END of the queue, without removing from queue */
    q_back(): Request {
        if (this.requestQueue.length == 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }
        return this.requestQueue[this.requestQueue.length - 1].request
    }

    /** add new request at the END of the queue */
    q_push(request: Request, timestamp: number) {
        this.requestQueue.push({ request, timestamp });
        this.stats.enter(timestamp);
    }

    /** add new request at the START of the queue */
    q_unshift(request: Request, timestamp: number) {
        this.requestQueue.unshift({ request, timestamp });

        this.stats.enter(timestamp);
    }

    /** removes the FIRST item from the queue and returns its request */
    q_shift(timestamp: number): Request {
        const element = this.requestQueue.shift();
        if (element) {
            this.stats.leave(element.timestamp, timestamp);
            return element.request;
        } else {
            throw new Error('Attempting to remove from an empty queue.')
        }
    }

    /** removes the LAST item from the queue and returns its request */
    q_pop(): Request {
        const element = this.requestQueue.pop();
        if (element) {
            this.stats.leave(element.timestamp, Model.time());
            return element.request;
        } else {
            throw new Error('Attempting to remove from an empty queue.')
        }
    }


    /** logs that we entered and left, without changing anything */
    passby(timestamp: number) {
        this.stats.enter(timestamp);
        this.stats.leave(timestamp, timestamp);
    }


    /** finalize the statistics for this process */
    finalize() {
        this.stats.finalize();
    }

    /** reset the statistics for this queue */
    reset() {
        this.stats.reset();
    }

    /** clear the statistics for this queue */
    clear() {
        this.reset();
        this.requestQueue = [];
    }

    report() {
        return [this.stats.sizeSeries.average(),
        this.stats.durationSeries.average()];
    }

    /** is this queue empty? */
    empty(): Boolean {
        console.log('queue.empty() found length ',this.requestQueue.length)
        return this.requestQueue.length === 0;
    }

    /** number of elements in this queue */
    size() {
        return this.requestQueue.length;
    }
}


//TODO what is this??
/**  */
export class PQueue extends Queue {

    data: any[] = []
    order = 0

    constructor(name: string) {
        super(name);
        this.data = [];
        this.order = 0;     // insertion order?
    }

    /** returns true if ro1.deliverAt > ro2.deliverAt.  If tied, then consider the order they were added.*/
    greater(ro1: Request, ro2: Request): Boolean {
        if (ro1.deliverAt > ro2.deliverAt) return true;
        if (ro1.deliverAt === ro2.deliverAt) return ro1.order > ro2.order;
        return false;
    }

    insert(ro: Request,timestamp:number) {
        ro.order = this.order++;

        let index = this.requestQueue.length;   // total number of requests

        this.q_push(ro,timestamp);

        // insert into data at the end
        const a = this.requestQueue

        const node = a[index];

        // heap up
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            if (this.greater(a[parentIndex].request, ro)) {
                a[index] = a[parentIndex];
                index = parentIndex;
            } else {
                break;
            }
        }
        a[index] = node;
    }

    remove(): Request {
        const a = this.requestQueue;

        let len = a.length;

        if (len <= 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }

        if (len === 1) {
            return this.q_pop().request;
        }
        const top = a[0];

        // move the last node up
        a[0] = a.pop();
        len--;

        // heap down
        let index = 0;

        const node = a[index];

        while (index < Math.floor(len / 2)) {
            const leftChildIndex = 2 * index + 1;

            const rightChildIndex = 2 * index + 2;

            const smallerChildIndex = rightChildIndex < len
                && !this.greater(a[rightChildIndex], a[leftChildIndex])
                ? rightChildIndex : leftChildIndex;

            if (this.greater(a[smallerChildIndex], node)) {
                break;
            }

            a[index] = a[smallerChildIndex];
            index = smallerChildIndex;
        }
        a[index] = node;
        return top;
    }
}
