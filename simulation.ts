import { Sim, Entity, Facility } from './src/lib/sim.js'

class Player extends Entity {
    constructor(name:string) {
        super(name)
    }

    firstServer = false
    opponent: Entity | null = null   // we will find out

    /** start of player entity */
    start() {
        if (this.firstServer) {
            // Send the string to other player with delay = 0.
            if (this.opponent !== null) {
                this.send("INITIAL", 0, this.opponent);
            } else {
                throw ("I'm the first server, but unknown opponent")
            }
        }
    }

    onMessage(sender: Entity, message: any) {
        // Receive message, add own name and send back
        let newMessage = message + this.name;
        this.send(newMessage, 10, sender);  // 10 second hold?
    }
};

let sim = new Sim();

let jack = new Player('Jack')
// sim.addEntity(jack)
let jill = new Player('Jill')
// sim.addEntity(jill)

// jack.name = "Jack";
// jill.name = "Jill";

jack.firstServer = true;
jack.opponent = jill;

sim.simulate();
