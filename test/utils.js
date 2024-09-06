import test from 'ava';

function assertAlmost(a, b, eps) {
  eps = (typeof eps === 'undefined') ? 1e-7 : eps;
  if (isNaN(a) || isNaN(b) || (Math.abs(a - b) > eps)) {

    console.log(`Error: Values ${a} and ${b} are not almost equal`); // eslint-disable-line no-console
    console.trace(); // eslint-disable-line no-console

    throw new Error('Stopped on failure');
  }
}

function assertFail() {

  console.log('Error: Failed'); // eslint-disable-line no-console
  console.trace(); // eslint-disable-line no-console
  throw new Error('Stopped on failure');
}

test('testAssertAlmost', () => {
  assertAlmost(5, 7, 2);
});

export { assertFail, assertAlmost };
