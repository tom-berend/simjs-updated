import { TinyQueue } from "./queue.js"
import { Request } from "./request.js"

export class Model {


    static simTime = 0   // static, only one since everyone inherits from this class

    static endTime: number
    static entityId: number


    // this is the function that logs, override it with setLogger()
    static logger: Function = (message: string) => console.log(`%c ${this.name}:  message`, "color:blue;background-color:white;")

    id: Symbol          // for classes that descends from Model, every instance is unique
    name: string
    entityType: 'Entity' | 'Buffer' | 'Store' | 'Facility'   // for logging
    static currentSim: Object | null  // nice if we can access this from entities,but must avoid circular

    static queue: TinyQueue   // every request is in this queue, might also be in other queues
        = new TinyQueue('Sim Queue', (a: Request, b: Request) => a.timestamp < b.timestamp)


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



}

