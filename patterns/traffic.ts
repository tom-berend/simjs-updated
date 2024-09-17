import { Sim, Entity, Facility, Event } from '../src/sim.js'
import { Population } from '../src/stats.js'
import { TXG } from '../lib/tsxgraph.js'




// What is average duration that vehicles have to wait at the intersection?
// What is the average number of vehicles that are waiting at the intersection?
//
// We will model the traffic lights as Events. We will have two events, one for the
// North-South street and another for the East-West Street.
//
// There are only two calls to an event: fire() and clear()
//
// We will model the traffic as one Entity, that will generate requests to cross the
// intersection. This entity will generate four exponential IID requests (for the
// vehicles in four directions).
//


let GREEN_TIME = 100
let MEAN_ARRIVAL = 10
let SIMTIME = 1000


let SIM = new Sim();
let TSX = TXG.TSXGraph.initBoard('jsxbox', { axis: true })


// create a class to hold state info for Events and Facilities.
class State {
    static trafficLights: Event[]
}



// an entity to control the traffic lights, periodically turns off lights in one
// direction and turns on the other.
class LightController extends Entity {
    currentLight = 0  // the light that is turned on currently

    constructor(name: string) {
        super(name)
    }

    start() {
        this.log(State.trafficLights[this.currentLight].name + " OFF"
            + ", " + State.trafficLights[1 - this.currentLight].name + " ON");

        // turn off the current light
        State.trafficLights[this.currentLight].clear();

        // turn on the other light.
        // Note the true parameter: the event must "sustain"
        State.trafficLights[1 - this.currentLight].fire(true);

        // update the currentLight variable
        this.currentLight = 1 - this.currentLight;

        // Repeat every GREEN_TIME interval
        this.setTimer(GREEN_TIME).done(()=>this.start());
    }
};



class Traffic extends Entity {
    constructor(name: string) {
        super(name)
    }

    start() {
        // start four generators
        this.generateTraffic("North", State.trafficLights[0]); // traffic for North -> South
        this.generateTraffic("South", State.trafficLights[0]); // traffic for South -> North
        this.generateTraffic("East",  State.trafficLights[1]); // traffic for East -> West
        this.generateTraffic("West",  State.trafficLights[1]); // traffic for West -> East
    }
    generateTraffic(direction: string, light: Event) {
        // STATS: record that vehicle as entered the intersection
        // stats.enter(sim.time());
        this.log("Arrive for " + direction);

        // wait on the light.
        // The done() function will be called when the event fires
        // (i.e. the light turns green).

        // this.waitEvent(light).done(() => {
            // let arrivedAt = this.callbackData;
            // STATS: record that vehicle has left the intersection
            // stats.leave(arrivedAt, sim.time());
            // sim.log("Leave for " + direction + " (arrived at " + arrivedAt.toFixed(6) + ")");
        // }).setData(sim.time());

        // Repeat for the next car. Call this function again.
        let nextArrivalAt = TSX.StatisticsMath.randomExponential(1.0 / MEAN_ARRIVAL);
        let ro = this.setTimer(nextArrivalAt).done(() => this.generateTraffic(direction, light));
    }
};



// create the two events that traffic will queue on
State.trafficLights = [
    new Event("North-South Light"),
    new Event("East-West Light")
];

// pass the light events to both the lightController and the Traffic generator
let lights = new LightController('LightController')
let traffic = new Traffic('traffic')

// create a Population object to monitor the statistics
let stats = new Population("Waiting at Intersection");



//    Uncomment to display logging information
//    sim.setLogger(function (str) {
//        document.write(str);
//    });

// simulate for SIMTIME time
SIM.simulate(SIMTIME);

console.log(stats.durationSeries.average(),
    stats.durationSeries.deviation(),
    stats.sizeSeries.average(),
    stats.sizeSeries.deviation());

