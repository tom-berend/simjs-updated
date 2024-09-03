SIM.JS \-- Discrete Event Simulation in JavaScript
==================================================

**SIM.JS is a general-purpose Discrete Event Simulation library written
entirely in JavaScript.**

::: {.sidebar}
**Table of Contents**

::: {.toctree maxdepth="1"}
basics tutorial simulator random download contact
:::
:::

SIM.JS is a library for modeling discrete time event systems:

-   The library provides constructs to create
    `Entities <entity-entity>`{.interpreted-text role="ref"} which are
    the active actors in the system and encapsulate the state and logic
    of components in a system.
-   The entities contend for *resources*, which can be
    `Facilities <resources-facility>`{.interpreted-text role="ref"}
    (services that are requested by entities; supports FIFO, LIFO with
    preemption and Processor Sharing service disciplines),
    `Buffers <resources-buffer>`{.interpreted-text role="ref"}
    (resources that store finite amount of tokens) and
    `Stores <resources-store>`{.interpreted-text role="ref"} (resources
    that store JavaScript objects).
-   The entities communicate by waiting on
    `events-events`{.interpreted-text role="ref"} or by sending
    `events-messages`{.interpreted-text role="ref"}.
-   Statistics recording and analysis is provided by
    `statistics-data-series`{.interpreted-text role="ref"} (collection
    of discrete, time-independent observations),
    `statistics-time-series`{.interpreted-text role="ref"} (collection
    of discrete, time-dependent observations) and
    `statistics-population`{.interpreted-text role="ref"} (the behavior
    of population growth and decline).
-   SIM.JS also provides a random number generation library to generate
    seeded random variates from various distributions, including
    uniform, exponential, normal, gamma, pareto and others.

**SIM.JS is written in \*idiomatic\* ES2015 JavaScript**. The library is
written in event-based design paradigm: the changes in system states are
notified via callback functions
(`why not process-based? <basic-design>`{.interpreted-text role="ref"}).
The design takes advantage of the powerful feature sets of JavaScript:
prototype based inheritance, first-class functions, closures, anonymous
functions, runtime object modifications and so on. Of course, a
knowledge of these principles is not required (a lot of this behind the
scenes), but we do certainly hope that using SIM.JS will be pleasurable
experience for the amateur as well as the experienced practitioners of
JavaScript.

SIM.JS is free, open source and licensed under LGPL.

::: {.topic}
**Why Javascript?**

-   The authors of this library are passionate about Discrete Event
    Simulations, and hope to see its widespread use in education as well
    as everyday applications. The authors also believe that in this era
    of Web 2.0, web-based applications are the best way to reach people.
    Which is why they concluded that there is a need for a Web enabled
    simulation engine.
-   These days when one can [boot linux](http://bellard.org/jslinux)
    with JavaScript, play
    [Doom](http://developer.mozilla.org/en-US/demos/detail/doom-on-the-web),
    run a myriad of productivity applications on the Web, we ask \-- why
    not simulations? (And we say its about time!)
:::
