// import { Model } from './model.js'
import { Entity, Facility } from './sim.js'


/* When an entity makes a request to the simulation -- such as
 * set a timer, use a facility, etc -- the simulator returns backs
 * a Request object. The entity can use this Request object to
 * further modify the original request.
 *
 * The Request object is returned when an entity makes any of the following requests (in Sim.TS):
 *
 * setTimer()      set a timer
 *  useFacility()   use a facility
 *  putBuffer()     put tokens in a buffer
 *  getBuffer()     get tokens from buffer
 *  putStore()      store objects in a store
 *  getStore()      retrieve object from a store
 *  waitEvent()     wait on an event
 *  queueEvent()    queue on an event
 *
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
 *
 *
 *
 * deliver():     Executes all the callbacks and cancels the request
 */



export class Request {
    timestamp: number  // this used to be in queueElement,for FIFO, LIFO, Priority
    // moved here to simplify heap.  The queue has a comparator,
    // for FIFO, use time()
    // for LIFO, use 0-time()
    // for PRIORITY, use priority    etc

    data: any   // a freeform datastore in this Request
    createdBy: Entity | Facility | null = null
    createdWith: string   // setTimer(), useFacility(), etc   how it was created
    source: Object   // shouldn't be necessary, callback knows
    createdAt: number
    scheduledAt: number
    deliverAt: number
    callbacks: Function[]
    cancelled: Boolean
    // group: Request[]    // groups arentn't used
    noRenege = true

    // stuff used by Facilities
    duration = 0
    discipline: 'FIFO' | 'LIFO' | 'SHARE'

    order = 0       // referenced by PQueue, never used
    amount = 0      // referenced by buffer, never used

    filter: Function  // referenced by store, never used
    obj: Function     // referenced by store

    lastIssued: number = 0 // referenced by facility
    remaining: number = 0 // referenced by facility
    saved_deliver: Entity | Facility | null // referenced by facility



    constructor(timestamp: number, createdWith: string) {

        this.scheduledAt = timestamp;
        this.deliverAt = timestamp;
        this.callbacks = [];
        this.cancelled = false;
        // this.group = [];
        this.createdWith = createdWith
        this.filter = () => true
        this.obj = () => true
        this.saved_deliver = null

        console.log(`Create Request by ${createdWith} scheduled for ${this.scheduledAt}`)

    }


    /* Note Special case with facilities.
    * In case of facilities with FIFO queuing discipline, the requesting entities go through two stages:
    * (1) wait for the facility to become free (this may be zero duration if the facility is already free),
    * (2) use the facility for specified duration.
    * The waitUntil(), unlessEvent() and cancel() functions are applicable in the first stage only.
    * In order words, if an entity has started using the facility, then it cannot be dislodged and these function calls will have no effect.
    *
    * In case of facilities with LIFO and Processor Sharing disciplines, the requesting entities
    * obtain an immediate access to the facility resource. Therefore, waitUntil(), unlessEvent()
    * and cancel() functions will have no effect for these facilities.
    * /

    /** cancel this Request, unless it is the main Request or noRenege. for  */
    cancel(): Request {

        // // Ask the main request to handle cancellation
        // if (this.group && this.group[0] !== this) {
        //     return this.group[0].cancel();
        // }

        // --> this is main request
        if (this.noRenege) return this;

        // if already cancelled, do nothing
        if (this.cancelled) return this;    //

        // set flag
        this.cancelled = true;

        if (this.deliverAt === 0) {
            this.deliverAt = this.toEntity.time();
        }

        // if (this.source) {
        //     if ((this.source instanceof Buffer)
        //         || (this.source instanceof Store)) {
        //         this.source.progressPutQueue();
        //         this.source.progressGetQueue();
        //     }
        // }

        // if (!this.group) {
        //     return null;
        // }
        // for (let i = 1; i < this.group.length; i++) {

        //     this.group[i].cancelled = true;
        //     if (this.group[i].deliverAt === 0) {
        //         this.group[i].deliverAt = this.toEntity.time();
        //     }
        // }
        return this
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
        console.log(`Delivering Request created with ${this.createdWith}`, this)

        if (this.cancelled){
            return this;
        }

        // may have a group of Requests
        // if (this.group && this.group.length > 0) {
        //     this._doCallback(this.group[0].source,
        //         this.message,
        //         this.group[0].message);   // was .data ??
        // } else {

        this.callbacks.map((callbackfn: Function) => { callbackfn(this) })

        this.cancel();
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


    // addRequest seems to be what creates groups.  It creates a new Request that
    // contains the old request in its group.
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





