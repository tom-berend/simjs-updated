Random Number Generation
========================

::: {.default-domain}
js
:::

Why not `Math.random()`?
------------------------

The JavaScript\'s native `Math.random()` function is not suited for
Discrete Event Simulations, since:

-   The `Math.random()` function cannot be *seeded*. There is no way to
    guarantee that the same random stream will be produced the next time
    the script is executed.
-   There is *only one stream* of random numbers. Statistics purists
    frown upon when two independent random distributions are drawn from
    same seed.
-   The javascript library provides only the *uniform* probability
    distribution function. In DES, as also in many other scientific
    applications, there is a need for other kinds of distributions, such
    as *exponential*, *gaussian*, *pareto* etc.
-   The native `Math.random()` does not use (at the time of writing) the
    arguably better *Mersenne Twister* algorithm for random number
    generator (see Mersenne Twister
    [website](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html)
    and Wikipedia
    [article](http://en.wikipedia.org/wiki/Mersenne_twister)).

The `Sim.Random` Library \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

The `Sim.Random` library uses the Mersenne Twister algorithm for
generating random number stream, and is based on the JavaScript
implementation by Makoto Matsumoto and Takuji Nishimura
([code](www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/VERSIONS/JAVASCRIPT/java-script.html)).

The original code is wrapped around as a javascript class and there can
be multiple objects each representing different random number streams.
For example,

``` {.js}
/* Demonstrate that random number streams can be seeded,
 * and multiple streams can be created in a single script. */
var stream1 = new Sim.Random(1234);
var stream2 = new Sim.Random(6789);

stream1.random(); // returns 0.966453535715118 always
stream2.random(); // returns 0.13574991398490965 always
```

In addition, the `Sim.Random` library supports following probability
distribution functions:

::: {.hlist columns="4"}
-   `~Sim.Random.exponential`{.interpreted-text role="func"}
-   `~Sim.Random.gamma`{.interpreted-text role="func"}
-   `~Sim.Random.normal`{.interpreted-text role="func"}
-   `~Sim.Random.pareto`{.interpreted-text role="func"}
-   `~Sim.Random.triangular`{.interpreted-text role="func"}
-   `~Sim.Random.uniform`{.interpreted-text role="func"}
-   `~Sim.Random.weibull`{.interpreted-text role="func"}
:::

API Reference
-------------

::: {.function}
Sim.Random.random()

Returns a uniformly generated random floating point number in the range
`[0, 1.0)`.
:::
