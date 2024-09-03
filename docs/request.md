Request Objects {#request-main}
===============

::: {.default-domain}
js
:::

When an entity makes a request to the simulation \-- such as set a
timer, use a facility, etc \-- the simulator returns backs a `Request`
object. The entity can use this Request object to further modify the
original request.

::: {#request-generation}
The `Request` object is returned when an entity makes any of the
following requests:
:::

-   To set a timer, via `setTimer`{.interpreted-text role="func"}.
-   To use a facility, via `useFacility`{.interpreted-text role="func"}.
-   To put tokens in a buffer, via `putBuffer`{.interpreted-text
    role="func"}.
-   To get tokens from buffer, via `getBuffer`{.interpreted-text
    role="func"}.
-   To store objects in a store, via `putStore`{.interpreted-text
    role="func"}.
-   To retrieve object from a store, via `getStore`{.interpreted-text
    role="func"}.
-   To wait on an event, via `waitEvent`{.interpreted-text role="func"}.
-   To queue on an event, via `queueEvent`{.interpreted-text
    role="func"}.

The `Request` object can then be used to modify the request in the
following ways:

-   `~Sim.Request.done`{.interpreted-text role="func"}: Assign functions
    that must be called when the request is satisfied.
-   `~Sim.Request.waitUntil`{.interpreted-text role="func"}: Set a
    timeout value to the request. If the request is not satisfied within
    the timeout value, it will be terminated and the entity will be
    notified.
-   `~Sim.Request.unlessEvent`{.interpreted-text role="func"}: Put the
    request in the wait queue of one or more
    `events-events`{.interpreted-text role="ref"}. If any one of those
    events is fired, the request will be terminated and the entity will
    be notified.
-   `~Sim.Request.setData`{.interpreted-text role="func"}: Assign some
    user data for this request, which will be returned back when the
    simulator notifies the entity about the request.
-   `~Sim.Request.cancel`{.interpreted-text role="func"}: Cancel the
    request.

Except for `~Sim.Request.cancel`{.interpreted-text role="func"}, all
other functions return the `Request` object back, therefore, these
functions can be *chained* together. For example:

``` {.js}
// Example of chained function calls

this.putBuffer(buffer, 10)
.done(fnWhenSatisfied)
.done(fnAlsoWhenSatisfied)
.waitUntil(10, fnCouldNotAllocIn10Sec)
.unlessEvent(event1, fnEvent1Happened)
.unlessEvent(event2, fnEvent2Happened)
.setData('give me this data when ANY callback function is called');
```

The following table summarizes the various outcomes of a request and
which callback functions are called in each case:

+----------------+--------------+------------------+------------------+
| Outcome of     | callback in  | callback in      | callback in      |
| Request        | done()       | waitUntil()      | unlessEvent()    |
+================+==============+==================+==================+
| Request is     | > Yes        | > No             | > No             |
| satisfied      |              |                  |                  |
+----------------+--------------+------------------+------------------+
| Timeout occurs | > No         | > Yes            | > No             |
+----------------+--------------+------------------+------------------+
| Event is fired | > No         | > No             | > Yes            |
+----------------+--------------+------------------+------------------+
| cancel()       | > No         | > No             | > No             |
| called         |              |                  |                  |
+----------------+--------------+------------------+------------------+

API Reference
-------------

::: {.note}
::: {.title}
Note
:::

Special case with facilities.

In case of facilities with FIFO queuing discipline, the requesting
entities go through two stages: (1) wait for the facility to become free
(this may be zero duration if the facility is already free), and (2) use
the facility for specified duration. The
`~!Sim.Request.waitUntil`{.interpreted-text role="func"},
`~!Sim.Request.unlessEvent`{.interpreted-text role="func"} and
`~!Sim.Request.cancel`{.interpreted-text role="func"} functions are
applicable in the first stage only. In order words, if an entity has
started using the facility, then it cannot be dislodged and these
function calls will have no effect.

In case of facilities with LIFO and Processor Sharing disciplines, the
requesting entities obtain an immediate access to the facility resource.
Therefore, `~!Sim.Request.waitUntil`{.interpreted-text role="func"},
`~!Sim.Request.unlessEvent`{.interpreted-text role="func"} and
`~!Sim.Request.cancel`{.interpreted-text role="func"} functions will
have no effect for these facilities.
:::

Callback Functions {#request-callbacks}
------------------

Request class has three functions that accept callback functions:
`~Sim.Request.done`{.interpreted-text role="func"},
`~Sim.Request.waitUntil`{.interpreted-text role="func"} and
`~Sim.Request.unlessEvent`{.interpreted-text role="func"}. Before
calling the callback functions, the simulator may assign one or more of
these attributes in the `context` object:

-   

    `this.callbackSource`{.interpreted-text role="attr"}. The object for which this request was made.

    :   -   for `setTimer()`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *undefined*.
        -   for `useFacility(fac)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *fac*.
        -   for `putBuffer(buf)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *buf*.
        -   for `getBuffer(buf)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *buf*.
        -   for `putStore(store)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *store*.
        -   for `getStore(store)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *store*.
        -   for `waitEvent(event)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *event*.
        -   for `queueEvent(event)`{.interpreted-text role="attr"},
            `this.callbackSource`{.interpreted-text role="attr"} is
            equal to *event*.

-   

    `this.callbackMessage`{.interpreted-text role="attr"}. Provides additional information. Currently, this attribute is set in following cases only:

    :   -   If the request had a
            `~!Sim.Request.unlessEvent`{.interpreted-text role="func"}
            clause and the corresponding callback function is called.
            This attribute points to the event that led to this callback
            function.
        -   For `useFacility(fac)`{.interpreted-text role="attr"}, the
            callback in `~Sim.Request.done`{.interpreted-text
            role="func"} reports the server id that was allocated to
            this request.
        -   For `getStore(store)`{.interpreted-text role="attr"}, the
            callback in `~Sim.Request.done`{.interpreted-text
            role="func"} points to the object that is returned by the
            store.

-   `this.callbackData`{.interpreted-text role="attr"}. User defined
    data through `~Sim.Request.setData`{.interpreted-text role="func"}.
