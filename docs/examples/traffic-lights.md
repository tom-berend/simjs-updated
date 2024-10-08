Traffic Lights at Intersection {#example-traffic-lights}
==============================

The System
----------

In this tutorial example we will model traffic lights at an
intersection. We will simplify the problem as follows:

-   There is only one intersection of \"North-South\" street and
    \"East-West\" street.
-   Vehicles do not make turns at the intersection. They continue in
    their original direction, if the traffic light is green.
-   The traffic light itself has two states: Red and Green.
-   The vehicles arrive at the intersection as poisson process. That is,
    the interval between two successive vehicles is exponentially
    distributed. The four directions are considered as Identical
    Independent Distributions (IID).

**Simulation Objectives**. The parameters to our simplified system are:
(a) the time that the light remains green, and (b) the rate at which
vehicles arrive. Given these two, we would like to know:

-   What is average duration that vehicles have to wait at the
    intersection?
-   What is the average number of vehicles that are waiting at the
    intersection?

Modeling with SIM.JS
--------------------

We will model the traffic lights as `events-events`{.interpreted-text
role="ref"}. We will have two events, one for the North-South street and
another for the East-West Street.

We will model the traffic as **one** `entity-entity`{.interpreted-text
role="ref"}, that will generate *requests* to cross the intersection.
This entity will generate four exponential IID requests (for the
vehicles in four directions).

We are interested in measuring the time spent by the vehicles at the
intersection. We can consider the number of vehicles waiting at
intersection as `statistics-population`{.interpreted-text role="ref"}
and will use the Population class for recording statistics.

We begin by creating an instance of simulator:

``` {.js}
var sim = new Sim.Sim();
```

Next we create two events to model the traffic lights and give them
descriptive names:

``` {.js}
var trafficLights = [new Sim.Event("North-South Light"),
                     new Sim.Event("East-West Light")];
```

To monitor the statistics, we create an object of Population class:

``` {.js}
var stats = new Sim.Population("Waiting at Intersection");
```

Of course, we create a random number generator:

``` {.js}
var random = new Random(SEED);
```

We will create two entities: one to control the traffic lights, another
to generate the vehicle traffic. Lets look at traffic light controller
first.

The traffic light controller periodically turns off lights in one
direction and turns on the other. This process is repeated indefinitely
at interval of GREEN\_TIME seconds.

``` {.js}
class LightController extends Sim.Entity {
    currentLight: 0,  // the light that is turned on currently
    start() {
        // Logging
        sim.log(trafficLights[this.currentLight].name + " OFF"
                        + ", " + trafficLights[1 - this.currentLight].name + " ON");
        sim.log("------------------------------------------");

        // turn off the current light
        trafficLights[this.currentLight].clear();

        // turn on the other light.
        // Note the true parameter: the event must "sustain"
        trafficLights[1 - this.currentLight].fire(true);

        // update the currentLight variable
        this.currentLight = 1 - this.currentLight;

        // Repeat every GREEN_TIME interval
        this.setTimer(GREEN_TIME).done(this.start);
    }
}
```

Quite a few things are happening here. Lets dissect the code now:

-   First we create a JavaScript class (which is mostly interchangeable
    with prototype) that inherits all the behavior of Sim.Entity, and
    implements the `start`{.interpreted-text role="func"} function.
    Later on we will use the `Sim.addEntity`{.interpreted-text
    role="func"} function to create `Entity objects`. Of course, more
    than one objects can be created from the same `Entity Prototype`
    object (although in this example we create only one entity object).
-   When we call the `Sim.addEntity`{.interpreted-text role="func"} the
    simulator kernel adds other functions and attributes to the Entity
    prototype object. We call this new object as
    `Extended Entity Prototype` object. For example,
    `this.setTimer`{.interpreted-text role="func"} was added by the
    simulator. Refer to `entity-prototype`{.interpreted-text role="ref"}
    for a complete list of extended functions and attributes. The
    simulator now creates a new object with the extended entity
    prototype object as the *prototype*.
-   The `Entity prototype` object **must** define a *start* function.
    This function is called by the simulator when the simulation starts.
-   Notice that the events are fired with *true* argument, which
    indicates that the events must remain in \'fired state\' until
    explicitly cleared. The default behavior is that the events fire for
    an instant only and go back to passive state immediately.
-   The `setTimer`{.interpreted-text role="func"} function sets a timers
    for GREEN\_TIME duration, and at expiry will call
    `this.start`{.interpreted-text role="func"} function. The setTimer
    function returns a `Request <request-main>`{.interpreted-text
    role="ref"} object that can be used to modify the request. In this
    case we attach a callback function that must be called after the
    timer expires (via the `~Request.done`{.interpreted-text
    role="func"} function).
-   We have used `sim.log`{.interpreted-text role="func"} function to
    log the actions to help us debugging.

Moving on to the entity to generate traffic. Lets look at the code
first:

``` {.js}
class Traffic extends Sim.Entity {
    start() {
        this.generateTraffic("North", trafficLights[0]); // traffic for North -> South
        this.generateTraffic("South", trafficLights[0]); // traffic for South -> North
        this.generateTraffic("East", trafficLights[1]); // traffic for East -> West
        this.generateTraffic("West", trafficLights[1]); // traffic for West -> East
    },
    generateTraffic: function (direction, light) {
        // Logging
        sim.log("Arrive for " + direction);

        // STATS: record that vehicle as entered the intersection
        stats.enter(this.time());

        // wait on the light.
        // The done() function will be called when the event fires
        // (i.e. the light turns green).
        this.waitEvent(light).done(() => {
            var arrivedAt = this.callbackData;

            // Logging
            sim.log("Leave for " + direction + " (arrived at " + arrivedAt.toFixed(6) + ")");

            // STATS: record that vehicle has left the intersection
            stats.leave(arrivedAt, this.time());
        }).setData(this.time());

        // Repeat for the next car. Call this function again.
        var nextArrivalAt = random.exponential(1.0 / MEAN_ARRIVAL);
        this.setTimer(nextArrivalAt).done(this.generateTraffic, this, [direction, light]);
    }
}
```

Lets follow this code:

-   As before, we subclass `Sim.Entity` and implement a
    `start`{.interpreted-text role="func"} function.

-   We also notice that `this.time()`{.interpreted-text role="func"},
    `this.setTimer`{.interpreted-text role="func"} and
    `this.waitEvent`{.interpreted-text role="func"} are added by the
    simulator to this entity prototype object.

-   The `generateTraffic`{.interpreted-text role="func"} function
    generates traffic for one street for one direction. We call this
    function four times in our start function.

-   

    `this.waitEvent`{.interpreted-text role="func"} illustrates the most typical design pattern for requesting resources. The entity first make a request (in this case, wait for the event \-- the traffic light \-- to fire) which returns a `Request <request-main>`{.interpreted-text role="ref"} object. The entities then call the `~Sim.Request`{.interpreted-text role="class"} class functions to fine tune the request. Each of these function return the request object back, so the functions can be chained together. In this case we call two functions on request object:

    :   -   `Request.done`{.interpreted-text role="func"}. This assigns
            a callback function which will be called when the request is
            satisfied. In our case, we use the callback to update the
            statistics.
        -   `Request.setData`{.interpreted-text role="func"}. This
            stores some user data that can be retrieved later from
            :attr:this.callbackData\` attribute within the callback
            function. In this case, we store the current time (which is
            the arrival time).

-   We have seen the `this.setTimer`{.interpreted-text role="func"}
    earlier too, however, this time we use the complete three-argument
    form: `this.setTimer(callbackFn, context, data)`{.interpreted-text
    role="attr"}. *callbackFn* is the callback function
    (this.generateTraffic in our example), *context* is object in whose
    context this function will be called, and *data* will become
    argument to the callback function.

-   Note that there are two ways to pass data to the callback functions:
    via the `Request.setData`{.interpreted-text role="func"} as
    `this.callbackData`{.interpreted-text role="attr"} or passing data
    along with callback function which shows up arguments to the
    callback function. The difference between the two is that the former
    data will appear for *all* callback functions, whereas the latter
    will be specific to one callback function only. The following
    example should explain this:

``` {.js}
this.waitEvent(event)
.setData('Data to all callback functions')
.done(fn1, this, 'data to fn1 only')
.done(fn2, this, 'data to fn2 only')
.waitUntil(fn3, this, 'data to fn3 only')
.unlessEvent(fn4, this, 'data to fn4 only');

fn1 = function(arg) {
    assert(arg == 'data to fn1 only');
    assert(this.callbackData == 'Data to all callback functions');
}

fn2 = function(arg) {
    assert(arg == 'data to fn2 only');
    assert(this.callbackData == 'Data to all callback functions');
}
```

Having created the entity prototype objects we create the actual entity
objects

``` {.js}
sim.addEntity(LightController);
sim.addEntity(Traffic);
```

And finally, we start simulation:

``` {.js}
// simulate for SIMTIME time
sim.simulate(SIMTIME);
```

[View the complete source code](traffic_lights.js).

Running Simulation
------------------

This javascript code can be executed where ever javascript can run. This
includes:

-   As a script in HTML page on a web browser.
-   Via Web browser JavaScript debuggers such as Mozilla Firebug,
    Safari\'s Developer tools etc.
-   With [Rhino](www.mozilla.org/rhino).
-   With `jrunscript`.
-   and so on\...

We will run our model as a web page on a web browser. For this we have
created the following web page:

``` {.js}
<html>
<head>
    <title>Tutorial: Simulation of Traffic Lights at Intersection</title>

    <script type="text/javascript" src="sim-0.1.js"></script>
    <script type="text/javascript" src="traffic-light.js"></script>
</head>
<body></body>
</html>
```

Tracing Simulation Runs
-----------------------

Having completed the model let us first see that the model is working
correctly. We can use the `debug-log`{.interpreted-text role="ref"}
feature of the simulator to log events and actions.

We have already added the logging support in our code. To enable
logging, we use the `Sim.setLogger`{.interpreted-text role="func"}
function:

``` {.js}
// add these lines before starting simulation
document.write("<pre>");
sim.setLogger(function (str) {
    document.write(str);
}));
```

Remember to add these lines before the `sim.simulate`{.interpreted-text
role="func"} function. The *setLogger* function takes as input a
\'writer\' function that will be invoked to write trace logs. In our
case, we output the trace logs to the web document. We have also added
the \"\<pre\>\" tag so that the output is displayed as well formatted
text.

Lets first disable the logging statement in the Traffic function so that
we see the output from the LightController entity only. To help in
visualization, we have selected rather extreme values with GREEN\_TIME =
5 min, MEAN\_ARRIVAL = 1 min, SIMTIME = 30 min and SEED = 1234.

We see the following output:

    0.000000   North-South Light OFF, East-West Light ON
    0.000000   ------------------------------------------
    5.000000   East-West Light OFF, North-South Light ON
    5.000000   ------------------------------------------
    10.000000   North-South Light OFF, East-West Light ON
    10.000000   ------------------------------------------
    15.000000   East-West Light OFF, North-South Light ON
    15.000000   ------------------------------------------
    20.000000   North-South Light OFF, East-West Light ON
    20.000000   ------------------------------------------
    25.000000   East-West Light OFF, North-South Light ON
    25.000000   ------------------------------------------
    30.000000   North-South Light OFF, East-West Light ON
    30.000000   ------------------------------------------

This make sense, the lights switch every 5 minutes.

Next we enable the logging statement in the Traffic entity. We show only
some selected lines from the output:

    0.000000   North-South Light OFF, East-West Light ON
    0.000000   ------------------------------------------
    0.000000   Arrive for North
    0.000000   Arrive for South
    0.000000   Arrive for East
    0.000000   Arrive for West
    0.000000   Leave for East (arrived at 0.000000)
    0.000000   Leave for West (arrived at 0.000000)
    0.034122   Arrive for North
    0.250816   Arrive for South
    0.819317   Arrive for East
    0.819317   Leave for East (arrived at 0.819317)
    0.912556   Arrive for East
    0.912556   Leave for East (arrived at 0.912556)
    <lines omitted>
    5.000000   East-West Light OFF, North-South Light ON
    5.000000   ------------------------------------------
    5.000000   Leave for North (arrived at 0.000000)
    5.000000   Leave for South (arrived at 0.000000)
    5.000000   Leave for North (arrived at 0.034122)
    5.000000   Leave for South (arrived at 0.250816)
    5.000000   Leave for South (arrived at 2.651636)
    5.000000   Leave for North (arrived at 4.928112)
    5.129310   Arrive for South
    5.129310   Leave for South (arrived at 5.129310)
    5.144233   Arrive for East
    5.194057   Arrive for North
    5.194057   Leave for North (arrived at 5.194057)
    <lines omitted>
    10.000000   North-South Light OFF, East-West Light ON
    10.000000   ------------------------------------------
    10.000000   Leave for East (arrived at 5.144233)
    10.000000   Leave for West (arrived at 5.230096)
    10.000000   Leave for East (arrived at 6.584731)
    10.000000   Leave for East (arrived at 7.645791)
    10.000000   Leave for East (arrived at 8.079168)
    10.000000   Leave for East (arrived at 8.551925)
    10.000000   Leave for West (arrived at 8.709882)
    10.000000   Leave for West (arrived at 9.194689)
    10.000000   Leave for East (arrived at 9.277087)
    10.000000   Leave for West (arrived at 9.963535)
    <lines omitted>

Note the first four arrival lines. Only the East- and West-bound
vehicles leave the intersection. Notice also at 5.0 minutes, all the
North and South bound vehicles leave intersection as soon as the light
turns green. You can follow the logs to verify that our traffic light
model is indeed working correctly.

Statistics
----------

We are ultimately interested in average statistics of our model. For
this problem we would like to know:

-   What is average duration that vehicles have to wait at the
    intersection?
-   What is the average number of vehicles that are waiting at the
    intersection?

We have used the `statistics-population`{.interpreted-text role="ref"}
statistics to monitor the vehicle traffic at the intersection.
`Population.durationSeries`{.interpreted-text role="attr"} (which is a
`statistics-time-series`{.interpreted-text role="ref"}) records the
duration for which vehicles wait at the intersection, and
`Population.sizeSeries`{.interpreted-text role="attr"} (which is a
`statistics-data-series`{.interpreted-text role="ref"}) records the
number of vehicles standing at the intersection.

To output these two statistics, add the following lines after the
`sim.simulate`{.interpreted-text role="func"} call.

``` {.js}
document.write("Number of vehicles at intersection (average) = "
        + stats.sizeSeries.average().toFixed(3)
        + " (+/- " + stats.sizeSeries.deviation().toFixed(3)
        + ")\n");
document.write("Time spent at the intersection (average) = "
        + stats.durationSeries.average().toFixed(3)
        + " (+/- " + stats.durationSeries.deviation().toFixed(3)
        + ")\n");
```

The output for our rather contrived input values is as follows:

    Number of vehicles at intersection (average) = 4.264 (+/- 2.069)
    Time spent at the intersection (average) = 1.361 (+/- 1.830)

Traffic Lights in Action
------------------------

You can [play with this simulation model](traffic_lights.html). Try out
different values of input parameters and compare the output statistics
of model.
