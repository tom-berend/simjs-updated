Simulator and Entity
====================

Simulator and Entities are the core of Discrete Event Simulation.
Entities are the *actors* in the system \-- they request resources,
communicate with other entities and so on. Simulator is the backbone
that provides the necessary framework, including the notion of
*simulated clock*. The basics of discrete event simulation are discussed
in `introduction-simjs`{.interpreted-text role="ref"}.

Simulator {#entity-simulator}
---------

The SIM.JS library provides a global class variable
`Sim`{.interpreted-text role="class"}, an instance of which defines one
simulation process.

The steps in creating a simulation run are quite simple:

1.  Create an object of `Sim`{.interpreted-text role="class"} class.
2.  Create entity objects via `~Sim.Sim.addEntity`{.interpreted-text
    role="func"} function call. This function takes a
    `Sim.Entity class/prototype` (see `entity-entity`{.interpreted-text
    role="ref"} below), uses it to create a Sim.Entity, and attaches it
    to the simulation.
3.  Start the simulation by calling
    `~Sim.Sim.simulate`{.interpreted-text role="func"}.

### API Reference

::: {#entity-entity}
Sim.Entity =========
:::

Entities are the actors in the simulation. SIM.JS uses the JavaScript\'s
*prototype inheritance* concept to differentiate between the behavior
representation (similar to *class* in C++ or Java) and the runtime
representation (similar to *objects* in C++ or Java).

As programmers, we create a `Sim.Entity Prototype` JavaScript object.
This is like any other JavaScript object, except for the following
constraints:

-   The object must have a `start()` function. This function is called
    by the simulator when the simulation starts.
-   There are reserved function and attribute names (see
    `entity-prototype`{.interpreted-text role="ref"} for a complete
    list) that must not be used in the object.

An example of a very simple `Entity Prototype` object could be:

``` {.js}
class EntityPrototype extends Sim.Entity {
    start() {
        // This function is necessary!
        // This function is called by simulator when simulation starts.
        document.write("the simulation has started!").
    }
};
```

Think of `Entity Prototype` objects as *classes* in languages like C++
or Java. This class will be used to create *objects*, which are the
runtime representation of entities. We call these runtime objects as
`Entity Objects`, which are *instances* of `Entity Prototypes`.

The `Entity Objects` are created by the
`Sim.Sim.addEntity`{.interpreted-text role="func"} function:

``` {.js}
// Create entity object from the entity prototype object
var entityObject = sim.addEntity(EntityPrototype);

// More than one entity objects can be created by same entity prototype object
var anotherEntityObject = sim.addEntity(EntityPrototype);
```

The `Sim.Sim.addEntity`{.interpreted-text role="func"} function performs
three actions:

1.  *Extends* the `Entity Prototype` object by adding new functions and
    attributes to the original prototype object.
    `entity-prototype`{.interpreted-text role="ref"} lists these
    functions and attributes.
2.  *Creates* a new object which inherits the
    `Extended Entity Prototype`.
3.  Assigns a unique integer value to the `id`{.interpreted-text
    role="attr"} attribute of the object.

The entire process is illustrated in the diagram below:

![image](images/entity-prototype.png)

The input to the `Sim.Sim.addEntity`{.interpreted-text role="func"}
function is `Entity Prototype` object. This is an object that we have
written to model the components of system for our discrete simulation
problem.

The simulator adds other useful functions and attributes (see below for
complete list) to the `Entity Prototype` object. We call this object as
`Extended Entity Prototype`.

The simulator then creates an object (the `Entity Object`) which
inherits from the `Extended Entity Prototype` object (for example, via
the *Object.create* function on platforms where it is supported).

This new `Entity Object` is returned to the user program.

### Entity Prototype

As noted earlier, the `Entity Prototype` object must define
`start`{.interpreted-text role="func"} function. This function is called
by the simulator when the simulation starts. It is this function where
the entities initialize their state and schedule future events in the
simulator.

The prototype object may optionally have a `finalize`{.interpreted-text
role="func"} function. This function is called when the simulation
terminates.

The prototype object may optionally have a `onMessage`{.interpreted-text
role="func"} function. This function is called when some other entity
has sent a `Message <events-messages>`{.interpreted-text role="ref"}.

### Extended Entity Prototype API {#entity-prototype}

The SIM.JS library adds following functions and attributes to the
`Entity Prototype` object.

::: {.note}
::: {.title}
Note
:::

The function and attribute names listed below should be treated as
\"reserved keywords\" when writing the `Entity Prototype` code.
:::

These functions and attributes are added when
`Sim.Sim.addEntity`{.interpreted-text role="func"} function is called.
For example,

``` {.js}
class EntityPrototype extends Sim.Entity {
    start() {
        var now = this.time(); // Where did we get this time() function from? See below..
        document.write("The time now is " + now);
    }
};

assert(EntityPrototype.time === undefined); // the object does not have a time method (yet)!

var obj = sim.addEntity(EntityPrototype);   // create an object from prototype


// Since obj inherits from the extended Sim.Entity prototype, it will have methods
//  defined in EntityPrototype as well as those Sim.Entity defines.
assert(obj.start instanceof Function);
assert(obj.time instanceof Function);
```
