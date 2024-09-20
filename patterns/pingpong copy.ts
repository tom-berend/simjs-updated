import { Sim, Entity, Facility, Event } from '../src/sim.js'
import { Population } from '../src/stats.js'
import { TXG } from '../lib/tsxgraph.js'

// a message allows an entity to SEND something to another entitLy.  It is directed entity-to-entity communications.

// For example, imagine that your entity fires an artillary shell towards a target:
// Many things can happen to the shell on that voyage, but it may be too simple to be worth creating an
// entity for it.  It's likely just inventory.  Once you successfully 'fire' it, you might just sendMessage()
// to the game entity that it is moving and the game should take it over.

// but a drone might be more complicated requires a full entity to take over after launch.

let SIM = new Sim();

class Player extends Entity {
    playerColor: 'red' | 'blue'
    messageCount = 0
    opponent: Player | null   // we will find out

    constructor(name: string) {
        super(name)
    }

    async start() {
        // use this.log instead of SIM.log, so messages come from Jack and Jill, not 'SIM'
        this.log(`start() Player ${this.name}`)  // don't have a color yet

        // possibility that we are the opponent who doesn't yet know who to play
        if (this.opponent == null) {    // only Jill. Jack's opponent was set in init
            // simply check back in 10 seconds by rerunning start
            this.playerColor = 'red'
            this.log("in START but don't know who my opponent is.  Nothing to do.")
            // maybe set a warning timer just in case
            this.setTimer(60).done(() => { if (this.opponent == null) this.log("My opponent didn't show up.") })
        } else {
            this.playerColor = 'blue'
            // i'm here first, tell my opponent that they are playing against ME
            this.log(`in START, I'm first, and about to tell ${this.opponent.name} who I am.`, this.playerColor)
            let tellOpponent = () => (this.opponent).setOpponent((this))
            SIM.sendMessage(tellOpponent, 0, this.opponent);  //. send my info to opponent
        }
    }


    setOpponent(otherPlayer: Player) {
        this.log(`Player ${otherPlayer.name} has identified as my opponent`, 'orange')
        this.opponent = otherPlayer
        // start the game by hitting the first pingpong
        let newMessage = () => (this.opponent as Player).firePingPong('Starting the game ' + this.name);
        SIM.sendMessage(newMessage, 0, this.opponent);  //. send my info to opponent
    }


    firePingPong(message: string) {
        this.log(`onMessage() Player '${this.name}  receives something'`, this.playerColor)
        // Receive message, add own name and send back
        if (this.messageCount++ < 10) {
            let newMessage = () => (this.opponent as Player).firePingPong(this.messageCount.toString() + ' ' + this.name);
            SIM.sendMessage(newMessage, 10, this.opponent);  // 10 second hold?
        }
    }
};


let jack = new Player('Jack')
let jill = new Player('Jill')

// customize the entities
jack.opponent = jill;

// but jill doesn't know that jack is her opponent

SIM.simulate(1000, 10);






