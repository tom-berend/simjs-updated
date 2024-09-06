import test from 'ava';
import * as Sim from '../sim';

let finalized = 0;


test('testMessageSendOne', (t) => {
  const sim = new Sim.Sim();

  let count = 0;

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.send('message', 10, this.other);
      }
    }
    onMessage(source, message) {
      t.is(source, this.other);
      t.is(message, 'message');
      t.is(this.time(), 10);
      t.is(typeof this.master, 'undefined');
      count++;
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity, true, null);

  const o2 = sim.addEntity(MyEntity, false, o1);

  o1.master = true;
  o1.other = o2;
  o2.other = o1;
  o1.init();
  o2.init();
  sim.simulate(100);
  t.is(count, 1);
});

test('testMessageSendAll', (t) => {
  const sim = new Sim.Sim();

  let count = 0;

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.send('message', 10);
      }
    }
    onMessage(source, message) {
      t.is(source, this.other);
      t.is(message, 'message');
      t.is(this.time(), 10);
      t.is(typeof this.master, 'undefined');
      count++;
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity);

  const o2 = sim.addEntity(MyEntity);

  const o3 = sim.addEntity(MyEntity);

  o1.master = true;
  o2.other = o1;
  o3.other = o1;
  o1.init(); o2.init();

  sim.simulate(100);
  t.is(count, 2);
});

test('testMessageSendArray', (t) => {
  const sim = new Sim.Sim();

  let count = 0;

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.send('message', 10, this.array);
      }
    }

    onMessage(source, message) {
      t.is(source, this.other);
      t.is(message, 'message');
      t.is(this.time(), 10);
      t.is(typeof this.master, 'undefined');
      count++;
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity);

  const o2 = sim.addEntity(MyEntity);

  const o3 = sim.addEntity(MyEntity);

  o1.master = true;
  o1.array = [o2, o3, o1];
  o2.other = o1;
  o3.other = o1;
  o1.init(); o2.init(); o3.init();

  sim.simulate(100);
  t.is(count, 2);
});

test('testMessageNoCallback', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.send('message', 10, this.other);
      }
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity);

  const o2 = sim.addEntity(MyEntity);

  o1.master = true;
  o1.other = o2;
  o2.other = o1;
  o1.init(); o2.init();
  sim.simulate(100);
  t.is(sim.time(), 10);
});

test('testMessageDelayedSendOne', (t) => {
  const sim = new Sim.Sim();

  let count = 0;

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.setTimer(10).done(this.send, this, ['message', 10, this.other]);
      }
    }
    onMessage(source, message) {
      t.is(source, this.other);
      t.is(message, 'message');
      t.is(this.time(), 20);
      t.is(typeof this.master, 'undefined');
      count++;
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity);

  const o2 = sim.addEntity(MyEntity);

  o1.master = true;
  o1.other = o2;
  o2.other = o1;
  o1.init(); o2.init();
  sim.simulate(100);
  t.is(count, 1);
});

test('testMessageZeroDelay', (t) => {
  const sim = new Sim.Sim();

  let count = 0;

  class MyEntity extends Sim.Entity {
    start() {}  // eslint-disable-line no-empty-function

    init() {
      if (this.master) {
        this.setTimer(10).done(this.send, this, ['message', 0, this.other]);
      }
    }
    onMessage(source, message) {
      t.is(source, this.other);
      t.is(message, 'message');
      t.is(this.time(), 10);
      t.is(typeof this.master, 'undefined');
      count++;
    }

    finalize() {
      finalized++;
    }
  }

  const o1 = sim.addEntity(MyEntity);

  const o2 = sim.addEntity(MyEntity);

  o1.master = true;
  o1.other = o2;
  o2.other = o1;
  o1.init(); o2.init();
  sim.simulate(100);
  t.is(count, 1);
});
