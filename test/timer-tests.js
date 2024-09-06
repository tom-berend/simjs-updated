import test from 'ava';

import * as Sim from '../sim';

import 'babel-core/register';
let finalized = 0;

test('testTimerPlain', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(10).done(this.onTimeout);
    }
    onTimeout() {
      this.count = 1;
      t.is(this.time(), 10);
    }
    finalize() {
      t.is(this.count, 1);
      t.is(this.time(), 10);
      finalized++;
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerCustomDone', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(10).done(this.onTimeout);
    }
    onTimeout() {
      this.count = 1;
      t.is(this.time(), 10);
    }
    finalize() {
      t.is(this.count, 1);
      t.is(this.time(), 10);
      finalized++;
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerCustomDoneInline', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(10).done(() => {
        t.is(this.time(), 10);
        this.count = 1;
      });
    }
    finalize() {
      t.is(this.count, 1);
      t.is(this.time(), 10);
      finalized++;
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerRecursive', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      t.is(this.time(), 10 * this.count);
      this.count ++;
      this.setTimer(10).done(this.start);
    }
    finalize() {
      t.is(this.count, 11);
      t.is(this.time(), 100);
      finalized++;
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerNoEvent', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {} // eslint-disable-line no-empty-function
    finalize() {
      finalized++;
      t.is(this.time(), 0);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerZero', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(0).done(() => {
        t.is(this.time(), 0);
      });
    }
    finalize() {
      finalized++;
      t.is(this.time(), 0);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});


test('testTimerTimeout1', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(10)
      .done(() => {
        t.fail();
      })
      .waitUntil(5, () => {
        t.is(this.time(), 5);
        this.count = 1;
      });
    }
    finalize() {
      finalized++;
      t.is(this.time(), 10);
      t.is(this.count, 1);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerTimeout2', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(10)
      .done(() => {
        t.is(this.time(), 10);
        this.count = 1;
      })
      .waitUntil(20, () => {
        t.fail();
      });
    }
    finalize() {
      finalized++;
      t.is(this.count, 1);
      t.is(this.time(), 20);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerMultipleTimeouts', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(50)
      .done(() => {
        t.fail();
      })
      .waitUntil(20, () => {
        t.fail();
      })
      .waitUntil(10, () => {
        t.is(this.time(), 10);
        this.count = 1;
      });

    }
    finalize() {
      finalized++;
      t.is(this.count, 1);
      t.is(this.time(), 50);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testTimerWaitEvent', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event();

  class MyEntity extends Sim.Entity {
    start() {
      this.setTimer(50)
      .done(() => {
        t.fail();
      })
      .unlessEvent(event, () => {
        t.is(this.time(), 10);
        this.count = 1;
      });

      this.setTimer(10).done(() => {
        event.fire();
      });

    }
    finalize() {
      finalized++;
      t.is(this.count, 1);
      t.is(this.time(), 50);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

