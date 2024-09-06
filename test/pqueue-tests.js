import test from 'ava';
import * as Sim from '../sim';

test('testPQueue', (t) => {
  function assertArrays(a, b) {
    t.is(a.length, b.length);

    for (let i = 0; i < a.length; i++) {

      t.is(a[i], b[i]);
    }
  }

  const dataset = [[],

                 [0],
                 [1],
                 [1, 2],
                 [2, 1],
                 [1, 2, 3],
                 [3, 2, 1],
                 [3, 1, 2],
                 [1, 2, 3, 4],
                 [4, 3, 1, 2],
                 [1, 1, 1, 1],
                 [1, 1, 3, 1, 1],
                 [9, 8, 7, 6, 5, 4, 3, 2, 1],
                 [9, 8, 7, 6, 5, 4, 3, 2, 1, 10]];

  for (let i = 0; i < dataset.length; i++) {

    const arr = dataset[i];

    // insert
    const pq = new Sim.PQueue();

    for (let j = 0; j < arr.length; j++) {

      pq.insert(new Sim.Request(0, 0, arr[j]));
    }

    const out = [];

    while (true) {  // eslint-disable-line no-constant-condition
      const a = pq.remove();

      if (a === null) break;
      out.push(a.deliverAt);
    }

    assertArrays(arr.sort((a, b) => { return a - b; }), out);

  }
});
