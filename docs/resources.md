Resources: Facilities, Buffers and Stores
=========================================

Facility {#resources-facility}
--------

*Facility* is a resource that is used by entities for a finite duration.
There is a limit on the number of entities that can use the facility at
a given time. As an example, consider a barbershop (the facility) with
*m* barbers (capacity of facility). The customers arrive at shop and
wish to \'use\' the resource (barber); if all barbers are busy, the
customers wait until one barber is available.

The timeline of interactions between entities and facility is as
follows:

1.  An entity requests the simulator to use a facility for *duration*
    time (with `useFacility`{.interpreted-text role="func"}
    `Extended Entity Prototype` API).

2.  If the facility is busy, the entity is placed in facility\'s queue.
    It waits there until other entities in front of it are done using
    the facility (also see the *Scheduling Disciplines* below).

3.  

    If the facility is free or when the entity is done waiting in the queue, the entity is given access to the facility. This is modeled as:

    :   -   The facility is marked as busy.
        -   The simulator starts a timer for *duration* interval.

4.  At the expiration of the timer, the entity is notified that it has
    just finished using the facility.

::: {.note}
::: {.title}
Note
:::

The entity is notified only at the completion of the request (step 4
above).

It is not notified, for example, when it done waiting in the queue or
when it is preempted (if supported by queuing discipline).
:::

::: {.note}
::: {.title}
Note
:::

The `useFacility`{.interpreted-text role="func"} request can only be
cancelled or reneged while the entity is waiting in queue.

If the entity has started using the facility (step 3 above), the entity
cannot be removed from the queue. That is,
`Sim.Request.cancel`{.interpreted-text role="func"},
`Sim.Request.waitUntil`{.interpreted-text role="func"} and
`Sim.Request.unlessEvent`{.interpreted-text role="func"} will have no
effect after the entity has started using facility.
:::

**Scheduling Disciplines**

Scheduling Discipline is the policy on how the entities wait in the
queue and use the facility. Some disciplines are:

*First Come First Server (FCFS)*

:   This is the most common scheduling discipline. Entities queue up in
    priority of their arrival times. Only when an entity is done using
    the facility, the next earliest entity is scheduled.

*Last Come First Served (LCFS)*

:   The last entity arriving at facility will preempt any current
    entity. When this entity is finished, the earlier entities will
    resume.

*Processor Sharing (PS)*

:   There is no queue in the system. All entities simultaneously use the
    facility, however their usage duration increases proportionally to
    the number of active entities.

*Round Robin (RR)* (not supported)

:   All entities take turn to use the facility for some time quanta
    duration each.

In the version only FCFS, LCFS and Processor Sharing scheduling
disciplines are supported. The other disciplines are planned for future
releases.

Entities access the buffers through their `Entity Prototype` API:

-   `useFacility(facility, duration)`{.interpreted-text role="attr"}.
    Request to use the *facility* for *duration* time. This returns a
    `Request <request-main>`{.interpreted-text role="ref"} object.

### API Reference

### Example: M/M/c Queue

**The M/M/c problem**: There are *c* servers (e.g. bank tellers) whose
services are requested by customers. There is only one queue in front of
all servers, so a customer at the head of the queue will move if any one
of the *c* servers is free. The customers arrival is Poisson process,
and service time is exponentially distributed. Such kind of queuing
systems and servers can be easily modeled with FCFS facilities.

We create a facility as:

``` {.js}
var server = new Sim.Facility('Server', Sim.Facility.FCFS, nServers);
```

The customers arrive at intervals that is exponentially distributed with
mean *lambda*, and they request service for exponentially distributed
duration with mean *mu*. We model the customer as:

``` {.js}
var rand = new Sim.Random(SEED);

class Customer extends Sim.Entity {
    start() {
        // the next customer will arrive at:
        var nextCustomerInterval = rand.exponential(lamda);

        // wait for nextCustomerInterval
        this.setTimer(nextCustomerInterval).done(() => {
            // customer has arrived.
            var useDuration = rand.exponential(mu); // time to use the server
            this.useFacility(server, useDuration);

            // repeat for the next customer
            this.start();
        });
    }
}
```

Finally we create the simulation and entity objects, and start the
simulation.

``` {.js}
var sim = new Sim.Sim("M/M/c");  // create simulator
sim.addEntity(Customer);         // add entity
sim.simulate(SIMTIME);           // start simulation
server.report();                 // statistics
```

### Example: Processor Sharing {#resource-processor-sharing}

In the processor sharing service disciplines, all requesting entities
get immediate access to the resource, however, their service time
increases proportionally to the number of other entities already in the
system.

As an example, consider CPU modeled as facility with Processor Sharing
discipline. A single request to use CPU for 1 second will complete in 1
second. Two simultaneous requests to use CPU for 1 second each will
finish in 2 seconds each (since the CPU is \"shared\" between the two
requests).

Another example would be network connection link (e.g. Ethernet) with a
given data rate. Entities request to use the resource, which in this
case means sending data. If multiple overlapping requests are made then
the network link is \"shared\" between all requests. Say, request one is
initiated at time 0 to send data for 10 seconds. A second request is
also made at time 5 seconds to send data for 1 second. In this case, the
first request will finish at 11 seconds (0 - 5 sec at full capacity, 5 -
7 seconds at half capacity, and 7 - 11 sec at full capacity again),
while the second request will finish at 7 seconds . We validate this as
follows:

``` {.js}
// create the facility
var network = new Sim.Facility("Network Cable", Sim.Facility.PS);

class Entity extends Sim.Entity {
    start() {
        // make request at time 0, to use network for 10 sec
        this.useFacility(network, 10).done(() => {
            assert(this.time(), 11);
        });

        // make request at time 5, to use the network for 1 sec
        this.setTimer(5).done(() => {
            this.useFacility(network, 1).done(() => {
                assert(this.time(), 7);
            });
        });
    }
};

var sim = new Sim.Sim();
sim.addEntity(Entity);
sim.simulate(100);
```

Buffer {#resources-buffer}
------

*Buffer* is a resource that can store a finite number of tokens. Any
entity can store tokens in the buffer if there is free space, or
retrieve existing tokens from the buffer if some are available. Queueing
happens when:

-   an entity wishes to store tokens, but the buffer does not have
    sufficient free space to store them. The entity will be queued until
    some other entity (or entities) remove tokens from the buffer to
    create enough free space.
-   an entity wishes to retrieve tokens, but the buffer does not have
    sufficient number of available tokens. The entity will be queued
    until some other entity (or entities) put enough number of tokens
    into the buffer.

::: {.note}
::: {.title}
Note
:::

Buffer vs. Store

Buffers are resources that store \"homogeneous\" quantities. The buffers
do not actually store any object, rather they keep a counter for the
current usage, which is increment by *putBuffer* operation and
decremented after *getBuffer* operation. If you wish to store real
objects, consider using `resources-store`{.interpreted-text role="ref"}.
:::

*Buffers* support two basic operations:
`~Sim.Buffer.put`{.interpreted-text role="func"} to store tokens in the
buffer, and `~Sim.Buffer.get`{.interpreted-text role="func"} to retrieve
tokens from the buffers. The *Buffer* object has two queues: *putQueue*
where the entities wait if their `~!Sim.Buffer.put`{.interpreted-text
role="func"} request cannot be immediately satisfied, and *getQueue*
where the entities wait if their `~!Sim.Buffer.get`{.interpreted-text
role="func"} request cannot be immediately satisfied.

Entities access the buffers through their `Entity Prototype` API:

-   `putBuffer(buffer, amount)`{.interpreted-text role="attr"}. Attempt
    to store *amount* number of the tokens in *buffer*. This returns a
    `Request <request-main>`{.interpreted-text role="ref"} object.
-   `getBuffer(buffer, amount)`{.interpreted-text role="attr"}. Attempt
    to retrieve *amount* number of the tokens from *buffer*. This
    returns a `Request <request-main>`{.interpreted-text role="ref"}
    object.

### API Reference

The `~!Sim.Buffer`{.interpreted-text role="class"} class does not
directly provide any *put()* or *get()* API. Instead, entities must use
their `Entity Prototype` functions (`putBuffer`{.interpreted-text
role="func"} and `getBuffer`{.interpreted-text role="func"}) to access
buffers.

### Example: Producers-Consumers

**The Producer-Consumer Problem**: There are *nProducers* number of
producer entities that produce tokens at rate of *productionRate* and
stores them in a common buffer of *bufferSize* capacity. The producers
must successfully store their produced items in buffer before they can
begin on production of the next item. There are also *nConsumers* number
of consumer entities that retrieve tokens from the same buffer and
process them at rate of *consumerRate*.

We would like to study what is the average wait times for the producers
and the consumers, given different values of the various parameters
(such as *bufferSize*, *productionRate* etc).

We create the common buffer as:

``` {.js}
var buffer = new Sim.Buffer("buffer", bufferSize);
```

We model the producers as entities that generate one token every *t*
seconds, where *t* is exponential random number will mean
*productionRate*.

``` {.js}
Random rand = new Random(SEED);

class Producer extends Sim.Entity {
    start() {
        var timeToProduce = rand.exponential(1.0 / productionRate);

        // Set timer to self (models the time spend in production)
        this.setTimer(timeToProduce).done(() => {
            // Timer expires => item is ready to be stored in buffer.
            // When the item is successfully stored in buffer, we repeat
            //     the process by recursively calling the same function.
            this.putBuffer(buffer, 1).done(this.start);
        });
    }
}
```

We model the consumers as entities that retrieve tokens from the
buffers, and process them for *t* seconds, where *t* is exponential
random number will mean *consumptionRate*.

``` {.js}
class Consumer extends Sim.Entity {
    start() {
        // Retrieve one token from buffer
        this.getBuffer(buffer, 1).done(() => {
            // After an item has been retrieved, wait for some time
            //   to model the consumption time.
            // After the waiting period is over, we repeat by
            //   recursively calling this same function.
            var timeToConsume = rand.exponential(1.0 / consumptionRate);

            this.setTimer(timeToConsume).done(this.start);
        });
    }
}
```

Finally we create the simulation and entity objects, and start the
simulation.

``` {.js}
// Create simulator
var sim = new Sim.Sim();

// Create producer entities
for (var i = 0; i < nProducers; i++) sim.addEntity(Producer);

// Create consumer entities
for (var i = 0; i < nConsumers; i++) sim.addEntity(Consumer);

// Start simulation
sim.simulate(SIMTIME);

// statistics
buffer.report();
```

Store {#resources-store}
-----

*Store* is a resource that can store a finite number of JavaScript
objects (actually any datatype: number, string, function, array, object
etc). Any entity can store objects in the store if there is free space,
or retrieve existing objects from the store if some are available.
Queueing happens when:

-   an entity wishes to store objects, but the store does not have
    sufficient free space to store them. The entity will be queued until
    some other entity (or entities) remove objects from the store to
    create enough free space.
-   an entity wishes to retrieve objects, but the store does not have
    sufficient number of available object. The entity will be queued
    until some other entity (or entities) put enough number of objects
    into the buffer.

::: {.note}
::: {.title}
Note
:::

Store vs. Buffer

Stores are resources that store distinct JavaScript objects. If you do
not wish to store actual objects, consider using
`resources-buffer`{.interpreted-text role="ref"}.
:::

*Stores* support two basic operations:
`~Sim.Store.put`{.interpreted-text role="func"} to store objects in the
store, and `~Sim.Store.get`{.interpreted-text role="func"} to retrieve
objects from the stores. The *Store* object has two queues: *putQueue*
where the entities wait if their `~!Sim.Store.put`{.interpreted-text
role="func"} request cannot be immediately satisfied, and *getQueue*
where the entities wait if their `~!Sim.Store.get`{.interpreted-text
role="func"} request cannot be immediately satisfied.

Entities can retrieve objects from stores in two ways:

-   Retrieve objects from store in FIFO order.
-   Supply a \"filter\" function and retrieve object that matches the
    filter.

Entities access the stores through their `Entity Prototype` API:

-   `putStore(store, object)`{.interpreted-text role="attr"}. Attempt to
    store *object* in *store*. This returns a
    `Request <request-main>`{.interpreted-text role="ref"} object.
-   `getStore(store[, filter])`{.interpreted-text role="attr"}. Attempt
    to retrieve object from *buffer*. If the filter function is supplied
    then the first object (in FIFO order) that matches the filter is
    retrieved; otherwise the first object in FIFO order is retrieved.
    This returns a `Request <request-main>`{.interpreted-text
    role="ref"} object.

The retrieved object can be accessed via the
`this.callbackMessage`{.interpreted-text role="attr"} attribute in the
callback function (see example below).

### API Reference

The `~!Sim.Store`{.interpreted-text role="class"} class does not
directly provide any *put()* or *get()* API. Instead, entities must use
their `Entity Prototype` functions (`putStore`{.interpreted-text
role="func"} and `getStore`{.interpreted-text role="func"}) to access
stores.

### Example

``` {.js}
// Create a store
var store = new Sim.Store("Example Store", 10);

class Entity extends Sim.Entity {
    start() {
        // Put an object
        this.putStore(store, {myfield: "myvalue"});

        // Put another object
        this.putStore(store, {myfield: "othervalue"});

        // arrays, numbers, strings etc can also be stored
        this.putStore(store, "stored string");

        // Retrieve object from store.
        // Note 1: If filter function is not supplied, objects are returned in FIFO order
        // Note 2: The object can be accessed via this.callbackMessage
        this.getStore(store).done(() => {
            assert(this.callbackMessage.myfield === "myvalue");
        });

        // Retrieve object from store using filter function
        this.getStore(store, (obj) => obj === 'stored string')
            .done(() => assert(this.callbackMessage === "stored string"));
    }
}
```
