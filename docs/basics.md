Introduction to SIM.JS {#introduction-simjs}
======================

Discrete Event Simulation
-------------------------

We could say a lot about Discrete Event Simulations in this document,
but sadly we don\'t have the resources. For a brief overview, we refer
you to the excellent article at
[Wikipedia](http://en.wikipedia.org/wiki/Discrete_event_simulation) and
the references therein as an entry point to this interesting field of
Computer Science.

Briefly speaking, Discrete Event Simulation (DES) is a technique to
*model* a complex system in order to study its behavior. The system is
modeled as a collection of *states* that change over time. Within DES,
the time advances in discrete steps.

A typical model of a system includes (a) *entities*, which are the
active actors in the system and encapsulate the state and logic of the
system components, (b) *resources*, which are entities consume, (c)
*communication* primitives, to coordinate actions between entities
across time, and of course, (d) *statistics*, which is the output of a
simulation run.

As we will see shortly, the SIM.JS library provides support for
entities, resources (Facility, Buffers and Stores), communication (via
Timers, Events and Messages) and statistics (with Data Series, Time
Series and Population statistics).

SIM.JS Design Principles {#basic-design}
------------------------

The most common design pattern that appears in DES models takes after
the following *process* block:

``` {.python}
1. entity::
2.  do_some_local_computation
3.  resource = request_some_shared_resource
4.  do_more_local_computation
```

Pretend that the shared resource is not available at the time step 3
starts processing, which means the process can\'t finish. In that case,
the simulation has to \"block\" from further execution.

Waiting for resources is only one of several reasons entities need to
wait or block. Other reasons include waiting for a timer to expire,
waiting to receive a message from other entities, waiting for a
predicate condition to become true, and so on.

There are two broad paradigns for implementing this \"blocking\"
behavior:

1.  Process-based simulation.
2.  Event-based simulation.

In process-based simulation, entities behave very much like regular
operating system processes. Each entity runs on a separate thread, and
when an entity executes a command for which it must wait/block, the
entire thread is suspended. When the waiting condition is satisfied, the
thread resumes processing. In the example given above, the entity thread
will block at line 3 until the resource is free, and then will resume to
line 4.

In event-based simulation, the entities all run in a single thread. When
a request is made to simulate something, the entities don\'t immediately
process the similation. Instead they provide a callback function that
must be invoked when the waiting condition is over. Graphical User
Interface programming uses this event-based design quite often, where
the system invokes callback functions when any interesting event occurs
(e.g. mouse click). However, this style also means we have to
restructure the code a little. For example, we\'d have to rewrite the
example above as follows:

``` {.python}
entity::
    do_some_local_computation
    request_some_shared_resource_with_callback(entity_get_resource)
    return

entity_get_resource (resource)::
    do_more_local_computation
```

The proponents of process-based programming claim that their design
leads to a better code readability. Whereas the adherents of event-based
programming argue their approach is more structured since the actions
for each different kind of events are encapsulated as different
functions.

SIM.JS library provides the *event-based* design mainly because
process-based programming is not *idiomatic* JavaScript. Practitioners
of JavaScript largely follow the event-based programming, and specially
so given the powerful features of JavaScript, such as first class
functions, closures, anonymous functions, function call chains and so
on.

The SIM.JS Library
------------------

The SIM.JS library introduces just one variables in the global
namespace: `Sim`. The `Sim` class provides all functionality for
Discrete Event Simulations, which include the following classes:

  -----------------------------------------------------------------------------------------------
  Class                                Purpose
  ------------------------------------ ----------------------------------------------------------
  `Sim.Sim`{.interpreted-text          The simulator kernel.
  role="class"}                        

  :class:\`Sim.Entity                  `entity-simulator`{.interpreted-text role="ref"} Is an
                                       actor in the simulation.

  `Sim.Facility`{.interpreted-text     `resources-facility`{.interpreted-text role="ref"} is a
  role="class"}                        resource entities use for a finite duration. There is a
                                       limit on the number of entities that can use the facility
                                       at a given time. As an example, consider a barbershop (the
                                       facility) with *m* barbers (capacity of facility). The
                                       customers arrive at shop and wish to \'use\' the resource
                                       (barber); if all barbers are busy, the customers wait
                                       until one barber is available.

  `Sim.Buffer`{.interpreted-text       `resources-buffer`{.interpreted-text role="ref"} is a
  role="class"}                        resource that stores a finite number of tokens. Any entity
                                       can put tokens in the buffer if there is free space, or
                                       get/retrieve tokens from the buffer if some are available.

  `Sim.Store`{.interpreted-text        `resources-store`{.interpreted-text role="ref"} is a
  role="class"}                        resource that stores a finite number of JavaScript objects
                                       (actually any datatype: number, string, function, array,
                                       object etc). Any entity can store objects in the store if
                                       there is free space, or retrieve existing objects from the
                                       store if some are available.

  `Sim.Event`{.interpreted-text        `events-events`{.interpreted-text role="ref"} are external
  role="class"}                        objects that start out in *passive* state, and at some
                                       point in time will be *activated* or *fired*. Entities
                                       \'attach\' themselves to events and wait until the event
                                       is fired.

  `Sim.Request`{.interpreted-text      When an entity makes a request to the simulation \-- such
  role="class"}                        as set a timer, use a facility, etc \-- the simulator
                                       returns a
                                       `Request object <request-main>`{.interpreted-text
                                       role="ref"}. The entity can use this Request object to
                                       further modify the original request.

  `Sim.DataSeries`{.interpreted-text   `Data Series <statistics-data-series>`{.interpreted-text
  role="class"}                        role="ref"} is a collection of discrete, time-independent
                                       observations, for example, grades of each student in a
                                       class, length of rivers in United States. The
                                       `~Sim.DataSeries`{.interpreted-text role="class"} class
                                       provides a convenient API for recording and analyzing such
                                       observations, such as finding maximum and minimum values,
                                       statistical properties like average and standard deviation
                                       and so on.

  `Sim.TimeSeries`{.interpreted-text   `Time Series <statistics-time-series>`{.interpreted-text
  role="class"}                        role="ref"} is a collection of discrete time-dependent
                                       observations. That is, each observation value is
                                       associated with a discrete time instance (the time at
                                       which the observation was made). For example, the size of
                                       queue at time *t* during the simulation run, number of
                                       customers in a restaurant at time *t* during evening
                                       hours.The `~Sim.TimeSeries`{.interpreted-text
                                       role="class"} class provides a convenient API for
                                       recording and analyzing such observations, such as finding
                                       maximum and minimum values, statistical properties like
                                       time-averaged mean and standard deviation and so on.

  `Sim.Population`{.interpreted-text   `Population <statistics-population>`{.interpreted-text
  role="class"}                        role="ref"} is actually a composite of the above two
                                       statistics, which models the behavior of population growth
                                       and decline.
  -----------------------------------------------------------------------------------------------

The `Sim.Random` library uses the Mersenne Twister algorithm for
generating random number stream, and is based on the JavaScript
implementation by Makoto Matsumoto and Takuji Nishimura
([code](www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/VERSIONS/JAVASCRIPT/java-script.html)).
The `Sim.Random` class supports following probability distribution
functions:

::: {.hlist columns="4"}
-   `~Random.exponential`{.interpreted-text role="func"}
-   `~Random.gamma`{.interpreted-text role="func"}
-   `~Random.normal`{.interpreted-text role="func"}
-   `~Random.pareto`{.interpreted-text role="func"}
-   `~Random.triangular`{.interpreted-text role="func"}
-   `~Random.uniform`{.interpreted-text role="func"}
-   `~Random.weibull`{.interpreted-text role="func"}
:::

Using SIM.JS
------------

Take a look at
`tutorials and examples <tutorial-main>`{.interpreted-text role="ref"}
to get a feel for writing simulation models with SIM.JS.
