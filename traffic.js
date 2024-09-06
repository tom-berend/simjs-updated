import { Sim, Entity, Event } from './src/sim.js';
import { Population } from './src/stats.js';
import { TXG } from './lib/tsxgraph.js';
// What is average duration that vehicles have to wait at the intersection?
// What is the average number of vehicles that are waiting at the intersection?
//
// We will model the traffic lights as Events. We will have two events, one for the
// North-South street and another for the East-West Street.
//
// We will model the traffic as one Entity, that will generate requests to cross the
// intersection. This entity will generate four exponential IID requests (for the
// vehicles in four directions).
//
let GREEN_TIME = 100;
let MEAN_ARRIVAL = 10;
let SIMTIME = 1000;
let sim = new Sim();
let TSX = TXG.TSXGraph.initBoard('jsxbox', { axis: true });
// create the two events
let trafficLights = [
    new Event("North-South Light"),
    new Event("East-West Light")
];
// create a Population object to monitor the statistics
let stats = new Population("Waiting at Intersection");
// an entity to control the traffic lights, periodically turns off lights in one
// direction and turns on the other.
class LightController extends Entity {
    currentLight = 0; // the light that is turned on currently
    constructor(name) {
        super(name);
    }
    start() {
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
;
class Traffic extends Entity {
    constructor(name) {
        super(name);
    }
    start() {
        this.generateTraffic("North", trafficLights[0]); // traffic for North -> South
        this.generateTraffic("South", trafficLights[0]); // traffic for South -> North
        this.generateTraffic("East", trafficLights[1]); // traffic for East -> West
        this.generateTraffic("West", trafficLights[1]); // traffic for West -> East
    }
    generateTraffic(direction, light) {
        // STATS: record that vehicle as entered the intersection
        stats.enter(this.time());
        sim.log("Arrive for " + direction);
        // wait on the light.
        // The done() function will be called when the event fires
        // (i.e. the light turns green).
        this.waitEvent(light).done(function () {
            let arrivedAt = this.callbackData;
            // STATS: record that vehicle has left the intersection
            stats.leave(arrivedAt, this.time());
            sim.log("Leave for " + direction + " (arrived at " + arrivedAt.toFixed(6) + ")");
        }).setData(this.time());
        // Repeat for the next car. Call this function again.
        let nextArrivalAt = TSX.StatisticsMath.randomExponential(1.0 / MEAN_ARRIVAL);
        let ro = this.setTimer(nextArrivalAt).done(() => this.generateTraffic(direction, light));
        console.log('%ctimer ro', 'background-color:blue;', ro);
    }
}
;
sim.addEntity(new LightController('LightController'));
sim.addEntity(new Traffic('traffic'));
//    Uncomment to display logging information
//    sim.setLogger(function (str) {
//        document.write(str);
//    });
// simulate for SIMTIME time
sim.simulate(SIMTIME);
console.log(stats.durationSeries.average(), stats.durationSeries.deviation(), stats.sizeSeries.average(), stats.sizeSeries.deviation());
//# sourceMappingURL=traffic.js.map