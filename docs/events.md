Timers, Events and Messages
===========================

::: {.default-domain}
js
:::

This section covers the various mechanisms by which entities can plan
actions for themselves at different time instances, as well as
coordinate with other entities.

`events-timers`{.interpreted-text role="ref"} allow entities to execute
functions after a delay.

`events-events`{.interpreted-text role="ref"} are objects that can help
synchronize actions among multiple entities.

`events-messages`{.interpreted-text role="ref"} are objects that
entities can send to each other.

Timers {#events-timers}
------

Timers are mechanisms for *delayed executions* of functions. An entity
can specify a JavaScript function and a duration (in simulated time)
after which this function must be executed.

The `setTimer`{.interpreted-text role="func"} function in the Entity
Prototype provides an API to execute function after a timeout.

Some examples:

``` {.js}
var Entity = {
    start: function () {
        // Execute an anonymous function after 10 seconds
        this.setTimer(10).done(function () {
            document.write("The simulation time must be 10 now.");
        });

        // Execute a local function after 20 seconds
        this.setTimer(20).done(this.specialHandler);
    },
    specialHandler: function () {
        document.write("Special Handler: executed every 20 seconds");

        // Recursively calling a function (will not overflow on stack)
        this.setTimer(20).done(this.specialHandler);
    },
    onTimeout: function () {
        document.write("Default handler: time now must be 30");
    }
}
```

The `setTimer`{.interpreted-text role="func"} function takes one
argument \-- the duration after which the timer must expire and some
action must be taken.

The setTimer function returns a `Request` object. Refer to
`request-main`{.interpreted-text role="ref"} documentation on how to
further modify the setTimer request.

If the timeout value is 0, the action function will be called *after*
the current function has finished executing. This way, there will be
recursive function calls and no chance of stack overflow in case of
recursive delayed functions.

``` {.js}
start: function () {
    // Action functions are called *after* the current function has returned
    this.setTimer(0).done(function () {
        document.write("I will print as second line.");
    });

    document.write("I will print as first line.");
}
```

::: {.note}
::: {.title}
Note
:::

The action function is executed in context of the entity. That is, it
will be equivalent to *actionFunction*.`call`(*entity*).
:::

Events {#events-events}
------

Events are external objects that start out in *passive* state, and at
some point in time will be *activated* or *fired*. Entities \'attach\'
themselves to events and wait until the event is fired. There are two
ways in which entities can attach with events:

1.  *Wait for Event*. All entities that wait for events will be notified
    when the event fires.
2.  *Queue for Event*. Entities join a queue, and only the front entity
    will be notified when the event fires. Once notified, the entity is
    removed from the queue, and the next in queue entity will be
    notified when the event fires the second time.

The events can fire in two ways:

1.  *Flash fire*. The event fires [for an instant]{.title-ref} (more
    technically: for zero simulated time duration). When the event
    fires, it notifies all entities that were waiting and one entity in
    the queue, and then reverts back to passive state. Any request (wait
    or queue) after this will have to wait until the next time the event
    is fired.
2.  *Sustained fire*. The event fires and remains in activated state for
    an indefinite period until explicitly reset to passive state. When
    the event fires, it notifies all entities that were waiting and
    *all* entities in the queue. Any request (wait or queue) coming
    after the event is fired, and before the event is reset, will be
    serviced immediately.

An example of flash fire would be clock changing the date \'at the
stroke of midnight\'. Only the entities that were already waiting before
the midnight will be notified. Any entity that requested the event after
midnight will have to wait until the next fire event (midnight next
night). The event itself can be considered to have happened in zero
time.

An example of sustained fire would be traffic lights. When the traffic
light is red (passive state), the entities (cars) will wait. Once the
lights are green (fired) they remain in fired state until explicitly
reset to passive state. Any request arriving during the period when the
event is activated will be services immediately.

An event object is created as:

``` {.js}
var event = new Sim.Event(name)
```

The events are fired by `~Sim.Event.fire`{.interpreted-text role="func"}
function and reset to passive state by
`~Sim.Event.clear`{.interpreted-text role="func"} function.

The entities can wait or queue on events by
`waitEvent`{.interpreted-text role="func"} and
`queueEvent`{.interpreted-text role="func"}, respectively, as defined in
the `entity-prototype`{.interpreted-text role="ref"} section.

An example demonstrating the behavior of waitEvent and queueEvent:

``` {.js}
var barrier = new Sim.Event('Barrier');
var funnel = new Sim.Event('Funnel');
class Entity extends Sim.Entity {
    start() {
        this.waitEvent(barrier).done(() => {
            document.write("This line is printed by all entities.");
        });

        this.queueEvent(funnel).done(() => {
            document.write("This line is printed by one entity only");
        });

        if (this.master) {
            this.setTimer(10)
            .done(barrier.fire, barrier)
            .done(funnel.fire, funnel);
        }
    }
}

var sim = new Sim.Sim();
var entities = [];
for (var i = 0; i < NUM_ENTITIES; i++) {
    entities.push(sim.addEntity(Entity));
}
entities[0].master = true;
sim.simulate(SIMTIME);
```

An example demonstrating the behavior of flash and sustained event fire:

``` {.js}
var sustained = new Sim.Event('Sustained Event');
var flash = new Sim.Event('Flash Event');
class Entity extends Sim.Entity {
    start() {
        // one second before fire
        this.setTimer(9).done(() => {
            this.waitEvent(sustained).done(() => document.write("Notified at time 10."));

            this.waitEvent(flash).done(() => document.write("Notified at time 10."));
        });

        // one second after fire
        this.setTimer(11).done(() => {
            this.waitEvent(sustained).done(() => document.write("Notified at time 11."));

            this.waitEvent(flash).done(() => document.write("Will not be notified :("));
        });

        // Trigger both events at time = 10
        this.setTimer(10)
        .done(() => sustained.fire(true));
        .done(flash.fire, flash);
    }
}
```

Messages {#events-messages}
--------

Messages are objects that entities can send to each other. The messages
can be any JavaScript type \-- numbers, string, functions, arrays,
objects etc.

Entities send messages using the `send`{.interpreted-text role="func"}
`Extended Entity Prototype` function (see also
`entity-prototype`{.interpreted-text role="ref"}). The signature of this
function is:

As an example, consider a ping-pong game played by two players where
they send a string back and forth to each other. Before resending the
string, each player appends his/her name to the string. We will model
the two players as entities and the string as a message.

``` {.js}
class Player extends Sim.Entity{
    start() {
        if (this.firstServer) {
            // Send the string to other player with delay = 0.
            this.send("INITIAL", 0, this.opponent);
        }
    },
    onMessage(sender, message) {
        // Receive message, add own name and send back
        var newMessage = message + this.name;
        this.send(newMessage, HOLDTIME, sender);
    }
};

var sim = new Sim.Sim();
var jack = sim.addEntity(Player);
var jill = sim.addEntity(Player);

jack.name = "Jack";
jill.name = "Jill";

jack.firstServer = true;
jack.opponent = jill;

sim.simulate(SIMTIME);
```
