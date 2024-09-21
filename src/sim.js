//TODO:  check out https://github.com/ed-sim/ed-sim-js
import { Model } from './model.js';
import { TimeSeries, Population } from './stats.js';
import { Request } from './request.js';
// const readKey = ():Promise<unknown> => new Promise(resolve => window.addEventListener('keypress', resolve, { once: true }));
// const setTimeout = ():Promise<unknown> => new Promise(resolve => window.addEventListener('keypress', resolve, { once: true }));
// (async function () {
//     console.log('Press a key');
//     const x = await readKey();
//     console.log('Pressed', String.fromCharCode(x.which));
//     console.log('Press a key');
//     const y = await readKey();
//     console.log('Pressed', String.fromCharCode(y.which));
// }());
// the system has Entities, Events, Stores, Buffers, Facilities that extend Model
/** root simulation class.  let sim = new Sim(name, isRealTime) */
export class Sim extends Model {
    startList = []; // these are the 'start' functions for every entity
    isRealTime;
    realTimeClock = 0;
    events = 0;
    maxEvents = 1000;
    maxTime = 1000;
    messages = 0;
    // Return promise which resolves after specified no. of milliseconds
    timer = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    intervalTimer; // an id number for the timer, different for Node and for browser
    constructor(name = 'Sim', isRealTime = false) {
        super(name);
        Model.currentSim = this; // register SIM object to parent so can access from entities.
        this.isRealTime = isRealTime;
    }
    debug(level, message) { }
    /** run the simulation for a specific # of seconds or to max events */
    simulate(endTime = 1000000, maxEvents = 1000000) {
        // fire all the start functions
        console.log('startlist entities', this.startList);
        this.maxTime = endTime;
        this.maxEvents = maxEvents;
        this.startList.map((entity) => entity['start']());
        this.intervalTimer = setInterval(() => this.simInterval(), 500);
    }
    /** filters in place, instead of reallocating and copying */
    filterCancelled() {
        console.log('Before removing cancelled: ', Model.queue);
        let i = Model.queue.length;
        while (i--) {
            if (Model.queue[i].cancelled) {
                Model.queue.splice(i, 1);
            }
        }
        console.log('After removing cancelled: ', Model.queue);
    }
    simInterval = async () => {
        if (this.events > this.maxEvents) {
            console.log(`Simulation exceeded ${this.maxEvents} steps, terminated.`);
            clearInterval(this.intervalTimer);
        }
        if (Model.simTime > this.maxTime) {
            console.log(`Simulation exceeded ${this.maxTime} steps, terminated.`);
            clearInterval(this.intervalTimer);
        }
        // // Uh oh.. we are out of time now
        // console.log(ro)
        // if (ro.deliverAt > endTime) {
        //     console.log(`Current request exceeds endtime ${endTime} seconds.simulation terminated.`)
        //     break;
        // }
        console.log('in simInterval, sim queue size', Model.queue.length);
        // start by removing stuff already serviced and sorting in place (very fast if no changes)
        this.filterCancelled();
        if (Model.queue.length == 0) {
            console.log(`Queue is empty.Simulation has ended in ${Model.simTime} seconds, ${this.events} events, ${this.messages} messages.`);
            clearInterval(this.intervalTimer);
            this.finalize();
        }
        else {
            Model.queue.sort((prev, curr) => prev.deliverAt - curr.deliverAt);
            try {
                // timer = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                // Get the earliest timer event and move the clock forward to it
                let firstItem = Model.queue.find(ro => ro !== undefined);
                console.log('%cfirstItem', 'color:pink;', firstItem);
                Model.simTime = firstItem.deliverAt;
                if (firstItem.signature == 'setTimer' && firstItem.deliverAt <= Model.simTime) {
                    console.log(`at time ${Model.simTime} we found a Timer ready to resolve`);
                    console.log(firstItem);
                    firstItem.resolve(true);
                    firstItem.cancelled = true;
                }
                if (firstItem.signature == 'sendMessage' && firstItem.deliverAt <= Model.simTime) {
                    console.log(`at time ${Model.simTime} we found a Message ready to send`);
                    // firstItem.callback()    // the message is a function call
                    firstItem.resolve(firstItem.callback());
                    firstItem.cancelled = true;
                    this.messages += 1;
                }
                Model.queue.forEach((ro) => {
                    // // Advance simulation time
                    // Model.simTime = ro.deliverAt;
                    // // If this event is already cancelled, ignore
                    // if (ro.cancelled) {
                    //     continue
                    // }
                    // console.log('%c about to deliver', 'color:pink;', ro)
                    // this.events += 1
                    // console.log(`%c switch on ${ro.signature}`, 'color:green;', ro)
                    switch (ro.signature) {
                        case 'putBuffer': //   put fungible tokens in a buffer
                            console.log('in putBuffer');
                            if ((ro.onObject.capacity - ro.onObject.inStorage) >= ro.bufferRequest) {
                                ro.onObject.inStorage += ro.bufferRequest;
                                ro.callback();
                            }
                            break;
                        case 'getBuffer': //   get tokens from buffer
                            if (ro.onObject.inStorage >= ro.bufferRequest) {
                                ro.onObject.inStorage -= ro.bufferRequest;
                                ro.callback();
                            }
                            break;
                        case 'useFacility': //   use a facility
                        case 'putStore': //   store distinct objects in a store
                        case 'getStore': //   retrieve object from a store
                        case 'waitEvent': //   wait on an event
                        case 'queueEvent': //   queue on an event
                        case 'sendMessage': // ignore, we handled it above
                        case 'setTimer':
                            break;
                        default:
                            throw new Error(`unknown Request, created with command ${ro.signature}`);
                    }
                });
            }
            catch (error) {
                console.error(error);
                clearInterval(this.intervalTimer);
            }
        }
    };
    time() {
        return Model.simTime;
    }
    addEntity(entity) {
        // create a list of 'start()' calls to kick off the simulation
        // if (!Object.hasOwn(entity, 'start')) {      // ?? this doesn't work ??
        if (!(typeof entity['start'] === 'function')) {
            console.log(entity);
            throw new Error(`Entity ${entity.name} does not have a start() method.It is required.`);
        }
        this.startList.push(entity);
        // entity.start()   // fire the start method of that entity
        return entity; // encourage chaining
    }
    // step() {
    //     while (true) {  // eslint-disable-line no-constant-condition
    //         const ro = Sim.queue.remove();
    //         if (ro === null)
    //             return false;
    //         Model.simTime = ro.deliverAt;
    //         if (!ro.cancelled)
    //             ro.deliver();
    //         break;
    //     }
    //     return true;
    // }
    finalize() {
        // this is just a recursive call, what are we doing?
        //     Sim.entities.map((entity) => entity.finalize());
    }
    // messages are always to Entities, but maybe from ???.   So park processMessage in Request
    /** Messages are objects that entities can send to each other. The messages
    * can be any JavaScript type \-- numbers, string, functions, arrays, objects etc.
    *
    * As an example, consider a ping-pong game played by two players where
    * they send a string back and forth to each other. Before resending the
    * string, each player appends his/her name to the string. We will model
    * the two players as entities and the string as a message.
    *
    */
    oldsendMessage(callback, delay, toEntity) {
        // we just set up as if a timer.  the callback does all the work
        console.log('sendMessage', Model.queue);
        const ro = new Request(Model.simTime + delay, 'sendMessage');
        // ro.createdBy = fromEntity
        ro.createdAt = Model.simTime;
        ro.callback = callback; // we'll do this at timeout
        ro.promise = new Promise(resolve => { });
        console.log('sendMessage 2', Model.queue);
        Model.queue.push(ro);
    }
    async setTimer(delay) {
        console.log('arrived in setTimer()');
        const ro = new Request(Model.simTime + delay, 'setTimer');
        ro.createdAt = Model.simTime;
        let { promise, resolve, reject } = Promise.withResolvers();
        ro.promise = promise;
        ro.resolve = resolve;
        Model.queue.push(ro);
        console.log('setTimer just pushed this into the queue', ro);
        console.log('setTimer', Model.queue);
        return ro.promise;
    }
    /** send a message (usually to another entity) eg:  */
    async sendMessage(callback, delay = 0) {
        ////////////// if array, we can do this
        // for (let el of array) {
        //     await this.sleep(el);
        //     console.log(el);
        // };
        const ro = new Request(Model.simTime + delay, 'sendMessage');
        ro.createdAt = Model.simTime;
        ro.callback = callback; // we'll do this at timeout
        let { promise, resolve, reject } = Promise.withResolvers();
        ro.promise = promise;
        ro.resolve = resolve;
        Model.queue.push(ro);
        console.log('sendMessage just pushed this into the queue', ro);
        console.log('sendMessage', Model.queue);
        return ro.promise;
    }
}
/** *Facility* is a resource that is used by entities for a finite duration.
* There is a limit on the number of entities that can use the facility at
* a given time. As an example, consider a barbershop (the facility) with
* m barbers (capacity of facility). The customers arrive at shop and
* wish to \'use\' the resource (barber); if all barbers are busy, the
* customers wait until one barber is available.
*/
export class Facility extends Sim {
    servers;
    free;
    serverStatus = [];
    facilityQueue = [];
    maxqlen; //-1 is unlimited
    //    queue: PQueue     // already in SIM
    discipline;
    stats;
    busyDuration = 0;
    lastIssued = 0;
    currentRO = null;
    constructor(name, discipline = 'FCFS', servers = 1, maxqlen = -1) {
        super(name);
        this.entityType = 'Facility';
        this.servers = servers;
        this.free = servers;
        this.maxqlen = maxqlen;
        this.discipline = discipline;
        switch (discipline) {
            case 'LCFS':
                break;
            case 'PS':
                break;
            case 'FCFS':
                this.serverStatus = new Array(servers);
                for (let i = 0; i < this.serverStatus.length; i++) {
                    this.serverStatus[i] = true;
                }
        }
        this.stats = new Population(name + ' Population');
        this.busyDuration = 0;
    }
    reset() {
        this.facilityQueue = []; // may have orphan Requests in the main queue
        this.stats.reset();
        this.busyDuration = 0;
    }
    systemStats() {
        return this.stats;
    }
    // queueStats() {
    //     return this.facilityQueue.report();
    // }
    // usage() {
    //     return this.busyDuration;
    // }
    // /** propagate finalize to  */
    // finalize() {
    //     this.stats.finalize();
    //     this.facilityQueue.finalize();
    // }
    useFCFS(duration, ro) {
        if ((this.maxqlen === 0 && !this.free)
            || (this.maxqlen > 0 && this.facilityQueue.size() >= this.maxqlen)) {
            ro.data = -1;
            ro.deliverAt = Model.simTime;
            Model.queue.push(ro);
            return;
        }
        ro.duration = duration;
        const now = Model.simTime;
        this.stats.enter(now);
        this.facilityQueue.push(ro);
        this.useFCFSSchedule(now);
    }
}
export class BufferPool extends Sim {
    capacity;
    inStorage;
    constructor(name, capacity, initial = 0) {
        super(name);
        this.entityType = 'Buffer';
        this.capacity = capacity;
        this.inStorage = this.capacity - initial;
    }
    current() {
        return this.inStorage;
    }
    size() {
        return this.capacity;
    }
    // case 'putBuffer':          //   put fungible tokens in a buffer
    // console.log('in putBuffer')
    // if(((ro.onObject as BufferPool).capacity - (ro.onObject as BufferPool).inStorage) >= ro.bufferRequest) {
    // (ro.onObject as BufferPool).inStorage += ro.bufferRequest
    // ro.callbacks.map((callbackfn: Function) => { callbackfn(this) })
    //
    //
    // case 'getBuffer':          //   get tokens from buffer
    // if ((ro.onObject as BufferPool).inStorage >= ro.bufferRequest) {
    // (ro.onObject as BufferPool).inStorage -= ro.bufferRequest
    // ro.callbacks.map((callbackfn: Function) => { callbackfn(this) })
    //
    get(amount) {
        if (this.getQueue.empty()
            && amount <= this.inStorage) {
            this.inStorage -= amount;
            ro.deliverAt = ro.toEntity.time();
            ro.toEntity.queue.insert(ro);
            this.getQueue.passby(ro.deliverAt);
            this.progressPutQueue();
            return;
        }
        ro.bufferRequest = amount;
        this.getQueue.q_push(ro, ro.toEntity.time());
    }
    put(amount, ro) {
        if (this.putQueue.empty()
            && (amount + this.inStorage) <= this.capacity) {
            this.inStorage += amount;
            ro.deliverAt = ro.toEntity.time();
            ro.toEntity.queue.insert(ro);
            this.putQueue.passby(ro.deliverAt);
            this.progressGetQueue();
            return;
        }
        ro.bufferRequest = amount;
        this.putQueue.q_push(ro, ro.toEntity.time());
    }
    progressGetQueue() {
        let obj;
        while (obj = this.getQueue.q_top()) { // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.getQueue.q_shift(obj.toEntity.time());
                continue;
            }
            // see if this request can be satisfied
            if (obj.amount <= this.inStorage) {
                // remove it..
                this.getQueue.q_shift(obj.toEntity.time());
                this.inStorage -= obj.amount;
                obj.deliverAt = obj.toEntity.time();
                obj.toEntity.queue.insert(obj);
            }
            else {
                // this request cannot be satisfied
                break;
            }
        }
    }
    progressPutQueue() {
        let obj;
        while (obj = this.putQueue.q_top()) { // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.putQueue.q_shift(obj.toEntity.time());
                continue;
            }
            // see if this request can be satisfied
            if (obj.amount + this.inStorage <= this.capacity) {
                // remove it..
                this.putQueue.q_shift(obj.toEntity.time());
                this.inStorage += obj.amount;
                obj.deliverAt = obj.toEntity.time();
                obj.toEntity.queue.insert(obj);
            }
            else {
                // this request cannot be satisfied
                break;
            }
        }
    }
    putStats() {
        return this.putQueue.stats;
    }
    getStats() {
        return this.getQueue.stats;
    }
}
export class Store extends Sim {
    capacity;
    available;
    objects = [];
    putQueue = []; // waiting to put something in the store
    getQueue = []; // waiting to get something from the store
    constructor(name, capacity) {
        super(name + ' Store');
        this.entityType = 'Store';
        this.capacity = capacity;
        this.available = capacity;
        this.objects = [];
    }
    current() {
        return this.objects.length;
    }
    size() {
        return this.capacity;
    }
    get(filter, ro) {
        if (this.getQueue.empty() && this.current() > 0) {
            let found = false;
            let obj;
            // TODO: refactor this code out
            // it is repeated in progressGetQueue
            if (filter) {
                for (let i = 0; i < this.objects.length; i++) {
                    obj = this.objects[i];
                    if (filter(obj)) {
                        found = true;
                        this.objects.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                obj = this.objects.shift();
                found = true;
            }
            if (found) {
                this.available--;
                ro.message = obj;
                ro.deliverAt = ro.toEntity.time();
                ro.toEntity.queue.insert(ro);
                this.getQueue.passby(ro.deliverAt);
                this.progressPutQueue();
                return;
            }
        }
        ro.filter = filter;
        this.getQueue.q_push(ro, ro.toEntity.time());
    }
    put(obj, ro) {
        if (this.putQueue.empty() && this.current() < this.capacity) {
            this.available++;
            ro.deliverAt = ro.toEntity.time();
            ro.toEntity.queue.insert(ro);
            this.putQueue.passby(ro.deliverAt);
            this.objects.push(obj);
            this.progressGetQueue();
            return;
        }
        ro.obj = obj;
        this.putQueue.q_push(ro, ro.toEntity.time());
    }
    progressGetQueue() {
        let ro;
        while (ro = this.getQueue.q_top()) { // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.getQueue.q_shift(ro.toEntity.time());
                continue;
            }
            // see if this request can be satisfied
            if (this.current() > 0) {
                const filter = ro.filter;
                let found = false;
                let obj;
                if (filter) {
                    for (let i = 0; i < this.objects.length; i++) {
                        obj = this.objects[i];
                        if (filter(obj)) { // eslint-disable-line max-depth
                            found = true;
                            this.objects.splice(i, 1);
                            break;
                        }
                    }
                }
                else {
                    obj = this.objects.shift();
                    found = true;
                }
                if (found) {
                    // remove it..
                    this.getQueue.q_shift(ro.toEntity.time());
                    this.available--;
                    ro.message = obj;
                    ro.deliverAt = ro.toEntity.time();
                    ro.toEntity.queue.insert(ro);
                }
                else {
                    break;
                }
            }
            else {
                // this request cannot be satisfied
                break;
            }
        }
    }
    progressPutQueue() {
        let ro;
        while (ro = this.putQueue.q_top()) { // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.putQueue.q_shift(ro.toEntity.time());
                continue;
            }
            // see if this request can be satisfied
            if (this.current() < this.capacity) {
                // remove it..
                this.putQueue.q_shift(ro.toEntity.time());
                this.available++;
                this.objects.push(ro.obj);
                ro.deliverAt = ro.toEntity.time();
                ro.toEntity.queue.insert(ro);
            }
            else {
                // this request cannot be satisfied
                break;
            }
        }
    }
    putStats() {
        return this.putQueue.stats;
    }
    getStats() {
        return this.getQueue.stats;
    }
}
export class Event extends Model {
    waitList = 0; // NOT a priority queue
    waitQueue = []; // these are COPIES of ro's in main queue
    isFired = false;
    timeSeries;
    isQueue = false; // we figure out internallw whether we are counting or queueing - not BOTH
    constructor(name) {
        super(name);
        this.timeSeries = new TimeSeries(name);
    }
    /** mark as waiting for Event - just a counter but also keeps statistics */
    waitEvent() {
        this.assertTrue(this.isQueue == false, `${this.name} seems to have both waitList and waitQueue. Should have one OR the other.`);
        if (this.isFired) {
            this.timeSeries.record(0, Model.simTime); // 0 to make it obvious
        }
        else {
            this.waitList += 1;
            this.timeSeries.record(this.waitList, Model.simTime);
        }
    }
    /** keep waiting callback requests in the queue */
    queueEvent(callback) {
        this.isQueue = true;
        this.assertTrue(this.waitList == 0, `${this.name} seems to have both waitList and waitQueue. Should have one OR the other.`);
        if (this.isFired) {
            this.timeSeries.record(0, Model.simTime); // 0 to make it obvious
        }
        else {
            this.waitQueue.push(callback);
            this.timeSeries.record(this.waitQueue.length, Model.simTime);
        }
    }
    // TODO: for future,
    // what should happen if requests in both waitList and waitQueue.
    //    i'm thinking that an Event should be one or the other
    // do we need a way to cancel everything in the queues?  clear + cancel
    /** Fire the event */
    fire(keepFired = false) {
        this.timeSeries.record(Math.max(this.waitList, this.waitQueue.length), Model.simTime); // one should be always zero
        this.isFired = keepFired; // can reset with fire(false)
        // Dispatch all waiting entities by setting their timestamp to NOW
        if (this.isQueue) {
            this.waitQueue.map((callback) => callback());
            this.waitQueue = [];
        }
        else {
            this.waitList = 0;
        }
    }
    /** If this event was fired with 'keepFired', then clear it.  Queues will
     * be empty if entity called fire(true).
    */
    clear() {
        this.isFired = false;
        this.isQueue = false;
        this.waitList = 0;
        this.waitQueue = [];
        this.timeSeries.record(0, Model.simTime); // 0 to make it obvious
    }
}
/** Entities are the actors in the simulation. */
export class Entity extends Model {
    constructor(name) {
        super(name);
        console.log(Model.currentSim);
        // entity extends Model, doesn't know about SIM.  But SIM extends Model too.
        Model.currentSim.addEntity(this); // ugly way to self-register without circular reference
        // this.entityType = 'Entity'
    }
    // time(): number {
    //     return Model.simTime;
    // }
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // these are the seven ways to create a Request:
    //    setTimer()      set a timer
    //    useFacility()   use a facility
    //    putBuffer()     put fungible tokens in a buffer
    //    getBuffer()     get tokens from buffer
    //    putStore()      store distinct objects in a store
    //    getStore()      retrieve object from a store
    //    waitEvent()     wait on an event
    //    queueEvent()    queue on an event
    //    sendMessage()
    // setTimer(duration: number): Promise<unknown> {
    // this.debug(3, `SetTimer(): Creating a new Request '${this.name}'`)
    // let endTime = Model.simTime + duration
    // let ro = new Request(endTime, `setTimer`);
    // let promise = new Promise(resolve => { })
    // ro.promise = promise
    // Model.queue.push(ro);
    // return promise
    // }
    // class Thenable {
    //     constructor(num) {
    //       this.num = num;
    //     }
    //     then(resolve, reject) {
    //       alert(resolve);
    //       // resolve with this.num*2 after 1000ms
    //       setTimeout(() => resolve(this.num * 2), 1000); // (*)
    //     }
    //   }
    // then(resolve,reject){
    // }
    /** set a timer.  eg:   this.setTimer(n).done(callback) */
    oldsetTimer(duration) {
        this.debug(3, `SetTimer(): Creating a new Request '${this.name}'`);
        let endTime = Model.simTime + duration;
        let ro = new Request(endTime, `setTimer`);
        Model.queue.push(ro);
        return ro;
    }
    /** wait on an event.  When the event firest, ALL requests waiting for it will process. */
    waitEvent(event) {
        let ro = new Request(Number.MAX_SAFE_INTEGER, `waitEvent`);
        Model.queue.push(ro); // in the main queue
        if (event.isFired)
            ro.timestamp = Model.simTime; // fires right away, no need to queue
        else
            event.waitList.push(ro); // a copy in the waitlist queue
        return ro;
    }
    /** queue on an event.  When the event fires, only the FIRST request waiting for it will process. */
    queueEvent(event) {
        let timestamp = event.isFired ? Model.simTime : Number.MAX_SAFE_INTEGER; // now or later
        let ro = new Request(Number.MAX_SAFE_INTEGER, `queueEvent`);
        Model.queue.push(ro); // in the main queue
        if (event.isFired)
            ro.timestamp = Model.simTime; // fires right away, no need to queue
        else
            event.waitQueue.push(ro); // a copy in the waitlist queue
        return ro;
    }
    /** use a facility for some duration */
    useFacility(facility, discipline, duration) {
        let ro = new Request(Number.MAX_SAFE_INTEGER, `useFacility(${facility.name}, ${discipline}, ${duration})`);
        ro.discipline = discipline;
        ro.duration = duration;
        Model.queue.push(ro);
        Facility.queue.insert(ro);
        return ro;
    }
    /** Attempt to store amount number of the tokens in buffer, returning a Request.  */
    putBuffer(buffer, amount) {
        console.log(`adding amount ${amount} to BufferPool ${buffer.name} `);
        this.assertTrue(amount <= buffer.capacity, `Tried to add ${amount} to buffer ${buffer.name}) but capacity only ${buffer.capacity}`);
        const ro = new Request(Model.simTime, 'putBuffer');
        ro.bufferRequest = amount;
        ro.onObject = buffer;
        return ro;
    }
    /** Attempt to retrieve amount number of tokens from buffer, returning a Request. */
    getBuffer(buffer, amount) {
        console.log(`subtracting amount ${amount} from BufferPool ${buffer.name} `);
        const ro = new Request(Model.simTime, 'getBuffer');
        ro.bufferRequest = amount;
        ro.onObject = buffer;
        return ro;
    }
    /** Attempt to store object in store. This returns a Request object. */
    putStore(store, obj) {
        const ro = new Request(this, Model.simTime, 0);
        ro.source = store;
        store.put(obj, ro);
        return ro;
    }
    /** Attempt to retrieve object from buffer. If the filter function is supplied then the
     * first object (in FIFO order) that matches the filter is retrieved; otherwise the first
     * object in FIFO order is retrieved. This returns a Request object. */
    getStore(store, filter) {
        const ro = new Request(this, Model.simTime, 0);
        ro.source = store;
        store.get(filter, ro);
        return ro;
    }
}
//# sourceMappingURL=sim.js.map