import test from 'ava';
import * as Sim from '../sim';
import 'babel-core/register';

test('testStartArguments', (t) => {
  const sim = new Sim.Sim();

  class MyEntity extends Sim.Entity {
    start(a, b) {
      t.is(a, 10);
      t.is(b.a, 20);
    }
  }

  sim.addEntity(MyEntity, null, 10, { a: 20 });
  sim.simulate(100);
});

