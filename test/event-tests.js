import test from 'ava';
import * as Sim from '../sim';

let finalized = 0;

test('testEventFlash', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      t.is(event.isFired, false);

      this.waitEvent(event).done(() => {
        t.is(event.isFired, false);
        t.is(this.callbackSource, event);
        t.is(this.time(), 10);
        this.count ++;
      });

      this.setTimer(10).done(() => {
        t.is(event.isFired, false);
        event.fire();
      });

      this.setTimer(20).done(() => {
        t.is(event.isFired, false);
        this.waitEvent(event).done(() => {
          t.is(this.callbackSource, event);
          t.is(this.time(), 21);
          this.count ++;
        });
      });
      this.setTimer(21).done(() => {
        t.is(event.isFired, false);
        event.fire();
        t.is(event.isFired, false);
      });
    }
    finalize() {
      finalized++;
      t.is(this.time(), 21);
      t.is(this.count, 2);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testEventSustain', (t) => {
  const sim = new Sim.Sim();

  const event = new Sim.Event('event');

  class MyEntity extends Sim.Entity {
    constructor(...args) {
      super(...args);
      this.count = 0;
    }
    start() {
      t.is(event.isFired, false);

      this.waitEvent(event).done(() => {
        t.is(event.isFired, true);
        t.is(this.callbackSource, event);
        t.is(this.time(), 10);
        this.count ++;
      });
      this.setTimer(10).done(() => {
        t.is(event.isFired, false);
        event.fire(true);
        t.is(event.isFired, true);
      });

      this.setTimer(20).done(() => {
        t.is(event.isFired, true);
        this.waitEvent(event).done(() => {
          t.is(this.callbackSource, event);
          t.is(this.time(), 20);
          this.count ++;
        });
      });

      this.setTimer(30).done(() => {
        t.is(event.isFired, true);
        event.clear();
        t.is(event.isFired, false);
      });
      this.setTimer(40).done(() => {
        t.is(event.isFired, false);
        this.waitEvent(event).done(() => {
          t.is(this.callbackSource, event);
          t.is(this.time(), 41);
          this.count ++;
        });
      });

      this.setTimer(41).done(() => { event.fire(true); });

    }
    finalize() {
      finalized++;
      t.is(this.time(), 41);
      t.is(this.count, 3);
    }
  }

  sim.addEntity(MyEntity);
  sim.simulate(100);
});

test('testEventWaitQueue', (t) => {
  const barrier = new Sim.Event('Barrier');

  const funnel = new Sim.Event('Funnel');

  let wcount = 0;

  let qcount = 0;

  class MyEntity extends Sim.Entity {
    start(master) {
      this.waitEvent(barrier).done(() => {
        wcount++;
      });

      this.queueEvent(funnel).done(() => {
        qcount++;
      });

      if (master) {
        this.setTimer(10)
              .done(barrier.fire, barrier)
              .done(funnel.fire, funnel);
      }
    }
    finalize() {
      finalized++;
    }
  }

  const sim = new Sim.Sim();

  const e = [];

  for (let i = 0; i < 100; i++) {

    e.push(sim.addEntity(MyEntity, null, i === 0));
  }
  sim.simulate(100);
  t.is(wcount, 100);
  t.is(qcount, 1);
});
