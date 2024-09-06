import { Store, Buffer, Event, Debug } from './sim.js';
/** When an entity makes a request to the simulation -- such as
 * set a timer, use a facility, etc -- the simulator returns backs
 * a Request object. The entity can use this Request object to
 * further modify the original request. */
export class Request {
    id;
    toEntity;
    data; // a freeform datastore in this Request
    source; // shouldn't be necessary, callback knows
    scheduledAt;
    deliverAt;
    callbacks;
    cancelled;
    group;
    noRenege = true;
    duration = 0; // referenced by useFCFS, never used
    order = 0; // referenced by PQueue, never used
    amount = 0; // referenced by buffer, never used
    filter; // referenced by store, never used
    obj; // referenced by store
    lastIssued = 0; // referenced by facility
    remaining = 0; // referenced by facility
    saved_deliver; // referenced by facility
    constructor(toEntity, currentTime, deliverAt, source = {}) {
        this.id = Symbol();
        this.toEntity = toEntity;
        this.scheduledAt = currentTime;
        this.deliverAt = deliverAt;
        this.callbacks = [];
        this.cancelled = false;
        this.group = [];
        this.source = source;
        this.filter = () => true;
        this.obj = () => true;
        this.saved_deliver = toEntity;
        Debug.debug(3, `Create Request to ${toEntity.name} at ${currentTime}, deliverAt ${deliverAt}`);
    }
    /** cancel this Request, unless it is the main Request or noRenege */
    cancel() {
        // Ask the main request to handle cancellation
        if (this.group && this.group[0] !== this) {
            return this.group[0].cancel();
        }
        // --> this is main request
        if (this.noRenege)
            return this;
        // if already cancelled, do nothing
        if (this.cancelled)
            return null;
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
        return null;
    }
    /** Assign functions that must be called when the request is satisfied. */
    done(callback) {
        this.callbacks.push(callback);
        return this;
    }
    /**  Set a timeout value to the request. If the request is not satisfied within
     * the timeout value, it will be terminated and the entity will be notified. */
    waitUntil(delay, callback, callbackContext = {}, callbackArgument = '') {
        if (this.noRenege)
            return this;
        const ro = this._addRequest(this.scheduledAt + delay, callback);
        this.toEntity.queue.insert(ro);
        return this;
    }
    /** Put the request in the wait queue of one or more events. If any one
     * of those events is fired, the request will be terminated and the entity
     * will be notified. */
    unlessEvent(event, callback, callbackContext = {}, callbackArgument = '') {
        if (this.noRenege)
            return this;
        if (event instanceof Event) {
            const ro = this._addRequest(0, callback);
            ro.message = event;
            event.addWaitList(ro);
        }
        else if (event instanceof Array) {
            for (let i = 0; i < event.length; i++) {
                const ro = this._addRequest(0, callback);
                ro.message = event[i];
                event[i].addWaitList(ro);
            }
        }
        return this;
    }
    /** Assign some user data for this request, which can be returned back anytime */
    setData(data) {
        this.data = data;
        return this;
    }
    deliver() {
        if (this.cancelled)
            return;
        this.cancel();
        if (!this.callbacks)
            return;
        // may have a group of Requests
        // if (this.group && this.group.length > 0) {
        //     this._doCallback(this.group[0].source,
        //         this.message,
        //         this.group[0].message);   // was .data ??
        // } else {
        this.callbacks.map((callbackfn) => { callbackfn(this); });
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
    _addRequest(deliverAt, callback, callbackContext = {}, callbackArgument = '') {
        const ro = new Request(this.toEntity, this.scheduledAt, deliverAt);
        ro.callbacks.push(callback);
        if (this.group === null) {
            this.group = [this];
        }
        this.group.push(ro);
        ro.group = this.group;
        return ro;
    }
}
//# sourceMappingURL=request.js.map