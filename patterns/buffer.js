import { Sim, Entity, BufferPool } from '../src/sim.js';
let SIM = new Sim();
/** Attempt to store amount number of the tokens in buffer, returning a Request. Here's
 * an example of a producer making widgets, who only starts the next when the buffer has space
 * for the current.
*/
const timeToProduce = 10;
const timeToConsume = 6;
class State {
    static buffer = new BufferPool('buffer', 20); // can't use type 'Buffer' because conflicts with Node.js
}
// a producer adding to the buffer (waiting if the buffer is full)
class Producer extends Entity {
    start() {
        this.log('starting producer');
        this.setTimer(timeToProduce).done(() => {
            // Timer expires => item is ready to be stored in buffer.
            // When the item is successfully stored in buffer, we repeat
            //     the process by recursively calling the same function.
            this.putBuffer(State.buffer, 1).done(() => this.start());
        });
    }
}
//` Attempt to retrieve amount number of tokens from buffer, returning a Request.  Here's
// an example of a consumer waiting for tokens.//
//
// a consumer pulling from the buffer (waiting if the buffer is empty)
class Consumer extends Entity {
    start() {
        this.log('starting consumer');
        // Retrieve one token from buffer
        this.getBuffer(State.buffer, 1).done(() => {
            // After an item has been retrieved, wait for some time
            //   to model the consumption time.
            // After the waiting period is over, we repeat by
            //   recursively calling this same function.
            this.setTimer(timeToConsume).done(() => this.start());
        });
    }
}
// setup two consumers and one producer
new Consumer('Consumer #1');
new Consumer('Consumer #2');
new Producer('Producer');
SIM.simulate(1000); // run for 1000 seconds
//# sourceMappingURL=buffer.js.map