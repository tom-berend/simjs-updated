import { Population } from './stats.js';
import { Request } from './request.js';


export class Queue {
    _queue: Request[] = []
    private population: Population



    constructor(name: string) {
        this.population = new Population(name)
    }

    public display(msg: string) {
        let str = 'Queue: '

        this._queue.map((el) => str += el.timestamp + ' ')
        console.log('%c' + str, "color:orange;")
    }

    /** insert  */
    public insert(value: Request) {         // was 'push', I want to avoid using JS names
        this._queue.push(value);
    }

    /** Retrieves, but does not remove, the head of this queue, or returns null if this queue is empty. */
    public look(): Request | null {
        if (this._queue.length === 0) {
            return null
        }

        return this._queue.reduce((prev: Request, curr: Request) =>
            prev.timestamp < curr.timestamp ? prev : curr)
    }


    /** Returns the head of this queue, or thows error if this queue is empty.  So always look() before remove() */
    public remove(): Request {
        if (this._queue.length === 0) {
            throw new Error('trying to remove from empty queue')
        } else {
            this._queue.sort((prev: Request, curr: Request) => prev.timestamp - curr.timestamp)
            this.display('after sort')
            return this._queue.shift()
        }
    }

    /** number of elements in this collection.  */
    public size() {
        return this._queue.length;
    }


    /** Returns an array containing all of the elements in this queue.
     */
    public toArray() {
        return [...this._queue];
    }

    /** Removes all of the elements from this priority queue.  */
    public clear() {
        this._queue = [];
    }

    /** returns shallow copy array of elements meeting criteria */
    public filter(comparator: any) {
        return  this._queue.filter(comparator)
    }

    /** logs that we entered and left, without changing anything */
    passby(timestamp: number) {
        this.population.enter(timestamp);
        this.population.leave(timestamp, timestamp);
    }


    /** finalize the statistics for this process */
    finalize() {
        this.population.finalize();
    }

    /** reset the statistics for this queue */
    resetpopulation() {
        this.population.reset();
    }

    report() {
        return [this.population.sizeSeries.average(),
        this.population.durationSeries.average()];
    }


}


////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////




// type QueueElement = {
//     request: Request
//     timestamp: number
// }

// export class Queue {

//     requestQueue: QueueElement[]
//     stats: Population
//     name: string

//     constructor(name: string) {
//         this.name = name
//         this.requestQueue = [];
//         this.stats = new Population(name);
//     }

//     /** return the Request from the START of the queue, without removing from queue */
//     q_top(): Request {
//         if (this.requestQueue.length == 0) {
//             throw new Error('Attempting to remove from an empty queue.')
//         }
//         return this.requestQueue[0].request
//     }

//     /** return the Request from the END of the queue, without removing from queue */
//     q_back(): Request {
//         if (this.requestQueue.length == 0) {
//             throw new Error('Attempting to remove from an empty queue.')
//         }
//         return this.requestQueue[this.requestQueue.length - 1].request
//     }

//     /** add new request at the END of the queue */
//     q_push(request: Request, timestamp: number) {
//         this.requestQueue.push({ request, timestamp });
//         this.stats.enter(timestamp);
//     }

//     /** add new request at the START of the queue */
//     q_unshift(request: Request, timestamp: number) {
//         this.requestQueue.unshift({ request, timestamp });

//         this.stats.enter(timestamp);
//     }

//     /** removes the FIRST item from the queue and returns its request */
//     q_shift(timestamp: number): Request {
//         const element = this.requestQueue.shift();
//         if (element) {
//             this.stats.leave(element.timestamp, timestamp);
//             return element.request;
//         } else {
//             throw new Error('Attempting to remove from an empty queue.')
//         }
//     }

//     /** removes the LAST item from the queue and returns its request */
//     q_pop(): Request {
//         const element = this.requestQueue.pop();
//         if (element) {
//             this.stats.leave(element.timestamp, Model.time());
//             return element.request;
//         } else {
//             throw new Error('Attempting to remove from an empty queue.')
//         }
//     }


//     /** logs that we entered and left, without changing anything */
//     passby(timestamp: number) {
//         this.stats.enter(timestamp);
//         this.stats.leave(timestamp, timestamp);
//     }


//     /** finalize the statistics for this process */
//     finalize() {
//         this.stats.finalize();
//     }

//     /** reset the statistics for this queue */
//     reset() {
//         this.stats.reset();
//     }

//     /** clear the statistics for this queue */
//     clear() {
//         this.reset();
//         this.requestQueue = [];
//     }

//     report() {
//         return [this.stats.sizeSeries.average(),
//         this.stats.durationSeries.average()];
//     }

//     /** is this queue empty? */
//     empty(): Boolean {
//         console.log('queue.empty() found length ',this.requestQueue.length)
//         return this.requestQueue.length === 0;
//     }

//     /** number of elements in this queue */
//     size() {
//         return this.requestQueue.length;
//     }
// }


// //TODO what is this??
// /**  */
// export class PQueue extends Queue {

//     data: any[] = []
//     order = 0

//     constructor(name: string) {
//         super(name);
//         this.data = [];
//         this.order = 0;     // insertion order?
//     }

//     /** returns true if ro1.deliverAt > ro2.deliverAt.  If tied, then consider the order they were added.*/
//     greater(ro1: Request, ro2: Request): Boolean {
//         if (ro1.deliverAt > ro2.deliverAt) return true;
//         if (ro1.deliverAt === ro2.deliverAt) return ro1.order > ro2.order;
//         return false;
//     }

//     insert(ro: Request,timestamp:number) {
//         ro.order = this.order++;

//         let index = this.requestQueue.length;   // total number of requests

//         this.q_push(ro,timestamp);

//         // insert into data at the end
//         const a = this.requestQueue

//         const node = a[index];

//         // heap up
//         while (index > 0) {
//             const parentIndex = Math.floor((index - 1) / 2);

//             if (this.greater(a[parentIndex].request, ro)) {
//                 a[index] = a[parentIndex];
//                 index = parentIndex;
//             } else {
//                 break;
//             }
//         }
//         a[index] = node;
//     }

//     remove(): Request {
//         const a = this.requestQueue;

//         let len = a.length;

//         if (len <= 0) {
//             throw new Error('Attempting to remove from an empty queue.')
//         }

//         if (len === 1) {
//             return this.q_pop().request;
//         }
//         const top = a[0];

//         // move the last node up
//         a[0] = a.pop();
//         len--;

//         // heap down
//         let index = 0;

//         const node = a[index];

//         while (index < Math.floor(len / 2)) {
//             const leftChildIndex = 2 * index + 1;

//             const rightChildIndex = 2 * index + 2;

//             const smallerChildIndex = rightChildIndex < len
//                 && !this.greater(a[rightChildIndex], a[leftChildIndex])
//                 ? rightChildIndex : leftChildIndex;

//             if (this.greater(a[smallerChildIndex], node)) {
//                 break;
//             }

//             a[index] = a[smallerChildIndex];
//             index = smallerChildIndex;
//         }
//         a[index] = node;
//         return top;
//     }
// }
