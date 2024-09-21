import { Sim, Entity } from '../src/sim.js';
// a message allows an entity to SEND something to another entitLy.  It is directed entity-to-entity communications.
// For example, imagine that your entity fires an artillary shell towards a target:
// Many things can happen to the shell on that voyage, but it may be too simple to be worth creating an
// entity for it.  It's likely just inventory.  Once you successfully 'fire' it, you might just sendMessage()
// to the game entity that it is moving and the game should take it over.
// but a drone might be more complicated requires a full entity to take over after launch.
let SIM = new Sim();
class Player extends Entity {
    async start() {
        await SIM.setTimer(1);
        // use this.log instead of SIM.log, so messages come from Jack and Jill, not 'SIM'
        this.log(`start() Player ${this.name}`); // don't have a color yet
        await SIM.setTimer(3);
        this.log(`waited 5 Player ${this.name}`); // don't have a color yet
        await SIM.setTimer(3);
        this.log(`waited 5 Player ${this.name}`); // don't have a color yet
    }
}
let jack = new Player('Jack');
SIM.simulate(1000, 10);
//# sourceMappingURL=timers.js.map