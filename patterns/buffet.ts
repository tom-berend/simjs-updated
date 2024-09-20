import { Sim, Entity, Facility, Event, BufferPool } from '../src/sim.js'
import { Population, TimeSeries } from '../src/stats.js'
import { TXG } from '../lib/tsxgraph.js'



let SIM = new Sim();
let TSX = TXG.TSXGraph.initBoard('jsxbox', { boundingbox: [-20, 50, 1050, -10], axis: true })

const BuffetCapacity = 5  // it is a constant global
const PreparationTime = 20
const MeanArrival = 20
const CashierTime = 10
const nServers = 2

// create a class to hold state info for Events and Facilities.
class State {
    static buffet = new BufferPool('Buffet', BuffetCapacity)   // 'Buffer' is used by Node.js, so 'BufferPool'
    static cashier = new Facility('cashier', "LCFS", nServers)
    static stats = new Population('Buffet')
}


class Customer extends Entity {

    start() {
        this.log('starting customer')
        this.order();   // order process

        let nextCustomerAt = TSX.StatisticsMath.randomExponential(1.0 / MeanArrival);
        this.setTimer(nextCustomerAt).done(this.start);
    }

    order() {
        this.log("Customer ENTER");
        // stats.enter(this.time());

        // wait for an empty spot at the buffet
        this.getBuffer(State.buffet, 1).done(() => {

            // we have gathered and eaten in zero time, now we have to pay
            SIM.log("Customer at CASHIER")

            let serviceTime = TSX.StatisticsMath.randomExponential(1.0 / CashierTime);
            this.useFacility(State.cashier, 'FIFO', serviceTime).done(() => {
                SIM.log("Customer LEAVE at ")//  + this.time() + " (entered at " + this.callbackData + ")");

            })

            // stats.leave(this.callbackData, this.time());
            //     }).setData(this.callbackData);
            // }).setData(this.time());
        })
    }
}

class Chef extends Entity {

    start() {
        // fill the buffet to capacity, wait PrepTime, fill to capacity again
        this.putBuffer(State.buffet, BuffetCapacity - State.buffet.current());
        this.setTimer(PreparationTime).done(this.start);
    }
}

new Customer('Customer');
new Chef('Chef')

//  Uncomment these line to display logging information
//    sim.setLogger(function (msg) {
//        document.write(msg);
//    });

SIM.simulate(1000);

//return [
// State.stats.durationSeries.average(),
// State.stats.durationSeries.deviation(),
// State.stats.sizeSeries.average(),
// State.stats.sizeSeries.deviation()
// ];
