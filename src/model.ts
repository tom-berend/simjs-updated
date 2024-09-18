import { Queue } from "./queue.js"
import { Request } from "./request.js"

export class Model {


    static simTime = 0   // static, only one since everyone inherits from this class
    static endTime: number

    static currentSim: Object | null   // allows us to access SIM from entities, but avoid circular ref
    static allEntities: Object[] = []  // allows entities to see each other if necessary
    // eg: microsimulations like airline seating.  passengers needs to interact with the
    // passengers around them as they jostle towardds their seats. Not enough just to queue.
    // https://en.wikipedia.org/wiki/Microsimulation

    static queue: Queue = new Queue('Sim Queue')      // every request object is in this queue

    // this is the function that logs, override it with setLogger()
    static logger: Function = (message: string) => console.log(`%c ${this.name}:  message`, "color:blue;background-color:white;")


    id: Symbol          // for classes that descends from Model, every instance is unique
    name: string
    entityType: 'Entity' | 'Buffer' | 'Store' | 'Facility'   // for logging


    // each entity can set its own rules for debugging
    debugLevel: number = 3    // 0=none, 1=Creation 2=Imporant 3=all
    debugTrace: boolean = false

    constructor(name: string) {
        this.name = name
        this.id = Symbol()

    }

    // time(): number {
    //     return Model.simTime;
    // }

    /** override the logger function */
    setLogger(logger: Function) {
        Model.logger = logger;
    }

    log(message: any, colour: string = 'white', backgroundColor: string = 'black') {   // all entities, facilities, etc  are descended from sim
        if (!Model.logger) return
        if (!(colour == 'white' && backgroundColor == 'black)')) backgroundColor = 'lightgrey'  // if entity sets color, then default to white background
        let entityMsg = '';
        let colorScheme = "color:" + colour + ";background-color:" + backgroundColor + ";"
        console.log(`%c ${this.name}: ${Model.simTime.toFixed(2)}  ${message}`, colorScheme);
    }

    /** debug message for Entities, Facilities, stuff that inherits from SIM */
    debug(level: number, message: string, color: string = 'white') {
        if (this.debugLevel >= level) {

            if (this.debugTrace)
                console.trace('%c' + message, "color:" + color + ";background:'white';")
            else
                console.log('%c' + message, `color:'${color}';background:'white';`)

        }
    }

    /** useful for debugging simulations, also helps document them. */
    assertTrue(condition: boolean, message: string) {
        if (!condition) {
            this.log(message, 'red', 'white');
        }
    }



}

