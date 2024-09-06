import test from 'ava';
import * as Sim from '../sim';

import 'babel-core/register';
let entities = 0;
let finalized = 0;

test('testStorePut', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(3, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 1 }).done(() => {
        t.fail();
      });


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

test('testStoreGet', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(3, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 10 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 0);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 0);
        this.count++;
        t.is(this.callbackMessage.a, 10);
      });

      this.getStore(store).done(t.fail);

    }
    finalize() {
      finalized++;
      t.is(this.count, 4);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetFilter', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(3, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 10 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.getStore(store, (obj) => { return obj.a === 10; }).done(() => {
        t.is(this.time(), 0);
        this.count++;
        t.is(this.callbackMessage.a, 10);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 0);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.getStore(store).done(t.fail);

    }
    finalize() {
      finalized++;
      t.is(this.count, 4);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStorePutProgress', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(2, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 2 }).done(() => {
        t.is(this.time(), 0);
        this.count++;
      });

      this.putStore(store, { a: 3 }).done(() => {
        t.is(this.time(), 10);
        this.count++;
      });

      this.putStore(store, { a: 4 }).done(() => {
        t.is(this.time(), 20);
        this.count++;
      });

      this.putStore(store, { a: 5 }).done(() => {
        t.fail();
      });

      this.setTimer(10).done(() => {
        this.getStore(store).done(() => {
          t.is(this.time(), 10);
          this.count++;
          t.is(this.callbackMessage.a, 1);
        });
      });


      this.setTimer(20).done(() => {
        this.getStore(store).done(() => {
          t.is(this.time(), 20);
          this.count++;
          t.is(this.callbackMessage.a, 2);
        });
      });

    }
    finalize() {
      finalized++;
      t.is(this.count, 6);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetProgress', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(2, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.getStore(store).done(() => {
        t.is(this.time(), 10);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 20);
        this.count++;
        t.is(this.callbackMessage.a, 2);
      });

      this.setTimer(10).done(() => {
        this.putStore(store, { a: 1 }).done(() => {
          t.is(this.time(), 10);
          this.count++;
        });
      });

      this.setTimer(20).done(() => {
        this.putStore(store, { a: 2 }).done(() => {
          t.is(this.time(), 20);
          this.count++;
        });
      });


    }
    finalize() {
      finalized++;
      t.is(this.count, 4);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetCancel', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(2, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.getStore(store).done(t.fail)
      .waitUntil(10, () => {
        t.is(this.time(), 10);
        this.count++;
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 20);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.setTimer(20).done(() => {
        this.putStore(store, { a: 1 }).done(() => {
          t.is(this.time(), 20);
          this.count++;
        });
      });
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

test('testStoreGetEventRenege', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(100, 'a');

  const event = new Sim.Event('a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 });

      // wait, since filter function is false
      this.getStore(store, () => { return false; })
      .done(t.fail)
      .unlessEvent(event);

      this.setTimer(10).done(event.fire, event);


      // wait since there is request is front
      this.getStore(store).done(() => {
        t.is(this.time(), 10);
        this.count++;
      });

    }
    finalize() {
      finalized++;
      t.is(this.count, 1);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetTimeout', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(100, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, { a: 1 });

      // wait, since filter function is false
      this.getStore(store, () => { return false; })
        .done(t.fail)
        .waitUntil(10);

      // wait since there is request is front
      this.getStore(store).done(() => {
        t.is(this.time(), 10);
        this.count++;
      });
    }

    finalize() {
      finalized++;
      t.is(this.count, 1);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetCancel', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(100, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      this.putStore(store, 1);

      // wait, since filter function is false
      const ro = this.getStore(store, () => false)
        .done(() => t.fail);

      // get wait since there is request is front
      this.getStore(store).done(() => {
        t.is(this.time(), 10);
        this.count++;
      });

      this.setTimer(10).done(ro.cancel, ro);
    }
    finalize() {
      finalized++;
      t.is(this.count, 1);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
  entities++;
});

test('testStoreGetStillWaits', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(100, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      // get waits
      this.getStore(store).done(() => {
        t.is(this.time(), 10);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 20);
        this.count++;
        t.is(this.callbackMessage.a, 2);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 30);
        this.count++;
        t.is(this.callbackMessage.a, 3);
      });

      this.getStore(store).done(() => {
        t.fail();
      });

      this.setTimer(10).done(this.putStore, this, [store, { a: 1 }]);
      this.setTimer(20).done(this.putStore, this, [store, { a: 2 }]);
      this.setTimer(30).done(this.putStore, this, [store, { a: 3 }]);
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

test('testStoreGetFilterWaits', (t) => {
  const sim = new Sim.Sim();

  const store = new Sim.Store(100, 'a');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }

    start() {
      // get waits
      this.getStore(store, (o) => {
        return o.a === 3;
      }).done(() => {
        t.is(this.time(), 30);
        this.count++;
        t.is(this.callbackMessage.a, 3);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 30);
        this.count++;
        t.is(this.callbackMessage.a, 1);
      });

      this.getStore(store).done(() => {
        t.is(this.time(), 30);
        this.count++;
        t.is(this.callbackMessage.a, 2);
      });


      this.setTimer(10).done(this.putStore, this, [store, { a: 1 }]);
      this.setTimer(20).done(this.putStore, this, [store, { a: 2 }]);
      this.setTimer(30).done(this.putStore, this, [store, { a: 3 }]);
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

