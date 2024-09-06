import { Sim, Entity, Event } from './src/sim.js';
import { Population } from './src/stats.js';
import { TXG } from './lib/tsxgraph.js';
// class Player extends Entity {
//     firstServer = false
//     messageCount = 0
//     constructor(name: string) {
//         super(name)
//     }
//     opponent: Entity | null = null   // we will find out
//     /** start of player entity */
//     start() {
//         Debug.debug(1, `start() Player '${this.name} ${this.firstServer}'`)
//         if (this.firstServer) {
//             // Send the string to other player with delay = 0.
//             if (this.opponent !== null) {
//                 this.sendMessage("INITIAL", 0, [this.opponent], this);
//             } else {
//                 throw ("I'm the first server, but unknown opponent")
//             }
//         }
//     }
//     onMessage(sender: Entity, message: any) {
//         Debug.debug(1, `start() Player '${this.name} ${this.firstServer}'`)
//         // Receive message, add own name and send back
//         let newMessage = `message ${this.messageCount}  this.name`;
//         Debug.debug(1,newMessage,'blue')
//         if (this.messageCount++ < 10)
//             this.sendMessage(newMessage, 10, [sender], this);  // 10 second hold?
//     }
// };
// let sim = new Sim();
// let jack = new Player('Jack')
// sim.addEntity(jack)
// let jill = new Player('Jill')
// sim.addEntity(jill)
// jack.firstServer = true;
// jack.opponent = jill;
// sim.simulate();
// What is average duration that vehicles have to wait at the intersection?
// What is the average number of vehicles that are waiting at the intersection?
let GREEN_TIME = 100;
let MEAN_ARRIVAL = 10;
let SIMTIME = 1000;
let sim = new Sim();
let TSX = TXG.TSXGraph.initBoard('jsxbox', { axis: true });
let trafficLights = [
    new Event("North-South Light"),
    new Event("East-West Light")
];
let stats = new Population("Waiting at Intersection");
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
        var nextArrivalAt = TSX.StatisticsMath.randomExponential(1.0 / MEAN_ARRIVAL);
        this.setTimer(nextArrivalAt).done(() => this.generateTraffic(direction, light));
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
//# sourceMappingURL=simulation.js.map