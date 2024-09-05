import { Request } from './request.js';
import { Population } from './stats.js';

type QueueElement = {
    request: Request
    timestamp: number
}

export class Queue  {

    requestQueue: QueueElement[]
    stats: Population

    constructor(name: string) {
        // super(name);
        this.requestQueue = [];
        this.stats = new Population(name);
    }

    /** return the Request from the START of the queue, without removing from queue */
    top(): Request {
        if (this.requestQueue.length == 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }
        return this.requestQueue[0].request
    }

    /** return the Request from the END of the queue, without removing from queue */
    back(): Request {
        if (this.requestQueue.length == 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }
        return this.requestQueue[this.requestQueue.length - 1].request
    }

    /** add new request at the END of the queue */
    push(request: Request, timestamp: number) {
        this.requestQueue.push({ request, timestamp });
        this.stats.enter(timestamp);
    }

    /** add new request at the START of the queue */
    unshift(request: Request, timestamp: number) {
        this.requestQueue.unshift({ request, timestamp });

        this.stats.enter(timestamp);
    }

    /** removes the FIRST item from the queue and returns its request */
    shift(timestamp: number): Request {
        const element = this.requestQueue.shift();
        if (element) {
            this.stats.leave(element.timestamp, timestamp);
            return element.request;
        } else {
            throw new Error('Attempting to remove from an empty queue.')
        }
    }

    /** removes the LAST item from the queue and returns its request */
    pop(timestamp: number): Request {
        const element = this.requestQueue.pop();
        if (element) {
            this.stats.leave(element.timestamp, timestamp);
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

    insert(ro: Request) {
        ro.order = this.order++;

        let index = this.data.length;   // total number of requests

        this.data.push(ro);

        // insert into data at the end
        const a = this.data;

        const node = a[index];

        // heap up
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            if (this.greater(a[parentIndex], ro)) {
                a[index] = a[parentIndex];
                index = parentIndex;
            } else {
                break;
            }
        }
        a[index] = node;
    }

    remove(): Request {
        const a = this.data;

        let len = a.length;

        if (len <= 0) {
            throw new Error('Attempting to remove from an empty queue.')
        }

        if (len === 1) {
            return this.data.pop();
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

