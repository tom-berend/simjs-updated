Statistics
==========

::: {.default-domain}
js
:::

The SIM.JS library provides three utility classes for recording and
analyzing statistics: `Data Series`, `Time Series` and `Population`.

`Data Series <statistics-data-series>`{.interpreted-text role="ref"} is
a collection of discrete, time-independent observations, for example,
grades of each student in a class, length of rivers in United States.
The `~Sim.DataSeries`{.interpreted-text role="class"} class provides a
convenient API for recording and analyzing such observations, such as
finding maximum and minimum values, statistical properties like average
and standard deviation and so on.

`Time Series <statistics-time-series>`{.interpreted-text role="ref"} is
a collection of discrete time-dependent observations. That is, each
observation value is associated with a discrete time instance (the time
at which the observation was made). For example, the size of queue at
time *t* during the simulation run, number of customers in a restaurant
at time *t* during evening hours. Note that the time instances when the
observations are made are discrete. Also note the difference between
`Data Series` statistics which records time independent statistics. The
`~Sim.TimeSeries`{.interpreted-text role="class"} class provides a
convenient API for recording and analyzing such observations, such as
finding maximum and minimum values, statistical properties like
time-averaged mean and standard deviation and so on.

`Population <statistics-population>`{.interpreted-text role="ref"} is
actually a composite of the above two statistics, which models the
behavior of population growth and decline. Consider a room where people
may enter, stay for a while and then leave. The *enter* event will
increase the population count, while the *leave* will decrease the
population count of the room. For this room, we are interested in two
statistics:

1.  The average population of the room. Note that this is a *Time
    Series* statistics (observation is number of people in room at some
    discrete time instance). The statistical information for the size of
    the population is contained in the
    `~Sim.Population.sizeSeries`{.interpreted-text role="attr"}
    attribute, which is an object of the
    `~Sim.TimeSeries`{.interpreted-text role="class"} class.
2.  The average duration that people stayed in the room. Note that is a
    *Data Series* statistics (observations are stay duration for each
    person, and are independent of time). The statistical information
    for the stay duration is contained in the
    `~Sim.Population.durationSeries`{.interpreted-text role="attr"}
    attribute, which is an object of the
    `~Sim.DataSeries`{.interpreted-text role="class"} class.

The `Population` statistics is used very often to study the behaviors of
*queues*.

Data Series Statistics {#statistics-data-series}
----------------------

Data Series is a collection of discrete, time-independent observations,
and the :js`~Sim.DataSeries`{.interpreted-text role="class"} class
provides an API for recording and analyzing statistics.

An object of the :js`~Sim.DataSeries`{.interpreted-text role="class"} is
created for each observation set:

``` {.js}
var studentGrades = new Sim.DataSeries("Student Grades");
var riverLengths = new Sim.DataSeries("Length of Rivers in US");
```

The observation values are recorded through the
`~Sim.DataSeries.record`{.interpreted-text role="func"} function. This
function optionally takes a *weight* parameter to adjust the weight of
the given observation:

``` {.js}
studentGrades.record(3.0);       // Alice
riverLengths.record(2320.0);  // Mississippi (miles)
experimentData.record(1.5, 0.8); // Value = 1.5, Weight = 0.8
```

The DataSeries class computes statistical properties of the observation
values, including `~Sim.DataSeries.count`{.interpreted-text
role="func"}, `~Sim.DataSeries.min`{.interpreted-text role="func"},
`~Sim.DataSeries.max`{.interpreted-text role="func"},
`~Sim.DataSeries.sum`{.interpreted-text role="func"},
`~Sim.DataSeries.sumWeighted`{.interpreted-text role="func"},
`~Sim.DataSeries.average`{.interpreted-text role="func"} (mean),
`~Sim.DataSeries.deviation`{.interpreted-text role="func"} (standard
deviation) and `~Sim.DataSeries.variance`{.interpreted-text
role="func"}. Data can be recorded as histograms via the
`~Sim.DataSeries.setHistogram`{.interpreted-text role="func"} function.

An example:

``` {.js}
var data = new Sim.DataSeries('Simple Data');
for (var i = 1; i <= 100; i++) {
    data.record(i);
}
data.count(); // = 100
data.min();   // = 1.0
data.max();   // = 100.0
data.range(); // = 99.0
data.sum();   // = 5050.0
data.average(); // 50.5
data.deviation(); // = 28.86607004772212
data.variance(); // = 833.25
```

### API Reference

Time Series Statistics {#statistics-time-series}
----------------------

Time Series is a collection of discrete, **time-dependent**
observations, and the :js`~Sim.TimeSeries`{.interpreted-text
role="class"} class provides an API for recording and analyzing
statistics.

An object of the :js`~Sim.TimeSeries`{.interpreted-text role="class"}
class is created for each observation set:

``` {.js}
var queueSize = new Sim.TimeSeries("Queue Size");
var customers = new Sim.TimeSeries("Customers at Restaurant");
```

The observation values are recorded through the
`~Sim.TimeSeries.record`{.interpreted-text role="func"} function. Each
observation is a combination of (a) the value to record, and (b) the
time when the observation was made. For example,

``` {.js}
queueSize.record(0, 0); // size is 0 at 0 sec
queueSize.record(1, 1.5); // size is 1 at 1.4 sec
queueSize.record(2, 1.8); // size is 2 at 1.8 sec

customer.record(15, 1800); // 15 customers at 6 pm
customer.record(50, 2100); // 50 customers at 9 pm
customer.record(5, 2315); // 5 customers at 11:15 pm
```

Few notes on the semantics of observations: when an observation (*v1*,
*t1*) is recorded, it means that the value of the system is *v1*,
starting at time *t1*, and will remain so until the next observation is
recorded.

For the *customer* example above, the observation will look like this:

![image](images/statistics-time-series.png)

The three circles represent the three observations recorded. Note how
the observations are *discrete* with respect to time.

Also observe that (*v1*, *t1*) record will not be \"*committed*\" until
a next observation (*v2*, *t2*) is made (since only then we will know
that the value *v1* was applicable for the duration *t1* - *t2*). The
`~Sim.TimeSeries.finalize`{.interpreted-text role="func"} function can
be used to commit the last observation.

The TimeSeries class computes statistical properties of the observation
values, including `~Sim.TimeSeries.count`{.interpreted-text
role="func"}, `~Sim.TimeSeries.min`{.interpreted-text role="func"},
`~Sim.TimeSeries.max`{.interpreted-text role="func"},
`~Sim.TimeSeries.sum`{.interpreted-text role="func"},
`~Sim.TimeSeries.average`{.interpreted-text role="func"} (mean),
`~Sim.TimeSeries.deviation`{.interpreted-text role="func"} (standard
deviation) and `~Sim.TimeSeries.variance`{.interpreted-text
role="func"}. Data can be recorded as histograms via the
`~Sim.TimeSeries.setHistogram`{.interpreted-text role="func"} function.

Note that the `average`, `deviation` and `variance` statistics are
*averaged over time*.

### API Reference

Population Statistics {#statistics-population}
---------------------

*Population* models the behavior of population growth and decline. This
class supports two basic operations:

(1) `~Sim.Population.enter`{.interpreted-text role="func"} to indicate
    that one entity has entered the system and the population has
    increased by one (*birth* event), and
(2) `~Sim.Population.leave`{.interpreted-text role="func"} to indicate
    that one entity has left the system and the population has decreased
    by one (*death* event).

Population itself is a composite of two statistics:

1.  `Sim.Population.sizeSeries`{.interpreted-text role="attr"}: a
    statistic of `TimeSeries` type which records the population of the
    system as a function of time.
2.  `Sim.Population.durationSeries`{.interpreted-text role="attr"}: a
    statistic of `DataSeries` type which records the stay duration of
    each entity.

Consider the following example:

``` {.js}
var motel0 = new Sim.Population("Motel 0");
motel0.enter(1600); // one person entered at 4:00 pm
motel0:enter(1600); // second person entered at 4:00 pm
motel0.leave(1600, 1601); // one person who entered at 4:00 pm, left at 4:01 pm
motel0.enter(1630); // another person entered at 4:30 pm
motel0.leave(1630, 1700); // person who entered at 4:30 pm left at 5:00 pm

motel0.finalize(1700); // No more observations after this

motel0.current(); // current population = 1
motel0.sizeSeries.average(); // average population in motel
motel0.durationSeries.average(); // average stay duration in motel
```

### API Reference
