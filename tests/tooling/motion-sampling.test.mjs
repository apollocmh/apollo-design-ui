import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessDisplacement,
  assessSampling,
  motionCheck,
} from '../../packages/docs/tests/motion-sampling.mjs';

function sample(points) {
  return {
    frames: points.map(([t, y]) => ({ t, nodes: [{ text: 'Old', rect: { y } }] })),
    mutations: [],
    diagnostics: { environment: { hidden: false, reducedMotion: false }, visibilityChanges: [] },
  };
}
const options = { text: 'Old', read: (node) => node.rect.y };

test('dense real-time observations retain the original displacement threshold', () => {
  const data = sample([
    [0, 0],
    [16, 8],
    [32, 20],
    [48, 32],
    [64, 48],
    [80, 56],
  ]);
  const quality = assessSampling(data, options);
  assert.equal(quality.valid, true);
  assert.equal(motionCheck(true, quality).status, 'passed');
  assert.equal(assessDisplacement(data, options).status, 'passed');
});

test('injected sparse sampling blocks acceptance without claiming a physical frame jump', () => {
  const quality = assessSampling(
    sample([
      [0, 0],
      [100, 48],
      [200, 56],
    ]),
    options,
  );
  const result = motionCheck(false, quality);
  assert.equal(quality.valid, false);
  assert.equal(result.status, 'sampling-invalid');
  assert.equal(result.ok, false);
  assert.match(result.reason, /100/);
  assert.equal(motionCheck(true, quality).status, 'sampling-invalid');
  assert.equal(
    assessDisplacement(
      sample([
        [0, 0],
        [100, 48],
        [200, 56],
      ]),
      options,
    ).status,
    'sampling-invalid',
  );
});

test('an injected actual jump within adjacent dense observations remains a product failure', () => {
  const quality = assessSampling(
    sample([
      [0, 0],
      [16, 0],
      [32, 56],
      [48, 56],
    ]),
    options,
  );
  assert.equal(quality.valid, true);
  assert.equal(motionCheck(false, quality).status, 'failed');
  const movement = assessDisplacement(
    sample([
      [0, 0],
      [16, 0],
      [32, 56],
      [48, 56],
    ]),
    options,
  );
  assert.equal(movement.maxStep, 56);
  assert.equal(movement.status, 'failed');
});

test('a proven jump is not hidden by an unrelated sampling gap', () => {
  const quality = assessSampling(
    sample([
      [0, 0],
      [100, 8],
      [116, 56],
      [132, 56],
    ]),
    options,
  );
  assert.equal(quality.valid, false);
  assert.equal(motionCheck(false, quality, { definiteFailure: true }).status, 'failed');
  assert.equal(
    assessDisplacement(
      sample([
        [0, 0],
        [100, 8],
        [116, 56],
        [132, 56],
      ]),
      options,
    ).status,
    'failed',
  );
});

test('gaps outside the changing interval do not invalidate an observed complete transition', () => {
  const quality = assessSampling(
    sample([
      [0, 0],
      [100, 0],
      [116, 8],
      [132, 32],
      [148, 56],
      [300, 56],
    ]),
    options,
  );
  assert.equal(quality.valid, true);
});

test('missing observations and hidden or reduced-motion pages are explicit invalid measurements', () => {
  for (const data of [sample([]), sample([[0, 0]])])
    assert.equal(motionCheck(false, assessSampling(data, options)).status, 'sampling-invalid');
  for (const key of ['hidden', 'reducedMotion']) {
    const data = sample([
      [0, 0],
      [16, 28],
      [32, 56],
    ]);
    data.diagnostics.environment[key] = true;
    assert.equal(assessSampling(data, options).valid, false);
  }
});

test('an insertion missed before the first frame cannot pass as an observed entrance', () => {
  const data = sample([
    [100, 56],
    [116, 56],
    [132, 56],
  ]);
  data.mutations.push({ t: 0, text: 'Old', rect: { y: 0 } });
  assert.equal(assessSampling(data, options).valid, false);
});

test('missing the first motion frame cannot shrink the measured distance and fabricate a jump', () => {
  const data = sample([
    [100, 40],
    [116, 52],
    [132, 64],
  ]);
  data.initial = { t: 0, nodes: [{ text: 'Old', rect: { y: 8 } }] };
  const result = assessDisplacement(data, options);
  assert.equal(result.distance, 56);
  assert.equal(result.status, 'sampling-invalid');
});
