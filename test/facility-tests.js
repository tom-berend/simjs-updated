import test from 'ava';
import * as Sim from '../sim';

let finalized = 0;

test('testFacilityFCFSOneServer', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('facility', Sim.FCFS, 1);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      // at time 0 => [0, 10]
      // at time 0 => [10, 20]
      // at time 4 => [20, 30]
      // at time 40 => [40, 50]
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        t.is(this.callbackSource, fac);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 20);
        t.is(this.callbackSource, fac);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 30);
          t.is(this.callbackSource, fac);
          t.is(this.callbackMessage, 0);
          this.count ++;
        });
      });

      this.setTimer(40).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 50);
          t.is(this.callbackSource, fac);
          t.is(this.callbackMessage, 0);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 50);
      t.is(this.count, 4);
      t.is(fac.usage(), 40);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityFCFSOOneServerTwoEntities', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('facility');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start(first) {
      // entity 1, at time 0: [0, 10]
      // entity 2, at time 0: [10, 20]
      // entity 1, at time 4: [20, 30]
      // entity 2, at time 4: [30, 40]
      // entity 1, at time 50: [50, 60]
      // entity 2, at time 70: [70, 80]
      if (first) {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 10);
          this.count ++;
        });
        this.setTimer(4).done(() => {
          this.useFacility(fac, 10).done(() => {
            t.is(this.time(), 30);
            this.count ++;
          });
        });
        this.setTimer(50).done(() => {
          this.useFacility(fac, 10).done(() => {
            t.is(this.time(), 60);
            this.count ++;
          });
        });

      } else {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 20);
          this.count ++;
        });

        this.setTimer(4).done(() => {
          this.useFacility(fac, 10).done(() => {
            t.is(this.time(), 40);
            this.count ++;
          });
        });

        this.setTimer(70).done(() => {
          this.useFacility(fac, 10).done(() => {
            t.is(this.time(), 80);
            this.count ++;
          });
        });
      }

    }
    finalize() {
      finalized++;
      t.is(this.time(), 80);
      t.is(this.count, 3);
    }
  }

  sim.addEntity(MyEntity, null, true);
  sim.addEntity(MyEntity, null, false);
  sim.simulate(100);
});

test('testFacilityFCFSTwoServers', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('facility', Sim.FCFS, 2);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      // at time 0: [0, 10] at server 0
      // at time 0: [0, 10] at server 1
      // at time 0: [10, 20] at server 0
      // at time 14: [14, 24] at server 1
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        t.is(this.callbackSource, fac);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        t.is(this.callbackSource, fac);
        t.is(this.callbackMessage, 1);
        this.count ++;
      });

      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 20);
        t.is(this.callbackSource, fac);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.setTimer(14).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 24);
          t.is(this.callbackSource, fac);
          t.is(this.callbackMessage, 1);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 24);
      t.is(this.count, 4);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});


test('testFacilityFCFSDrop0', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('fcfs', Sim.Facility.FCFS, 1, 0);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 4);
          t.is(this.callbackMessage, -1);
          this.count ++;
        });
      });

      this.setTimer(16).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 26);
          t.is(this.callbackMessage, 0);
          this.count ++;
        });
      });
    }

    finalize() {
      finalized++;
      t.is(this.time(), 26);
      t.is(this.count, 3);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityFCFSDrop1', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('fcfs', Sim.Facility.FCFS, 1, 1);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        t.is(this.callbackMessage, 0);
        this.count ++;
      });

      this.setTimer(1).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 20);
          t.is(this.callbackMessage, 0);
          this.count ++;
        });
      });

      this.setTimer(2).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 2);
          t.is(this.callbackMessage, -1);
          this.count ++;
        });
      });

      this.setTimer(26).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 36);
          t.is(this.callbackMessage, 0);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 36);
      t.is(this.count, 4);
      t.is(fac.usage(), 30);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityLCFSSimple', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 20);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 14);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 20);
      t.is(this.count, 2);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});


test('testFacilityLCFSPreemptTwice', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 30);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 14);
          this.count ++;
        });
      });

      this.setTimer(16).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 26);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 30);
      t.is(this.count, 3);
      t.is(fac.usage(), 30);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityLCFSPreemptTwoLevel', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 30);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 24);
          this.count ++;
        });
      });

      this.setTimer(6).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 16);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 30);
      t.is(this.count, 3);
      t.is(fac.usage(), 30);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityTimeoutDuringUsage', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.FCFS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.fail();
        })
        .waitUntil(4, () => {
          t.is(this.time(), 8);
          this.count ++;
        });
      });

      this.setTimer(6).done(() => {
        this.useFacility(fac, 10).done(() => {
          t.is(this.time(), 20);
          this.count ++;
        })
        .waitUntil(5, () => {
          t.fail();
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 20);
      t.is(this.count, 3);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityCancelDuringUsage', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.FCFS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.ro = this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        this.count ++;
      });

      this.ro2 = this.useFacility(fac, 10).done(t.fail);
      this.setTimer(2).done(this.ro2.cancel, this.ro2);

      this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 20);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.ro.cancel();
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 20);
      t.is(this.count, 2);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityLCFSImmuneToRenege', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.LCFS);

  const event = new Sim.Event('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.ro = this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 10);
        this.count ++;
      })
      .waitUntil(1, t.fail)
      .unlessEvent(event, t.fail);

      event.fire(true);

      this.setTimer(4).done(() => {
        this.ro.cancel();
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 10);
      t.is(this.count, 1);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSOne', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 10);
        this.count ++;
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 10);
      t.is(this.count, 1);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTwoIdentical', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 20);
        this.count ++;
      });
      this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 20);
        this.count ++;
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 20);
      t.is(this.count, 2);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTwoIdenticalLater', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.setTimer(10).done(() => {
        this.useFacility(fac, 10)
        .done(() => {
          t.is(this.time(), 30);
          this.count ++;
        });
      });

      this.setTimer(10).done(() => {
        this.useFacility(fac, 10)
        .done(() => {
          t.is(this.time(), 30);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 30);
      t.is(this.count, 2);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTwoOverlapPartial', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.setTimer(10).done(() => {
        this.useFacility(fac, 10)
        .done(() => {
          t.is(this.time(), 25);
          this.count ++;
        });
      });

      this.setTimer(15).done(() => {
        this.useFacility(fac, 10)
        .done(() => {
          t.is(this.time(), 30);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 35);
      t.is(this.count, 2);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTwoOverlapFull', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.setTimer(10).done(() => {
        this.useFacility(fac, 20)
        .done(() => {
          t.is(this.time(), 35);
          this.count ++;
        });
      });

      this.setTimer(15).done(() => {
        this.useFacility(fac, 5)
        .done(() => {
          t.is(this.time(), 25);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 45);
      t.is(this.count, 2);
      t.is(fac.usage(), 25);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTwoNoOverlap', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {

      this.setTimer(0).done(() => {
        this.useFacility(fac, 1)
        .done(() => {
          t.is(this.time(), 1);
          this.count ++;
        });
      });
      this.setTimer(1).done(() => {
        this.useFacility(fac, 1)
        .done(() => {
          t.is(this.time(), 2);
          this.count ++;
        });
      });


    }
    finalize() {
      finalized++;
      t.is(this.time(), 3);
      t.is(this.count, 2);
      t.is(fac.usage(), 2);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTenNoOverlap', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      for (let i = 0; i < 10; i++) {

        this.setTimer(i).done(() => {

          this.useFacility(fac, 1)
          .done((j) => {
            t.is(this.time(), j);
            this.count ++;
          }, null, this.callbackData);
        }).setData(i + 1);
      }

    }
    finalize() {
      finalized++;
      t.is(this.time(), 11);
      t.is(this.count, 10);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTenSmall', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 20);
        this.count ++;
      });


      for (let i = 0; i < 10; i++) {

        this.setTimer(2 * i).done(() => {

          this.useFacility(fac, 1)
          .done((j) => {
            t.is(this.time(), j);
            this.count ++;
          }, null, this.callbackData);
        }).setData(2 * i + 2);
      }

    }
    finalize() {
      finalized++;
      t.is(this.count, 11);
      t.is(fac.usage(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSTen', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {

      for (let i = 0; i < 10; i++) {

        this.useFacility(fac, 1)
        .done(() => {
          t.is(this.time(), 10);
          this.count ++;
        });
      }

    }
    finalize() {
      finalized++;
      t.is(this.count, 10);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSRampUpDown', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {

      this.setTimer(0).done(() => {
        this.useFacility(fac, 4)
        .done(() => {
          t.is(this.time(), 7);
          this.count ++;
        });
      });

      this.setTimer(1).done(() => {
        this.useFacility(fac, 2)
        .done(() => {
          t.is(this.time(), 6);
          this.count ++;
        });
      });

      this.setTimer(2).done(() => {
        this.useFacility(fac, 1)
        .done(() => {
          t.is(this.time(), 5);
          this.count ++;
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.count, 3);
      t.is(fac.usage(), 7);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSImmuneToRenege', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  const event = new Sim.Event('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.ro = this.useFacility(fac, 10)
      .done(() => {
        t.is(this.time(), 10);
        this.count ++;
      })
      .waitUntil(1, t.fail)
      .unlessEvent(event, t.fail);

      event.fire(true);

      this.setTimer(4).done(() => {
        this.ro.cancel();
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 10);
      t.is(this.count, 1);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSCancelDuringUsage', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('simple', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.ro = this.useFacility(fac, 10).done(() => {
        t.is(this.time(), 10);
        this.count ++;
      });

      this.setTimer(4).done(() => {
        this.ro.cancel();
      });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 10);
      t.is(this.count, 1);
      t.is(fac.usage(), 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});


test('testFacilityPSDocExample', (t) => {
  const sim = new Sim.Sim();

  const network = new Sim.Facility('Network Cable', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      // make request at time 0, to use network for 10 sec
      this.useFacility(network, 10).done(() => {
        this.count++;
        t.is(this.time(), 11);
      });

      // make request at time 5, to use the network for 1 sec
      this.setTimer(5).done(() => {
        this.useFacility(network, 1).done(() => {
          this.count++;
          t.is(this.time(), 7);
        });
      });
    }
    finalize() {
      finalized++;
      t.is(this.time(), 15);
      t.is(this.count, 2);
      t.is(network.usage(), 11);
    }
  }


  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testFacilityPSNested', (t) => {
  const sim = new Sim.Sim();

  const network = new Sim.Facility('abcd', Sim.Facility.PS);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      this.useFacility(network, 1).done(() => {
        this.count ++;
        t.is(this.time(), 1);
        this.useFacility(network, 1).done(() => {
          this.count++;
          t.is(this.time(), 2);
        });
      });
    }
    finalize() {
      finalized++;
      t.is(this.count, 2);
      t.is(this.time(), 2);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});
