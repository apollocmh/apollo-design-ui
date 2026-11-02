import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { newStablePage } from '../visual/stabilize.mjs';
import { prepareTypographyVisual } from '../visual/typography-state.mjs';

async function initialization(options, sandbox = createContext({})) {
  let contextOptions;
  const scripts = [];
  const page = {
    addInitScript: async (script, argument) => scripts.push({ script, argument }),
  };
  const context = { newPage: async () => page };
  const browser = {
    newContext: async (options) => {
      contextOptions = options;
      return context;
    },
  };
  assert.deepEqual(await newStablePage(browser, options), { context, page });
  for (const { script, argument } of scripts)
    runInContext(`(${script.toString()})(${JSON.stringify(argument)})`, sandbox);
  return { sandbox, contextOptions };
}

test('stable pages freeze Date by default and retain the rendering context', async () => {
  const { sandbox, contextOptions } = await initialization({ width: 768, height: 1024 });
  assert.equal(runInContext('Date.now()', sandbox), Date.parse('2026-09-18T00:00:00Z'));
  assert.equal(runInContext('new Date().getTime()', sandbox), Date.parse('2026-09-18T00:00:00Z'));
  assert.deepEqual(contextOptions.viewport, { width: 768, height: 1024 });
  assert.equal(contextOptions.deviceScaleFactor, 1);
  assert.equal(contextOptions.locale, 'zh-CN');
  assert.equal(contextOptions.timezoneId, 'Asia/Shanghai');
});

test('a timer-owned page retains its clock while keeping deterministic randomness', async () => {
  const ordinary = await initialization({ width: 768, height: 1024 });
  // A separate timer owner can install before the stabilization script as well.
  const clock = createContext({});
  runInContext(
    `globalThis.tick = 1000;
     globalThis.OwnedDate = class extends Date { static now() { return tick; } };
     Date = OwnedDate;`,
    clock,
  );
  const { sandbox } = await initialization({ width: 768, height: 1024, freezeTime: false }, clock);
  assert.equal(runInContext('Date === OwnedDate', clock), true);
  assert.equal(runInContext('Date.now()', clock), 1000);
  assert.equal(runInContext('tick += 50; Date.now()', clock), 1050);
  assert.equal(
    runInContext('Math.random()', sandbox),
    runInContext('Math.random()', ordinary.sandbox),
  );
});

test('a Tooltip close failure reports read-only context and rethrows the same error', async (t) => {
  const failure = new Error('Tooltip remained visible');
  const diagnostic = { date: 1000, performance: 200, documentHasFocus: true };
  const logged = t.mock.method(console, 'error', () => {});
  const copy = { hover: async () => {}, click: async () => {} };
  const heading = { evaluate: async () => {} };
  const stage = {
    locator: (selector) => ({
      count: async () => 2,
      first: () => (selector === 'h1' ? heading : copy),
    }),
  };
  let evaluations = 0;
  const page = {
    locator: () => stage,
    evaluate: async () => {
      evaluations += 1;
      if (evaluations === 2) return 'Clipboard payload';
      if (evaluations === 3) return diagnostic;
    },
    getByRole: () => ({
      waitFor: async ({ state }) => {
        if (state === 'hidden') throw failure;
      },
      textContent: async () => 'Copy the payload',
    }),
    waitForFunction: async () => {},
    mouse: { move: async () => {} },
  };
  await assert.rejects(
    prepareTypographyVisual(page, 'copy-feedback'),
    (error) => error === failure,
  );
  assert.equal(evaluations, 3);
  assert.deepEqual(logged.mock.calls[0].arguments, [
    'Typography copy Tooltip failed to close:',
    JSON.stringify(diagnostic),
  ]);
});
