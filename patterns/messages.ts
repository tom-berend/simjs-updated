import { Sim, Entity, Facility, Event } from '../src/sim.js'
import { Population } from '../src/stats.js'
import { TXG } from '../lib/tsxgraph.js'


let sim = new Sim();

class Player extends Entity {
    firstServer = false
    messageCount = 0
    opponent: Entity | null   // we will find out

    constructor(name: string) {
        super(name)
    }

    start()  {
        this.log(`start() Player '${this.name} ${this.firstServer}'`)
        if (this.firstServer) {
            // Both players send our object to other player with delay = 0.
            if (this.opponent !== null) {
                sim.sendMessage(()=>(this.opponent as Player).onMessage(this), 0, this.opponent);  //. send my info to opponent
            } else {
                throw ("I'm the first server, but unknown opponent")
            }
        }
    }

    onMessage(message: any) {
        this.log(`onMessage() Player '${this.name}  receives something'`,this.firstServer?'red':'blue','yellow')
        // Receive message, add own name and send back

        if(typeof message == 'object'){   // they told me who they were
            this.opponent = message
            sim.log(`${this.name} opponent is ${this.opponent.name}`,'orange')
        }

        if (this.messageCount++ < 10){
            let newMessage = ()=>(this.opponent as Player).onMessage(this.messageCount.toString()+' '+this.name);
            sim.sendMessage(newMessage, 10, this.opponent);  // 10 second hold?
        }
    }
};


let jack = new Player('Jack')
sim.addEntity(jack)

let jill = new Player('Jill')
sim.addEntity(jill)

jack.firstServer = true;
jack.opponent = jill;

sim.simulate();






