import { Sim, Entity, Facility, Event } from '../src/sim.js'
import { Population } from '../src/stats.js'
import { TXG } from '../lib/tsxgraph.js'


let sim = new Sim();

class Player extends Entity {
    e1: Event
    e2: Event

    constructor(name: string) {
        super(name)
    }

    start() {
        this.log(`start() Player '${this.name}'`)
        // in 10 seconds  queue the event, in 20 seconds fire it
        this.setTimer(10).done(()=>this.setE1())
        this.setTimer(20).done(()=>this.tripE1())
    }

    setE1(){
        this.log(`setE1() Player '${this.name}'`)
        this.waitEvent(this.e1).done(()=>this.e1Fired)
    }

    tripE1(){
        this.log(`tripE1() Player '${this.name}'`)
        this.e1.fire()
    }

    e1Fired() {
        this.log('e1Fired()')
    }
};


let jack = new Player('Jack')
sim.addEntity(jack)

let event1 = new Event('testEvent')
jack.e1 = event1      // make them available to jack


sim.simulate();






