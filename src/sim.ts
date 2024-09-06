//TODO:  check out https://github.com/ed-sim/ed-sim-js


import { PQueue, Queue } from './queues.js';
import { Population } from './stats.js';
import { Request } from './request.js';



export class Debug {
    static debugLevel: number = 3    // 0=none, 3=all
    static debugTrace: boolean = true

    /** debug message for Entities, Facilities, stuff that inherits from SIM */
    static debug(level: number, message: string, color: string = 'white') {
        if (this.debugLevel >= level) {

            if (this.debugTrace)
                console.trace('%c' + message, "color:" + color + ";background:'white';")
            else
                console.log('%c' + message, `color:'${color}';background:'white';`)

        }
    }
}

type message = {
    sender: string
    message: any
}

/** root simulation class.  let sim = new Sim() */
export class Sim {
    static entities: Entity[] = []   // this tracks every entity
    static queue: PQueue


    id: Symbol
    name: string

    simTime = 0
    endTime: number
    entityId: number
    source: Buffer | Store | Facility | null
    logger: Function

    messageQueue: message[] = []   // so they don't live on the stack

    constructor(name: string = 'System') {
        this.id = Symbol()
        this.name = name
        this.simTime = 0
        this.entityId = 1
        this.endTime = 0

        this.messageQueue = []

        if (!Sim.queue)         // static system queue
            Sim.queue = new PQueue(name)

        this.source = null
        this.logger = (message: string) => console.log("%c" + message, "color:blue;background-color:white;")

        Debug.debug(2, `creating new entity '${this.name}'`)
    }


    time(): number {
        return this.simTime;
    }

    /** send a message to another Entity. */
    sendMessage(message: any, duration: number, toEntities: Entity | Entity[], fromEntity: Entity) {

        Debug.debug(3, `sending ${message} from ${fromEntity.name} to ${toEntities.name}`)

        if (toEntities instanceof Array) {
            for (let i = toEntities.length - 1; i >= 0; i--) {
                const entity = toEntities[i];

                if (entity.id == this.id) {
                    console.error(`Entity '${this.name}' is trying to send message ${message} to itself.`)
                    continue;  // not to myself
                }
                if (entity.onMessage)
                    entity.onMessage(fromEntity, message);

            }
        } else {
            if (toEntities.onMessage)
                toEntities.onMessage(fromEntity, message);
        }
    }





    addEntity(entity: Entity): Entity {
        Debug.debug(3, `addEntity(Entity ${entity.name} )`)

        Sim.entities.push(entity);

        // entity.start()   // fire the start method of that entity
        return entity    // encourage chaining
    }


    /** run the simulation for a specific # of seconds or to max events */
    simulate(endTime: number = 1000000, maxEvents: number = 1000000) {
        let events = 0;

        Sim.entities.map((entity) => (entity as any).start())

        try {

            console.log('sim queue',Sim.queue)

            // Get the earliest event
            while (!Sim.queue.empty()) {

                events++;
                if (events > maxEvents) {
                    this.logger(`Simulation exceeded ${maxEvents} steps, terminated.`)
                    break;
                }

                const ro: Request = Sim.queue.remove();

                // Uh oh.. we are out of time now
                if (ro.deliverAt > endTime) {
                    this.logger(`Current request exceeds endtime ${endTime} seconds.simulation terminated.`)
                    break;
                }

                // Advance simulation time
                this.simTime = ro.deliverAt;

                // If this event is already cancelled, ignore
                if (!ro.cancelled) {
                    ro.deliver();
                }
            }

            this.logger(`Queue is empty.Simulation has ended after ${events} events.`)
            this.finalize();

        } catch (error) {
            console.error(error)
        }
    }


    step() {
        while (true) {  // eslint-disable-line no-constant-condition
            const ro = Sim.queue.remove();

            if (ro === null) return false;
            this.simTime = ro.deliverAt;
            if (ro.cancelled) continue;
            ro.deliver();
            break;
        }
        return true;
    }

    finalize() {
        // this is just a recursive call, what are we doing?
        //     Sim.entities.map((entity) => entity.finalize());
    }

    setLogger(logger: Function) {
        this.logger = logger;
    }

    log(message: string) {   // all entities, facilities, etc  are descended from sim

        if (!this.logger) return;
        let entityMsg = '';

        this.logger(`${this.name}:  ${this.simTime.toFixed(6)}${entityMsg}   ${message}`);
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
    servers: number
    free: number
    serverStatus: Boolean[] = []
    facilityQueue: PQueue
    maxqlen: number  //-1 is unlimited
    //    queue: PQueue     // already in SIM
    discipline: 'LCFS' | 'PS' | 'FCFS'
    stats: Population
    busyDuration = 0
    lastIssued = 0
    currentRO: Request | null = null

    constructor(name: string, discipline: 'LCFS' | 'PS' | 'FCFS' = 'FCFS', servers: number = 1, maxqlen: number = -1) {
        super(name);

        this.servers = servers
        this.free = servers
        this.maxqlen = maxqlen
        this.facilityQueue = new PQueue(name + ' queue')
        this.discipline = discipline

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
        this.facilityQueue.reset();
        this.stats.reset();
        this.busyDuration = 0;
    }

    systemStats() {
        return this.stats;
    }

    queueStats() {
        return this.facilityQueue.stats;
    }

    usage() {
        return this.busyDuration;
    }

    /** propagate finalize to  */
    finalize() {
        this.stats.finalize();
        this.facilityQueue.stats.finalize();
    }

    useFCFS(duration: number, ro: Request) {
        if ((this.maxqlen === 0 && !this.free)
            || (this.maxqlen > 0 && this.queue.size() >= this.maxqlen)) {
            ro.data = -1;
            ro.deliverAt = this.time();
            Sim.queue.insert(ro);
            return;
        }

        ro.duration = duration;
        const now = this.time();

        this.stats.enter(now);
        this.facilityQueue.push(ro, now);
        this.useFCFSSchedule(now);
    }

    useFCFSSchedule(timestamp: number) {

        while (this.free > 0 && !this.facilityQueue.empty()) {
            const ro = this.facilityQueue.shift(timestamp);

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

            const newro = new Request(this, timestamp, timestamp + ro.duration);

            newro.done(() => this.useFCFSCallback(ro));

            ro.toEntity.queue.insert(newro);
        }
    }

    useFCFSCallback(ro: Request) {
        // We have one more free server
        this.free++;
        this.serverStatus[ro.data] = true;

        this.stats.leave(ro.scheduledAt, ro.toEntity.time());

        // if there is someone waiting, schedule it now
        this.useFCFSSchedule(ro.toEntity.time());

        // restore the deliver function, and deliver
        ro.deliver();

    }

    useLCFS(duration: number, ro: Request) {

        // if there was a running request..
        if (this.currentRO) {
            this.busyDuration += (this.currentRO.toEntity.time() - this.currentRO.lastIssued);
            // calcuate the remaining time
            this.currentRO.remaining = (
                this.currentRO.deliverAt - this.currentRO.toEntity.time());
            // preempt it..
            this.facilityQueue.push(this.currentRO, ro.toEntity.time());
        }

        this.currentRO = ro;
        // If this is the first time..
        if (!ro.saved_deliver) {
            ro.cancelRenegeClauses();
            ro.remaining = duration;

            ro.saved_deliver = ro.toEntity
            ro.toEntity = this

            this.stats.enter(ro.toEntity.time());
        }

        ro.lastIssued = ro.toEntity.time();

        // schedule this new event
        ro.deliverAt = ro.toEntity.time() + duration;
        Sim.queue.insert(ro);
    }

    useLCFSCallback(ro: Request) {
        const facility = this.source;

        //  sanity checks - should be OUR current RO
        if (this.currentRO == null) {
            console.error('strange')
            return
        } else {
            if (ro.id !== this.currentRO.id) {
                console.error('strange')
                return;
            }

            if (this.currentRO.toEntity.id == this.currentRO.saved_deliver.id) {
                console.error('strange, we store the ORIGINAL toEntity in save_deliver so we can send a message to ourselves')
                return;
            }

            // stats
            this.busyDuration += (this.currentRO.toEntity.time() - this.lastIssued);
            this.stats.leave(this.currentRO.scheduledAt, this.time());

            // deliver this request
            this.currentRO.toEntity = this.currentRO.saved_deliver;
            // delete this.saved_deliver;
            this.currentRO.deliver();
            this.currentRO = null;
        }

        // see if there are pending requests
        if (!this.facilityQueue.empty()) {
            const newRO = this.facilityQueue.pop(this.time());

            this.useLCFS(newRO.remaining, newRO);
        }
    }

    useProcessorSharing(duration: number, ro: Request) {
        ro.duration = duration;
        ro.cancelRenegeClauses();
        this.stats.enter(ro.toEntity.time());
        this.useProcessorSharingSchedule(ro, true);
    }

    useProcessorSharingSchedule(ro: Request, isAdded: Boolean) {
        const current = ro.toEntity.time();

        const size = this.facilityQueue.size()

        const multiplier = isAdded ? ((size + 1.0) / size) : ((size - 1.0) / size);

        const newQueue = [];

        if (this.facilityQueue.size() == 0) {
            this.lastIssued = current;
        }

        // for (let i = 0; i < size; i++) {

        //     const ev = this.queue[i];

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

        // this.queue = newQueue;

        // // usage statistics
        // if (this.queue.length === 0) {
        //     this.busyDuration += (current - this.lastIssued);
        // }
    }

    useProcessorSharingCallback() {
        const fac = this.source;

        //  sanity checks - should be OUR current RO
        if (this.currentRO == null) {
            console.error('strange')
            return
        } else {
            if (this.currentRO.cancelled) return;
            this.stats.leave(this.currentRO.scheduledAt, this.currentRO.toEntity.time());

            this.useProcessorSharingSchedule(this.currentRO, false);
            this.currentRO.deliver();
        }
    }
}


export class Buffer extends Sim {
    capacity: number
    available: number
    putQueue: Queue
    getQueue: Queue

    constructor(name: string, capacity: number, initial: number) {
        super(name);

        this.capacity = capacity;
        this.available = (typeof initial === 'undefined') ? 0 : initial;
        this.putQueue = new Queue(name + ' Buffer PutQueue');
        this.getQueue = new Queue(name + ' Buffer GetQueue');
    }

    current() {
        return this.available;
    }

    size() {
        return this.capacity;
    }

    get(amount: number, ro: Request) {

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
        this.getQueue.push(ro, ro.toEntity.time());
    }

    put(amount: number, ro: Request) {

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
        this.putQueue.push(ro, ro.toEntity.time());
    }

    progressGetQueue() {
        let obj;

        while (obj = this.getQueue.top()) {  // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.getQueue.shift(obj.toEntity.time());
                continue;
            }

            // see if this request can be satisfied
            if (obj.amount <= this.available) {
                // remove it..
                this.getQueue.shift(obj.toEntity.time());
                this.available -= obj.amount;
                obj.deliverAt = obj.toEntity.time();
                obj.toEntity.queue.insert(obj);
            } else {
                // this request cannot be satisfied
                break;
            }
        }
    }

    progressPutQueue() {
        let obj;

        while (obj = this.putQueue.top()) {  // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.putQueue.shift(obj.toEntity.time());
                continue;
            }

            // see if this request can be satisfied
            if (obj.amount + this.available <= this.capacity) {
                // remove it..
                this.putQueue.shift(obj.toEntity.time());
                this.available += obj.amount;
                obj.deliverAt = obj.toEntity.time();
                obj.toEntity.queue.insert(obj);
            } else {
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
    capacity: number
    available: number
    objects: Function[] = [];
    putQueue: Queue
    getQueue: Queue

    constructor(name: string, capacity: number) {
        super(name + ' Store');

        this.capacity = capacity;
        this.available = capacity;
        this.objects = [];
        this.putQueue = new Queue(name + ' Store PutQueue');
        this.getQueue = new Queue(name + ' Store GetQueue');
    }

    current() {
        return this.objects.length;
    }

    size() {
        return this.capacity;
    }

    get(filter: Function, ro: Request) {

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
            } else {
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
        this.getQueue.push(ro, ro.toEntity.time());
    }

    put(obj: Function, ro: Request) {

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
        this.putQueue.push(ro, ro.toEntity.time());
    }

    progressGetQueue() {
        let ro;

        while (ro = this.getQueue.top()) {  // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.getQueue.shift(ro.toEntity.time());
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
                        if (filter(obj)) {  // eslint-disable-line max-depth
                            found = true;
                            this.objects.splice(i, 1);
                            break;
                        }
                    }
                } else {
                    obj = this.objects.shift();
                    found = true;
                }

                if (found) {
                    // remove it..
                    this.getQueue.shift(ro.toEntity.time());
                    this.available--;

                    ro.message = obj;
                    ro.deliverAt = ro.toEntity.time();
                    ro.toEntity.queue.insert(ro);
                } else {
                    break;
                }

            } else {
                // this request cannot be satisfied
                break;
            }
        }
    }

    progressPutQueue() {
        let ro: Request

        while (ro = this.putQueue.top()) {  // eslint-disable-line no-cond-assign
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.putQueue.shift(ro.toEntity.time());
                continue;
            }

            // see if this request can be satisfied
            if (this.current() < this.capacity) {
                // remove it..
                this.putQueue.shift(ro.toEntity.time());
                this.available++;
                this.objects.push(ro.obj);
                ro.deliverAt = ro.toEntity.time();
                ro.toEntity.queue.insert(ro);
            } else {
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

export class Event extends Sim {
    waitList: Request[] = []
    eventQueue: Request[] = [];
    isFired = false;


    constructor(name: string) {
        super(name);
    }

    addWaitList(ro: Request) {
        if (this.isFired) {
            ro.deliverAt = ro.toEntity.time();
            Sim.queue.insert(ro);
            return;
        }
        this.waitList.push(ro);
    }

    /** add a request to the queue of this event.  If this event is 'fired'
     * then also queue it to the entity in the request.
     */
    addQueue(ro: Request) {
        if (this.isFired) {
            ro.deliverAt = ro.toEntity.time();
            Sim.queue.insert(ro);
            return;
        }
        this.eventQueue.push(ro);
    }

    /** Fire the event */
    fire(keepFired: Boolean) {

        if (keepFired) {
            this.isFired = true;
        }

        // Dispatch all waiting entities
        const tmpList = this.waitList;

        this.waitList = [];
        for (let i = 0; i < tmpList.length; i++) {
            tmpList[i].deliver();
        }

        // Dispatch one queued entity
        const lucky = this.eventQueue.shift();
        if (lucky) {
            lucky.deliver();
        }
    }

    // TODO:  is fired:Boolean sufficient to describe the state of an event?
    /** If this event was fired with 'keepFired', then clear it. */
    clear() {
        this.isFired = false;
    }
}

/** Entities are the actors in the simulation. */
export class Entity extends Sim {

    constructor(name: string) {
        super(name);
    }

    // /** dummy start() - every entity must override this method */
    // start() {
    //     throw new Error(`Entity class $ {this.name} must define a start() method.`);
    // }

    /** dummy onMessage() - if entity doesn't provide this method then simulation shouldn't send a message */
    onMessage(sender: Entity, message: any) {
        throw new Error(`Entity class $ {this.name} received a message from ${sender.name}, but has no onMessage() method.`);
    }


    time(): number {
        return this.simTime;
    }

    setTimer(duration: number): Request {
        Debug.debug(3, `SetTimer(): Creating a new Request '${this.name}'`)

        const ro = new Request(
            this,
            this.time(),
            this.time() + duration,);

        Sim.queue.insert(ro);
        return ro;
    }

    waitEvent(event: Event): Request {
        const ro = new Request(this, this.time(), 0);

        event.addWaitList(ro);
        return ro;
    }

    queueEvent(event: Event): Request {
        const ro = new Request(this, this.time(), 0);

        event.addQueue(ro);
        return ro;
    }

    useFacility(facility: Facility, duration: number): Request {
        const ro = new Request(facility, this.time(), 0);
        ro.duration = duration
        return ro;
    }

    // putBuffer(buffer, amount) {
    //     argCheck(callbackArguments, 2, 2, Buffer);

    //     const ro = new Request(this, this.time(), 0);

    //     ro.source = buffer;
    //     buffer.put(amount, ro);
    //     return ro;
    // }

    // getBuffer(buffer, amount) {
    //     argCheck(callbackArguments, 2, 2, Buffer);

    //     const ro = new Request(this, this.time(), 0);

    //     ro.source = buffer;
    //     buffer.get(amount, ro);
    //     return ro;
    // }

    // putStore(store, obj) {
    //     argCheck(callbackArguments, 2, 2, Store);

    //     const ro = new Request(this, this.time(), 0);

    //     ro.source = store;
    //     store.put(obj, ro);
    //     return ro;
    // }

    // getStore(store: Store, filter: Function) {

    //     const ro = new Request(this, this.time(), 0);

    //     ro.source = store;
    //     store.get(filter, ro);
    //     return ro;
    // }

    /** Messages are objects that entities can send to each other. The messages
    * can be any JavaScript type \-- numbers, string, functions, arrays, objects etc.
    * As an example, consider a ping-pong game played by two players where
    * they send a string back and forth to each other. Before resending the
    * string, each player appends his/her name to the string. We will model
    * the two players as entities and the string as a message.
    *
    * ``` {.js }
    * class Player extends Sim.Entity {
    *     start() {
    *         if (this.firstServer) {
    *             // Send the string to other player with delay = 0.
    * this.send("INITIAL", 0, this.opponent);
    *         }
    *     },
    *     onMessage(sender, message) {
    *         // Receive message, add own name and send back
    *         var newMessage = message + this.name;
    * this.send(newMessage, HOLDTIME, sender);
    *     }
    * };
    *
    * var sim = new Sim.Sim();
    * var jack = sim.addEntity(Player);
    * var jill = sim.addEntity(Player);
    *
    * jack.name = "Jack";
    * jill.name = "Jill";
    *
    * jack.firstServer = true;
    * jack.opponent = jill;
    *
    * sim.simulate(SIMTIME);
```
    */
    send(message: any, delay: number, toEntity: Entity) {

        const ro = new Request(toEntity, this.time(), this.time() + delay);

        // ro.source = this;   // the entity who SENT the message
        // ro.deliver = this.sendMessage;

        Sim.queue.insert(ro);
    }

}

