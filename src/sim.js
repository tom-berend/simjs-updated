//TODO:  check out https://github.com/ed-sim/ed-sim-js
import { Model } from './model.js';
import { Population } from './stats.js';
import { Request } from './request.js';
// the system has Entities, Events, Stores, Buffers, Facilities that extend Model
/** root simulation class.  let sim = new Sim(name, isRealTime) */
export class Sim extends Model {
    startList = []; // these are the 'start' functions for every entity
    isRealTime;
    realTimeClock = 0;
    events = 0;
    messages = 0;
    constructor(name = 'Sim', isRealTime = false) {
        super(name);
        Model.currentSim = this; // register SIM object to parent so can access from entities.
        this.isRealTime = isRealTime;
        // set the real-time clock ticking
        setInterval(() => this.realTimeClock += .1, 100); // not very accurate
    }
    debug(level, message) { }
    /** run the simulation for a specific # of seconds or to max events */
    async simulate(endTime = 1000000, maxEvents = 1000000) {
        // fire all the start functions
        console.log('startlist entities', this.startList);
        this.startList.map((entity) => entity['start']());
        console.log('in simulate, sim queue size', Model.queue.size());
        try {
            // Get the earliest event
            while (!Model.queue.empty()) {
                if (this.events > maxEvents) {
                    console.log(`Simulation exceeded ${maxEvents} steps, terminated.`);
                    break;
                }
                // we know there is an element in the queue (our while loop)
                const ro = Model.queue.remove();
                console.log('processing next  Request:', ro);
                // Uh oh.. we are out of time now
                console.log(ro);
                if (ro.deliverAt > endTime) {
                    console.log(`Current request exceeds endtime ${endTime} seconds.simulation terminated.`);
                    break;
                }
                // Advance simulation time
                Model.simTime = ro.deliverAt;
                // If this event is already cancelled, ignore
                if (ro.cancelled) {
                    continue;
                }
                console.log('%c about to deliver', 'color:pink;', ro);
                this.events += 1;
                console.log(`%c switch on ${ro.createdWith}`, 'color:green;', ro);
                switch (ro.createdWith) {
                    case 'setTimer': //   set a timer
                        if (!ro.cancelled) {
                            ro.callbacks.map((callbackfn) => { callbackfn(this); });
                        }
                        break;
                    case 'useFacility': //   use a facility
                    case 'putBuffer': //   put fungible tokens in a buffer
                    case 'getBuffer': //   get tokens from buffer
                    case 'putStore': //   store distinct objects in a store
                    case 'getStore': //   retrieve object from a store
                    case 'waitEvent': //   wait on an event
                    case 'queueEvent': //   queue on an event
                        break;
                    case 'sendMessage': //   send a message entity-to-entity
                        ro.callbacks[0](ro); //   always only one callback
                        // ro.cancel()
                        this.messages += 1;
                        break;
                    default:
                        throw new Error(`unknown Request, created with command ${ro.createdWith}`);
                }
            }
            console.log(`Queue is empty.Simulation has ended in ${Model.simTime} seconds, ${this.events} events, ${this.messages} messages.`);
            this.finalize();
        }
        catch (error) {
            console.error(error);
        }
    }
    /** useful for debugging simulations, also helps document them. */
    assertTrue(condition, message) {
        if (!condition) {
            this.log(message, 'red', 'white');
        }
    }
    time() {
        return Model.simTime;
    }
    addEntity(entity) {
        this.debug(3, `addEntity(Entity ${entity.name})`);
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
    sendMessage(callback, delay, toEntity) {
        // we just set up as if a timer.  the callback does all the work
        const ro = new Request(Model.simTime + delay, 'sendMessage');
        // ro.createdBy = fromEntity
        ro.createdAt = Model.simTime;
        ro.callbacks.push(callback);
        Model.queue.insert(ro);
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
        this.facilityQueue.clear(); // may have orphan Requests in the main queue
        this.stats.reset();
        this.busyDuration = 0;
    }
    systemStats() {
        return this.stats;
    }
    queueStats() {
        return this.facilityQueue.report();
    }
    usage() {
        return this.busyDuration;
    }
    /** propagate finalize to  */
    finalize() {
        this.stats.finalize();
        this.facilityQueue.finalize();
    }
    useFCFS(duration, ro) {
        if ((this.maxqlen === 0 && !this.free)
            || (this.maxqlen > 0 && this.facilityQueue.size() >= this.maxqlen)) {
            ro.data = -1;
            ro.deliverAt = Model.simTime;
            Sim.queue.insert(ro);
            return;
        }
        ro.duration = duration;
        const now = Model.simTime;
        this.stats.enter(now);
        this.facilityQueue.insert(ro);
        this.useFCFSSchedule(now);
    }
    useFCFSSchedule(timestamp) {
        while (this.free > 0 && !this.facilityQueue.empty()) {
            const ro = this.facilityQueue.remove();
            if (ro.cancelled) {
                continue;
            }
            for (let i = 0; i < this.serverStatus.length; i++) {
                if (this.serverStatus[i]) {
                    this.serverStatus[i] = false;
                    ro.data = i;
                    break;
                }
            }
            this.free--;
            this.busyDuration += ro.duration;
            // cancel all other reneging requests
            ro.cancelRenegeClauses();
            const newro = new Request(timestamp + ro.duration, this.entityType);
            newro.done(() => this.useFCFSCallback(ro));
            Sim.queue.insert(newro);
        }
    }
    useFCFSCallback(ro) {
        // We have one more free server
        this.free++;
        this.serverStatus[ro.data] = true;
        this.stats.leave(ro.scheduledAt, ro.toEntity.time());
        // if there is someone waiting, schedule it now
        this.useFCFSSchedule(ro.toEntity.time());
        // restore the deliver function, and deliver
        ro.deliver();
    }
    useLCFS(duration, ro) {
        // if there was a running request..
        if (this.currentRO) {
            this.busyDuration += (this.currentRO.toEntity.time() - this.currentRO.lastIssued);
            // calcuate the remaining time
            this.currentRO.remaining = (this.currentRO.deliverAt - this.currentRO.toEntity.time());
            // preempt it..
            this.facilityQueue.q_push(this.currentRO, ro.toEntity.time());
        }
        this.currentRO = ro;
        // If this is the first time..
        if (!ro.saved_deliver) {
            ro.cancelRenegeClauses();
            ro.remaining = duration;
            ro.saved_deliver = ro.toEntity;
            ro.toEntity = this;
            this.stats.enter(ro.toEntity.time());
        }
        ro.lastIssued = ro.toEntity.time();
        // schedule this new event
        ro.deliverAt = ro.toEntity.time() + duration;
        Sim.queue.insert(ro);
    }
    useLCFSCallback(ro) {
        const facility = this.source;
        //  sanity checks - should be OUR current RO
        if (this.currentRO == null) {
            console.error('strange');
            return;
        }
        else {
            if (ro.id !== this.currentRO.id) {
                console.error('strange');
                return;
            }
            if (this.currentRO.toEntity.id == this.currentRO.saved_deliver.id) {
                console.error('strange, we store the ORIGINAL toEntity in save_deliver so we can send a message to ourselves');
                return;
            }
            // stats
            this.busyDuration += (this.currentRO.toEntity.time() - this.lastIssued);
            this.stats.leave(this.currentRO.scheduledAt, Model.simTime);
            // deliver this request
            this.currentRO.toEntity = this.currentRO.saved_deliver;
            // delete this.saved_deliver;
            this.currentRO.deliver();
            this.currentRO = null;
        }
        // see if there are pending requests
        if (!this.facilityQueue.empty()) {
            const newRO = this.facilityQueue.q_pop(Model.simTime);
            this.useLCFS(newRO.remaining, newRO);
        }
    }
    useProcessorSharing(duration, ro) {
        ro.duration = duration;
        ro.cancelRenegeClauses();
        this.stats.enter(ro.toEntity.time());
        this.useProcessorSharingSchedule(ro, true);
    }
    useProcessorSharingSchedule(ro, isAdded) {
        const current = ro.toEntity.time();
        const size = this.facilityQueue.size();
        const multiplier = isAdded ? ((size + 1.0) / size) : ((size - 1.0) / size);
        const newQueue = [];
        if (this.facilityQueue.size() == 0) {
            this.lastIssued = current;
        }
        // for (let i = 0; i < size; i++) {
        //     const ev = Model.queue[i];
        //     if (ev.ro === ro) {
        //         continue;
        //     }
        //     const newev = new Request(
        //         this, current, current + (ev.deliverAt - current) * multiplier);
        //     newev.ro = ev.ro;
        //     newev.source = this;
        //     newev.deliver = this.useProcessorSharingCallback;
        //     newQueue.push(newev);
        //     ev.cancel();
        //     ro.toEntity.queue.insert(newev);
        // }
        // // add this new request
        // if (isAdded) {
        //     const newev = new Request(
        //         this, current, current + ro.duration * (size + 1));
        //     newev.ro = ro;
        //     newev.source = this;
        //     newev.deliver = this.useProcessorSharingCallback;
        //     newQueue.push(newev);
        //     ro.toEntity.queue.insert(newev);
        // }
        // Model.queue = newQueue;
        // // usage statistics
        // if (this.facilityQueue.length === 0) {
        //     this.busyDuration += (current - this.lastIssued);
        // }
    }
    useProcessorSharingCallback() {
        const fac = this.source;
        //  sanity checks - should be OUR current RO
        if (this.currentRO == null) {
            console.error('strange');
            return;
        }
        else {
            if (this.currentRO.cancelled)
                return;
            this.stats.leave(this.currentRO.scheduledAt, this.currentRO.toEntity.time());
            this.useProcessorSharingSchedule(this.currentRO, false);
            this.currentRO.deliver();
        }
    }
}
export class Buffer extends Sim {
    capacity;
    available;
    putQueue = [];
    getQueue = [];
    constructor(name, capacity, initial) {
        super(name);
        this.entityType = 'Buffer';
        this.capacity = capacity;
        this.available = (typeof initial === 'undefined') ? 0 : initial;
    }
    current() {
        return this.available;
    }
    size() {
        return this.capacity;
    }
    get(amount, ro) {
        if (this.getQueue.empty()
            && amount <= this.available) {
            this.available -= amount;
            ro.deliverAt = ro.toEntity.time();
            ro.toEntity.queue.insert(ro);
            this.getQueue.passby(ro.deliverAt);
            this.progressPutQueue();
            return;
        }
        ro.amount = amount;
        this.getQueue.q_push(ro, ro.toEntity.time());
    }
    put(amount, ro) {
        if (this.putQueue.empty()
            && (amount + this.available) <= this.capacity) {
            this.available += amount;
            ro.deliverAt = ro.toEntity.time();
            ro.toEntity.queue.insert(ro);
            this.putQueue.passby(ro.deliverAt);
            this.progressGetQueue();
            return;
        }
        ro.amount = amount;
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
            if (obj.amount <= this.available) {
                // remove it..
                this.getQueue.q_shift(obj.toEntity.time());
                this.available -= obj.amount;
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
            if (obj.amount + this.available <= this.capacity) {
                // remove it..
                this.putQueue.q_shift(obj.toEntity.time());
                this.available += obj.amount;
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
    waitList = []; // NOT a priority queue
    waitQueue = []; // these are COPIES of ro's in main queue
    isFired = false;
    constructor(name) {
        super(name);
    }
    // TODO: for future,
    // what should happen if requests in both waitList and waitQueue.
    //    i'm thinking that an Event should be one or the other
    // do we need a way to cancel everything in the queues?  clear + cancel
    /** Fire the event */
    fire(keepFired = false) {
        this.isFired = keepFired; // can reset with fire(false)
        // Dispatch all waiting entities by setting their timestamp to NOW
        this.waitList.map((ro) => ro.timestamp = Model.simTime);
        this.waitList = [];
        // queued elements are more complex
        if (this.isFired) { // probably never happens
            this.waitQueue.map((ro) => ro.timestamp = Model.simTime); // all
            this.waitQueue = [];
        }
        else { // just release one element
            // two steps.  first we dispose of any cancelled events
            // just deleting our copy, the main queue still hold them
            this.waitQueue = this.waitQueue.filter((ro) => !ro.cancelled);
            // now try to unqueue something
            if (this.waitQueue.length > 0) {
                this.waitQueue[0].timestamp = Model.simTime; // set to now
                this.waitQueue.shift(); // and remove our copy
            }
        }
    }
    /** If this event was fired with 'keepFired', then clear it.  Queues will
     * be empty if entity called fire(true).
    */
    clear() {
        this.isFired = false;
    }
}
/** Entities are the actors in the simulation. */
export class Entity extends Model {
    constructor(name) {
        super(name);
        console.log(Model.currentSim);
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
    /** set a timer.  eg:   this.setTimer(n).done(callback) */
    setTimer(duration) {
        this.debug(3, `SetTimer(): Creating a new Request '${this.name}'`);
        let endTime = Model.simTime + duration;
        let ro = new Request(endTime, `setTimer`);
        console.log('before', Sim.queue);
        Sim.queue.insert(ro);
        console.log('after', Sim.queue);
        return ro;
    }
    /** wait on an event.  When the event firest, ALL requests waiting for it will process. */
    waitEvent(event) {
        let ro = new Request(Number.MAX_SAFE_INTEGER, `waitEvent`);
        Sim.queue.insert(ro); // in the main queue
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
        Sim.queue.insert(ro); // in the main queue
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
        Sim.queue.insert(ro);
        Facility.queue.insert(ro);
        return ro;
    }
    /** Attempt to store amount number of the tokens in buffer, returning a Request. Here's
     * an example of a producer making widgets, who only starts the next when the buffer has space
     * for the current.
     *```js
    *  // Set timer to self (models the time spend in production)
     * let Producer = {
    *   start: function () {
     * this.setTimer(timeToProduce).done(function () {
     *        // Timer expires => item is ready to be stored in buffer.
     *        // When the item is successfully stored in buffer, we repeat
     *        //     the process by recursively calling the same function.
     * this.putBuffer(buffer, 1).done(this.start);
     *   });
     * }
}
    * ```
     */
    putBuffer(buffer, amount) {
        const ro = new Request(Model.simTime, `PutBuffer(${amount})`);
        ro.amount = amount;
        buffer.putQueue.insert(ro);
        return ro;
    }
    /** Attempt to retrieve amount number of tokens from buffer, returning a Request.  Here's
     * an example of a consumer waiting for tokens.
     *```js
    *  var Consumer = {
        *      start: function () {
     *          // Retrieve one token from buffer
     * this.getBuffer(buffer, 1).done(function () {
     *              // After an item has been retrieved, wait for some time
     *              //   to model the consumption time.
     *              // After the waiting period is over, we repeat by
     *              //   recursively calling this same function.
     * this.setTimer(timeToConsume).done(this.start);
     *          });
     *      }
    }
        * ```
     */
    getBuffer(buffer, amount) {
        const ro = new Request(this, Model.simTime, 0);
        ro.amount = amount;
        buffer.getQueue.insert(ro);
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