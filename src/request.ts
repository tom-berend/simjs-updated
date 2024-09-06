import {Model, Entity, Facility} from './sim.js'
import {PQueue} from './queue.js'


/* When an entity makes a request to the simulation -- such as
 * set a timer, use a facility, etc -- the simulator returns backs
 * a Request object. The entity can use this Request object to
 * further modify the original request.
 *
 * The Request object is returned when an entity makes any of the following requests:
 *
 * setTimer()      set a timer
 * useFacility()   use a facility
 * putBuffer()     put tokens in a buffer
 * getBuffer()     get tokens from buffer
 * putStore()      store objects in a store
 * getStore()      retrieve object from a store
 * waitEvent()     wait on an event
 * queueEvent()    queue on an event
 *
 * The Request object can then be used to modify the request in the following ways:
 *
 * done()         Assign functions that must be called when the request is satisfied.
 * waitUntil()    Set a timeout value to the request. If the request is not satisfied within the timeout value,
 *                      it will be terminated and the entity will be notified.
 * unlessEvent()  Put the request in the wait queue of one or more Events. If any one of those events is fired,
 *                      the request will be terminated and the entity will be notified.
 * setData():     Assign some user data for this request, which will be returned back when the simulator notifies
 *                      the entity about the request.
 * cancel():      Cancel the request.
 */



export class Request extends Model  {
    timeStamp: number  // this used to be in queueElement,for FIFO, LIFO, Priority
                       // moved here to simplify heap.  The queue has a comparator,
                       // for FIFO, use time()
                       // for LIFO, use 0-time()
                       // for PRIORITY, use priority    etc

    toEntity: Entity | Facility
    data: any   // a freeform datastore in this Request
    source: Object   // shouldn't be necessary, callback knows
    scheduledAt: number
    deliverAt: number
    callbacks: ((ro: Request) => void)[]
    cancelled: Boolean
    group: Request[]
    noRenege = true

    duration = 0    // referenced by useFCFS, never used
    order = 0       // referenced by PQueue, never used
    amount = 0      // referenced by buffer, never used

    filter: Function  // referenced by store, never used
    obj: Function     // referenced by store

    lastIssued: number = 0 // referenced by facility
    remaining: number = 0 // referenced by facility
    saved_deliver: Entity | Facility // referenced by facility



    constructor(toEntity: Entity | Facility, currentTime: number, deliverAt: number, source: Object = {}) {
        super ('request')

        this.toEntity = toEntity;
        this.scheduledAt = currentTime;
        this.deliverAt = deliverAt;
        this.callbacks = [];
        this.cancelled = false;
        this.group = [];
        this.source = source

        this.filter = () => true
        this.obj = () => true
        this.saved_deliver = toEntity

        Model.debug(3, `Create Request to ${toEntity.name} at ${currentTime}, deliverAt ${deliverAt}`)

    }

    /** cancel this Request, unless it is the main Request or noRenege */
    cancel(): Request | null {
        // Ask the main request to handle cancellation
        if (this.group && this.group[0] !== this) {
            return this.group[0].cancel();
        }

        // --> this is main request
        if (this.noRenege) return this;

        // if already cancelled, do nothing
        if (this.cancelled) return null;

        // set flag
        this.cancelled = true;

        if (this.deliverAt === 0) {
            this.deliverAt = this.toEntity.time();
        }

        if (this.source) {
            if ((this.source instanceof Buffer)
                || (this.source instanceof Store)) {
                this.source.progressPutQueue();
                this.source.progressGetQueue();
            }
        }

        if (!this.group) {
            return null;
        }
        for (let i = 1; i < this.group.length; i++) {

            this.group[i].cancelled = true;
            if (this.group[i].deliverAt === 0) {
                this.group[i].deliverAt = this.toEntity.time();
            }
        }
        return null
    }

    /** Assign functions that must be called when the request is satisfied. */
    done(callback: (ro: Request) => void): Request {

        this.callbacks.push(callback);
        return this;
    }

    /**  Set a timeout value to the request. If the request is not satisfied within
     * the timeout value, it will be terminated and the entity will be notified. */
    waitUntil(delay: number, callback: (ro: Request) => void, callbackContext: any = {}, callbackArgument: any = ''): Request {
        if (this.noRenege) return this;

        const ro = this._addRequest(
            this.scheduledAt + delay, callback);

        Model.queue.insert(ro);
        return this;
    }

    /** Put the request in the wait queue of one or more events. If any one
     * of those events is fired, the request will be terminated and the entity
     * will be notified. */
    unlessEvent(event: Event | Event[], callback: (ro: Request) => void, callbackContext: any = {}, callbackArgument: any = ''): Request {
        if (this.noRenege) return this;

        if (event instanceof Event) {
            const ro = this._addRequest(0, callback);

            ro.data = event;
            event.addWaitList(ro);

        } else if (event instanceof Array) {
            for (let i = 0; i < event.length; i++) {

                const ro = this._addRequest(0, callback);

                ro.data = event[i];
                event[i].addWaitList(ro);
            }
        }
        return this;
    }

    /** Assign some user data for this request, which can be returned back anytime */
    setData(data: any): Request {
        this.data = data;
        return this;
    }


    deliver() {
        console.log('%cin deliver()','color:blue',this)
        if (this.cancelled) return;
        this.cancel();
        if (!this.callbacks) return;

        // may have a group of Requests
        // if (this.group && this.group.length > 0) {
        //     this._doCallback(this.group[0].source,
        //         this.message,
        //         this.group[0].message);   // was .data ??
        // } else {

        this.callbacks.map((callbackfn: (ro: Request) => void) => { callbackfn(this) })

        // this._doCallback(this.source,
        //     this.message,
        //     this.message);   // was this.data, how different from message?
        // }

    }

    cancelRenegeClauses() {
        // this.cancel = this.Null;
        // this.waitUntil = this.Null;
        // this.unlessEvent = this.Null;
        this.noRenege = true;

        if (!this.group || this.group[0] !== this) {
            return;
        }

        for (let i = 1; i < this.group.length; i++) {

            this.group[i].cancelled = true;
            if (this.group[i].deliverAt === 0) {
                this.group[i].deliverAt = this.toEntity.time();
            }
        }
    }

    Null() {
        return this;
    }

    _addRequest(deliverAt: number, callback: (ro: Request) => void, callbackContext: any = {}, callbackArgument: any = '') {
        const ro = new Request(
            this.toEntity,
            this.scheduledAt,
            deliverAt);

        ro.callbacks.push(callback);

        if (this.group === null) {
            this.group = [this];
        }

        this.group.push(ro);
        ro.group = this.group;
        return ro;
    }

    // _doCallback(source, msg, data) {
    //     for (let i = 0; i < this.callbacks.length; i++) {

    //         const callback = this.callbacks[i][0];

    //         if (!callback) continue;

    //         let callbackContext = this.callbacks[i][1];

    //         if (!callbackContext) callbackContext = this.toEntity;

    //         const callbackArgument = this.callbacks[i][2];

    //         callbackContext.callbackSource = source;
    //         callbackContext.callbackMessage = msg;
    //         callbackContext.callbackData = data;

    //         if (!callbackArgument) {
    //             callback.call(callbackContext);
    //         } else if (callbackArgument instanceof Array) {
    //             callback.apply(callbackContext, callbackArgument);
    //         } else {
    //             callback.call(callbackContext, callbackArgument);
    //         }

    //         callbackContext.callbackSource = null;
    //         callbackContext.callbackMessage = null;
    //         callbackContext.callbackData = null;
    //     }
    // }
}
