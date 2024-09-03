"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQueue = exports.Queue = void 0;
const sim_js_1 = require("./sim.js");
const stats_js_1 = require("./stats.js");
const model_js_1 = require("./model.js");
class Queue extends model_js_1.Model {
    constructor(name) {
        super(name);
        this.data = [];
        this.timestamp = [];
        this.data = [];
        this.timestamp = [];
        this.stats = new stats_js_1.Population();
    }
    top() {
        return this.data[0];
    }
    back() {
        return (this.data.length) ? this.data[this.data.length - 1] : null;
    }
    push(value, timestamp) {
        (0, sim_js_1.argCheck)(arguments, 2, 2);
        this.data.push(value);
        this.timestamp.push(timestamp);
        this.stats.enter(timestamp);
    }
    unshift(value, timestamp) {
        (0, sim_js_1.argCheck)(arguments, 2, 2);
        this.data.unshift(value);
        this.timestamp.unshift(timestamp);
        this.stats.enter(timestamp);
    }
    shift(timestamp) {
        const value = this.data.shift();
        const enqueuedAt = this.timestamp.shift();
        this.stats.leave(enqueuedAt, timestamp);
        return value;
    }
    pop(timestamp) {
        const value = this.data.pop();
        const enqueuedAt = this.timestamp.pop();
        this.stats.leave(enqueuedAt, timestamp);
        return value;
    }
    passby(timestamp) {
        (0, sim_js_1.argCheck)(arguments, 1, 1);
        this.stats.enter(timestamp);
        this.stats.leave(timestamp, timestamp);
    }
    finalize(timestamp) {
        (0, sim_js_1.argCheck)(arguments, 1, 1);
        this.stats.finalize(timestamp);
    }
    reset() {
        this.stats.reset();
    }
    clear() {
        this.reset();
        this.data = [];
        this.timestamp = [];
    }
    report() {
        return [this.stats.sizeSeries.average(),
            this.stats.durationSeries.average()];
    }
    empty() {
        return this.data.length === 0;
    }
    size() {
        return this.data.length;
    }
}
exports.Queue = Queue;
class PQueue extends model_js_1.Model {
    constructor(name) {
        super(name);
        this.data = [];
        this.order = 0;
    }
    greater(ro1, ro2) {
        if (ro1.deliverAt > ro2.deliverAt)
            return true;
        if (ro1.deliverAt === ro2.deliverAt)
            return ro1.order > ro2.order;
        return false;
    }
    insert(ro) {
        (0, sim_js_1.argCheck)(arguments, 1, 1);
        ro.order = this.order++;
        let index = this.data.length;
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
            }
            else {
                break;
            }
        }
        a[index] = node;
    }
    remove() {
        const a = this.data;
        let len = a.length;
        if (len <= 0) {
            return null;
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
exports.PQueue = PQueue;
