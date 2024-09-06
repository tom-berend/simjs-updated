import test from 'ava';
import * as Sim from '../sim';

let entities = 0;
let finalized = 0;


test('testRequestZeroDelayTimeout', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.string = 'start';
    }

    start() {
      this.setTimer(0)
      .done(() => {
        this.string += '-second';
      });
      this.string += '-first';
    }

    finalize() {
      finalized++;
      t.is(this.string, 'start-first-second');
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestZeroDelayPutBuffer', (t) => {
  const sim = new Sim.Sim();

  const buffer = new Sim.Buffer('a', 100);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.string = 'start';
    }

    start() {
      this.putBuffer(buffer, 10)
      .done(() => {
        this.string += '-second';
      });
      this.string += '-first';
    }

    finalize() {
      finalized++;
      t.is(this.string, 'start-first-second');
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestZeroDelayEventWait', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.string = 'start';
    }

    start() {
      event.fire(true);

      this.waitEvent(event)
      .done(() => {
        this.string += '-second';
      });
      this.string += '-first';
    }

    finalize() {
      finalized++;
      t.is(this.string, 'start-first-second');
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestZeroDelayEventQueue', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.string = 'start';
    }

    start() {
      event.fire(true);

      this.queueEvent(event)
      .done(() => {
        this.string += '-second';
      });
      this.string += '-first';
    }

    finalize() {
      finalized++;
      t.is(this.string, 'start-first-second');
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestZeroDelayFacility', (t) => {
  const sim = new Sim.Sim();

  const fac = new Sim.Facility('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.string = 'start';
    }

    start() {
      this.useFacility(fac, 10)
      .done(() => {
        this.string += '-second';
      });
      this.string += '-first';
    }

    finalize() {
      finalized++;
      t.is(this.string, 'start-first-second');
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestCallbackData', (t) => {
  const sim = new Sim.Sim();

  const buffer = new Sim.Buffer('buffer', 100);

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(simInstance) {
      super(simInstance);
      this.count = 0;
    }

    start() {
      this.putBuffer(buffer, 10)
      .done(this.fn1, null, 1)
      .unlessEvent(event, this.fn2, null, 2)
      .waitUntil(10, this.fn1, null, 3)
      .setData('my data');

      this.putBuffer(buffer, 110)
      .done(this.fn1, null, 1)
      .waitUntil(10, this.fn2, null, 3)
      .setData('my data');

      this.putBuffer(buffer, 110)
      .done(this.fn1, this, 1)
      .unlessEvent(event, this.fn1, this, 2)
      .waitUntil(10, t.fail, this, 3)
      .setData('my data');

      this.setTimer(5).done(event.fire, event);

      // this.userData is undefined outside the callback functions
      t.is(typeof this.callbackData, 'undefined');
    }

    fn1(v) {
      if (this.time() === 0) {
        t.is(v, 1);
        t.is(typeof this.callbackMessage, 'undefined');
      } else {
        t.is(v, 2);
        t.is(this.callbackMessage, event);
      }
      t.is(this.callbackSource, buffer);
      t.is(this.callbackData, 'my data');
      this.count ++;
    }

    fn2(v) {
        // this.userData is visible in all callback functions
      t.is(v, 3);
      t.is(this.callbackSource, buffer);
      t.is(typeof this.callbackMessage, 'undefined');
      t.is(this.callbackData, 'my data');
      this.count ++;
    }

    finalize() {
      finalized++;
      t.is(this.count, 3);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestSetTimer', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      let clock = 1;

      // basic timers.. testing set data function
      this.setTimer(clock++).setData(1).done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 1);
        t.is(typeof d, 'undefined');
        this.count ++;
      });

      this.setTimer(clock++).done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 1);
        t.is(typeof d, 'undefined');
        this.count ++;
      }).setData(1);

      this.obj = { a: 1, b: 2 };
      this.setTimer(clock++).setData(this.obj).done((r, m, d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, this.obj);
        t.is(typeof d, 'undefined');
        this.count ++;
      });

      this.setTimer(clock++).setData('overwritten').done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'final');
        t.is(typeof d, 'undefined');
        this.count ++;
      }).setData('final');

      // testing callback argument data
      this.setTimer(clock++).setData('overwritten').done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'final');
        t.is(d, 101);
        this.count ++;
      }, null, 101).setData('final');

      this.setTimer(clock++).setData('overwritten').done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'final');
        t.is(typeof d, 'undefined');
        this.count ++;
      }, null).setData('final');

      this.setTimer(clock++).setData('overwritten').done((d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'final');
        t.is(d, this.obj);
        this.count ++;
      }, null, this.obj).setData('final');

      this.setTimer(clock++).setData('overwritten').done((d, e) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'final');
        t.is(d, 101);
        t.is(e, 102);
        this.count ++;
      }, null, [101, 102]).setData('final');

      // timers bailed out on event
      this.setTimer(clock++)
      .setData('event')
      .done(() => { t.fail(); })
      .unlessEvent(event, (d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(this.callbackMessage, event);
        t.is(this.callbackData, 'event');
        t.is(typeof d, 'undefined');
        this.count ++;
      });

      event.fire(true);

      this.setTimer(clock++)
      .setData('event')
      .done(() => { t.fail(); })
      .unlessEvent(event, (d) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(this.callbackMessage, event);
        t.is(this.callbackData, 'event');
        t.is(d, 101);
        this.count ++;
      }, null, 101);

      this.setTimer(clock++)
      .setData('event')
      .done(() => t.fail())
      .unlessEvent(event, (d, e) => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(this.callbackMessage, event);
        t.is(this.callbackData, 'event');
        t.is(d, 101);
        t.is(e, 102);
        this.count ++;
      }, null, [101, 102]);

    }
    finalize() {
      finalized++;
      t.is(this.count, 11);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

/*
test('testRequestPool', (t) => {
  const sim = new Sim.Sim();

  let pool = new Sim.Pool("pool", 100);

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      // simple alloc -- always succeeds
      this.allocPool(pool, 10).setData('abcd').done((d) => {
        t.is(this.callbackSource, pool);
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'abcd');
        t.is(d, 101);
        this.count ++;
        this.freePool(pool, 10);
      }, this, 101);

      this.allocPool(pool, 10).done((d, e) => {
        t.is(this.callbackSource, pool);
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'abcde');
        t.is(d, 101);
        t.is(e, 102);
        this.count ++;
        this.freePool(pool, 10);
      }, undefined, [101, 102]).setData('abcde');

      // alloc request times out
      this.allocPool(pool, 200).done(() => { t.fail(); })
      .waitUntil(1, (d) => {
        t.is(this.callbackSource, pool);
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, 'waituntil');
        t.is(d, 101);
        this.count ++;
      }, this, 101).setData("waituntil");

      // alloc request bails out on event
      this.allocPool(pool, 200).done(() => { t.fail(); })
      .unlessEvent(event, (d) => {
        t.is(this.callbackSource, pool);
        t.is(this.callbackMessage, event);
        t.is(this.callbackData, 'unlessevent');
        t.is(typeof d, 'undefined');
        this.count ++;
      }).setData("unlessevent");

      this.setTimer(1).done(event.fire, event);

      // alloc request is satisfied later by free request
      this.allocPool(pool, 50); // will be accepted

      this.allocPool(pool, 80)
      .setData('1234')
      .done((d) => {
        t.is(this.callbackSource, pool);
        t.is(typeof this.callbackMessage, 'undefined');
        t.is(this.callbackData, '1234');
        this.count ++;
        this.freePool(pool, 80);
      });

      this.setTimer(1).done(() => {this.freePool(pool, 50); });

      if (this.time() === 0) {
        this.setTimer(10).done(this.start);
      }

    }
    finalize() {
      finalized ++;
      t.is(pool.available, 100);
      t.is(this.count, 10);

    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities ++;
});
*/

test('testRequestBuffer', (t) => {
  const sim = new Sim.Sim();

  const buffer = new Sim.Buffer('buffer', 100);

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      // Basic put and get -- requests are immediately successful
      // put
      this.setTimer(10).done(() => {
        t.is(buffer.available, 0);
        this.putBuffer(buffer, 10)
        .setData('abcd')
        .done((d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcd');
          t.is(typeof d, 'undefined');
          this.count ++;  // 1
          this.getBuffer(buffer, 10);
          t.is(buffer.getQueue.size(), 0);
          t.is(buffer.putQueue.size(), 0);
        });
      });

      // put
      this.setTimer(20)
      .done(() => {
        t.is(buffer.available, 0);
        this.putBuffer(buffer, 10)
        .done((d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcde');
          t.is(d, 101);
          this.count ++;  // 2
          this.getBuffer(buffer, 10);
          t.is(buffer.getQueue.size(), 0);
          t.is(buffer.putQueue.size(), 0);
        }, this, 101).setData('abcde');
      });

      // get
      this.setTimer(30).done(this.putBuffer, this, [buffer, 10]);

      this.setTimer(31).done(() => {
        t.is(buffer.available, 10);
        this.getBuffer(buffer, 10)
        .setData('abcd')
        .done((d, e) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcd');
          t.is(d, 101);
          t.is(e, 102);
          this.count ++;  // 3
          t.is(buffer.getQueue.size(), 0);
          t.is(buffer.putQueue.size(), 0);
        }, false, [101, 102]);
      });

      // get
      this.setTimer(40).done(this.putBuffer, this, [buffer, 10]);

      this.setTimer(41).done(() => {
        t.is(buffer.available, 10);
        this.getBuffer(buffer, 10)
        .done((d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcde');
          t.is(typeof d, 'undefined');
          this.count ++;  // 4
          t.is(buffer.getQueue.size(), 0);
          t.is(buffer.putQueue.size(), 0);
        }).setData('abcde');
      });

      // Put and get requests are timed out
      this.setTimer(50).done(() => {
        t.is(buffer.available, 0);
        this.getBuffer(buffer, 10)
        .done(() => { t.fail(); })
        .waitUntil(1, (d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcde');
          t.is(typeof d, 'undefined');
          this.count ++;  // 5
          t.is(buffer.available, 0);
          t.is(buffer.getQueue.size(), 0);
          t.is(buffer.putQueue.size(), 0);
        })
        .setData('abcde');
      });

      this.setTimer(60).done(() => {
        t.is(buffer.available, 0);
        this.putBuffer(buffer, 1000)
        .done(() => { t.fail(); })
        .waitUntil(1, (d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, 'abcde');
          t.is(typeof d, 'undefined');
          this.count ++;  // 6
          t.is(buffer.available, 0);
        })
        .setData('abcde');
      });

      // put and get requests are bailed out on event
      this.setTimer(70).done(() => {
        t.is(buffer.available, 0);
        event.clear();
        this.getBuffer(buffer, 10)
        .done(() => { t.fail(); })
        .unlessEvent(event, (d) => {
          t.is(this.callbackSource, buffer);
          t.is(this.callbackMessage, event);
          t.is(this.callbackData, 'abcde');
          t.is(typeof d, 'undefined');
          this.count ++;  // 7
          t.is(this.time(), 71);
          t.is(buffer.available, 0);
        })
        .setData('abcde');
      });
      this.setTimer(71).done(() => { event.fire(); });

      this.setTimer(80).done(() => {
        t.is(buffer.available, 0);
        event.clear();
        this.putBuffer(buffer, 1000)
        .done(() => { t.fail(); })
        .unlessEvent(event, (d) => {
          t.is(this.callbackSource, buffer);
          t.is(this.callbackMessage, event);
          t.is(this.callbackData, 'abcde');
          t.is(typeof d, 'undefined');
          this.count ++;  // 8
          t.is(this.time(), 81);
          t.is(buffer.available, 0);
        })
        .setData('abcde');
      });
      this.setTimer(81).done(event.fire, event);

      // put request is satisfied later by get
      this.setTimer(90).done(() => {
        t.is(buffer.available, 0);
        this.putBuffer(buffer, 80);
        t.is(buffer.available, 80);
      });
      this.setTimer(91).done(() => {
        t.is(buffer.available, 80);
        this.putBuffer(buffer, 50)
        .done((d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, '1234');
          t.is(typeof d, 'undefined');
          this.count ++;
          t.is(this.time(), 92);
          this.getBuffer(buffer, 50);
        }, this)
        .setData('1234');
      });
      this.setTimer(92).done(() => {
        t.is(buffer.available, 80);
        this.getBuffer(buffer, 80);
      });

      // get request is satisfied later by put
      this.setTimer(100).done(() => {
        t.is(buffer.available, 0);
        this.getBuffer(buffer, 50)
        .done((d) => {
          t.is(this.callbackSource, buffer);
          t.is(typeof this.callbackMessage, 'undefined');
          t.is(this.callbackData, '4321');
          t.is(typeof d, 'undefined');
          this.count ++;
          t.is(this.time(), 101);
        })
        .setData('4321');
      });
      this.setTimer(101).done(this.putBuffer, this, [buffer, 50]);

    }
    finalize() {
      finalized++;
      t.is(buffer.available, 0);
      t.is(this.count, 10);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(300);
  entities++;
});


test('testRequestEvents', (t) => {
  const sim = new Sim.Sim();

  const event1 = new Sim.Event('event1');

  const event2 = new Sim.Event('event2');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.setTimer(10)
      .done(t.fail)
      .unlessEvent([event1, event2], () => {
        t.is(typeof this.callbackSource, 'undefined');
        t.is(this.callbackMessage, event1);
        t.is(typeof this.callbackData, 'undefined');
        this.count ++;
      });

      this.setTimer(15).done(() => {
        this.waitEvent(event1).done(t.fail)
        .unlessEvent(event2, (d) => {
          t.is(this.callbackSource, event1);
          t.is(this.callbackMessage, event2);
          t.is(this.callbackData, 'abcd');
          t.is(d, 101);
          this.count ++;
        }, this, 101)
        .setData('abcd');
      });

      this.setTimer(5).done(event1.fire, event1);
      this.setTimer(20).done(event2.fire, event2);

    }
    finalize() {
      finalized++;
      t.is(this.count, 2);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testRequestEventRepeat', (t) => {
  const sim = new Sim.Sim();

  const event1 = new Sim.Event('event1');

  const event2 = new Sim.Event('event2');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.setTimer(10)
      .done(t.fail)
      .unlessEvent([event1, event2], this.inc)
      .unlessEvent([event1, event2], this.inc);


      this.setTimer(5).done(event1.fire, event1);
    }
    inc() { this.count++; }
    finalize() {
      finalized++;
      t.is(this.count, 1);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});


test('testRequestCancel', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('event1');

  const fac = new Sim.Facility('facility');

  const buffer = new Sim.Buffer('a', 100);

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      const ro1 = this.setTimer(50)

        .done(t.fail)
        .waitUntil(20, t.fail)
        .unlessEvent(event, t.fail);

      const ro2 = this.waitEvent(event)

      .done(t.fail)
      .waitUntil(20, t.fail)
      .unlessEvent(event, t.fail);

      const ro3 = this.putBuffer(buffer, 110)

      .done(t.fail)
      .waitUntil(20, t.fail)
      .unlessEvent(event, t.fail);


      this.useFacility(fac, 20);

      const ro4 = this.useFacility(fac, 10)

      .done(t.fail)
      .waitUntil(20, t.fail)
      .unlessEvent(event, t.fail);

      const ro5 = this.getBuffer(buffer, 110)

      .done(t.fail)
      .waitUntil(20, t.fail)
      .unlessEvent(event, t.fail);

      this.setTimer(10).done(ro1.cancel, ro1);
      this.setTimer(10).done(ro2.cancel, ro2);
      this.setTimer(10).done(ro3.cancel, ro3);
      this.setTimer(10).done(ro4.cancel, ro4);
      this.setTimer(10).done(ro5.cancel, ro5);
    }
    finalize() {
      finalized++;
      t.is(this.count, 0);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

// unlessEvent(e1).unlessEvent(e1)
// unlessEvent([e1, e1])
