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
                sim.sendMessage(this, 0, this.opponent,'onMessage');  //. send my info to opponent
            } else {
                throw ("I'm the first server, but unknown opponent")
            }
        }
    }

    onMessage(sender: Entity, message: any) {
        this.log(`onMessage() Player '${this.name} '`,'color:red;',message)
        // Receive message, add own name and send back

        if(typeof message == 'object'){   // they told me who they were
            this.opponent = message
            sim.log(`${this.name} opponent is ${this.opponent.name}`,'orange')
        }

        let newMessage = `message ${this.messageCount}  this.name`;
        // use this.log instead of sim.log, so this player properly identified
        this.log(newMessage,this.firstServer?'red':'blue','yellow')
        if (this.messageCount++ < 10)
            sim.sendMessage(newMessage, 10, this.opponent,'onMessage');  // 10 second hold?

    }
};


let jack = sim.addEntity(new Player('Jack')) as Player
let jill = sim.addEntity(new Player('Jill')) as Player

jack.firstServer = true;
jack.opponent = jill;

sim.simulate();






