import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildCases } from '../visual/matrix.mjs';
import { groupVisualCases, mergeVisualReports } from '../visual/parallel.mjs';

const cases = buildCases({ apollo: true });
const groups = groupVisualCases(cases);
function outcomes() {
  return groups.map((group) => ({
    exitCode: 0,
    signal: null,
    report: {
      expected: group.ids.length,
      pending: 0,
      rendering: { environment: 'unchanged-child-metadata' },
      results: group.ids.map((id) => ({ id, verdict: 'PASS', state: { original: id } })),
    },
  }));
}

test('the full real matrix has five balanced, component-exclusive, complete shards', () => {
  const input = structuredClone(cases);
  assert.equal(cases.length, 1875);
  assert.deepEqual(
    groups.map((group) => group.ids.length),
    [375, 375, 375, 375, 375],
  );
  assert.equal(new Set(groups.flatMap((group) => group.components)).size, 72);
  assert.equal(new Set(groups.flatMap((group) => group.ids)).size, 1875);
  assert.deepEqual(
    groups.flatMap((group) => group.ids).sort(),
    cases.map((item) => item.id).sort(),
  );
  for (const group of groups) {
    assert.deepEqual(new Set(group.ids.map((id) => id.split('/')[0])), new Set(group.components));
  }
  const reversed = groupVisualCases([...cases].reverse());
  assert.deepEqual(
    reversed.map((group) => group.components),
    groups.map((group) => group.components),
  );
  for (let index = 0; index < groups.length; index++)
    assert.deepEqual(new Set(reversed[index].ids), new Set(groups[index].ids));
  assert.deepEqual(cases, input);
});

test('equal-sized components use name order and equal-load workers use index order', () => {
  const grouped = groupVisualCases(
    ['f', 'e', 'd', 'c', 'b', 'a'].map((component) => ({ component, id: `${component}/x` })),
  );
  assert.deepEqual(
    grouped.map((group) => group.components),
    [['a', 'f'], ['b'], ['c'], ['d'], ['e']],
  );
});

test('merge restores exact matrix order and retains result state and child rendering metadata', () => {
  const input = outcomes();
  const merged = mergeVisualReports(cases, groups, input);
  assert.equal(merged.passed, true);
  assert.equal(merged.expected, 1875);
  assert.equal(merged.pending, 0);
  assert.deepEqual(
    merged.results.map((result) => result.id),
    cases.map((item) => item.id),
  );
  assert.equal(merged.results[0].state.original, cases[0].id);
  assert.deepEqual(merged.workers[0].report.rendering, input[0].report.rendering);
});

for (const [name, change] of [
  [
    'nonzero exit despite a green report',
    (rows) => {
      rows[0].exitCode = 7;
    },
  ],
  [
    'signal despite a green report',
    (rows) => {
      rows[0].exitCode = null;
      rows[0].signal = 'SIGTERM';
    },
  ],
  [
    'worker error despite a green report',
    (rows) => {
      rows[0].error = 'spawn EACCES';
    },
  ],
  [
    'missing report despite zero exit',
    (rows) => {
      delete rows[0].report;
    },
  ],
  [
    'missing worker',
    (rows) => {
      rows.pop();
    },
  ],
  [
    'wrong declared count',
    (rows) => {
      rows[0].report.expected--;
    },
  ],
  [
    'omitted result',
    (rows) => {
      rows[0].report.results.pop();
    },
  ],
  [
    'duplicate hiding an omitted result',
    (rows) => {
      rows[0].report.results[1] = rows[0].report.results[0];
    },
  ],
  [
    'unexpected replacement ID',
    (rows) => {
      rows[0].report.results[0].id = 'foreign/case';
    },
  ],
  [
    'swapped complete worker reports',
    (rows) => {
      [rows[0].report, rows[1].report] = [rows[1].report, rows[0].report];
    },
  ],
  [
    'pending baseline',
    (rows) => {
      rows[0].report.pending = 1;
    },
  ],
  [
    'invalid pending count',
    (rows) => {
      delete rows[0].report.pending;
    },
  ],
  [
    'visual FAIL',
    (rows) => {
      rows[0].report.results[0].verdict = 'FAIL';
    },
  ],
  [
    'non-comparison verdict',
    (rows) => {
      rows[0].report.results[0].verdict = 'CANDIDATE';
    },
  ],
]) {
  test(`merge rejects ${name}`, () => {
    const input = outcomes();
    change(input);
    const merged = mergeVisualReports(cases, groups, input);
    assert.equal(merged.passed, false);
    assert.ok(merged.errors.length > 0);
  });
}

function cliFixture(t, control = {}) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-visual-parallel-test-')),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const visual = path.join(root, 'tests/visual');
  fs.mkdirSync(visual, { recursive: true });
  for (const name of ['parallel.mjs', 'matrix.mjs'])
    fs.copyFileSync(
      fileURLToPath(new URL(`../visual/${name}`, import.meta.url)),
      path.join(visual, name),
    );
  fs.writeFileSync(path.join(visual, 'control.json'), JSON.stringify(control));
  fs.writeFileSync(
    path.join(visual, 'environment.mjs'),
    `
    import fs from 'node:fs';
    export function readNativeRenderingEnvironment(){return JSON.parse(fs.readFileSync(new URL('control.json',import.meta.url)));}
    export function assertNativeRenderingEnvironment(actual){if(actual.environmentFailure)throw Error('Synthetic noncanonical rendering environment');}
  `,
  );
  fs.writeFileSync(
    path.join(visual, 'build.mjs'),
    `
    import fs from 'node:fs';import{fileURLToPath}from'node:url';
    export async function buildSide(side,outDir){fs.appendFileSync(fileURLToPath(new URL('build-calls.jsonl',import.meta.url)),JSON.stringify({side,outDir})+'\\n');if(JSON.parse(fs.readFileSync(fileURLToPath(new URL('control.json',import.meta.url)))).buildFailure)throw Error('Synthetic fixture build failed');}
  `,
  );
  fs.writeFileSync(
    path.join(visual, 'apollo.mjs'),
    `
    import fs from 'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{parseArgs}from'node:util';import{setTimeout}from'node:timers/promises';import{buildCases}from'./matrix.mjs';
    const here=path.dirname(fileURLToPath(import.meta.url));
    const{values}=parseArgs({options:{component:{type:'string',multiple:true},'no-build':{type:'boolean'},'report-file':{type:'string'}}});
    if(!values['no-build'])throw Error('Every child must use --no-build');
    const control=JSON.parse(fs.readFileSync(path.join(here,'control.json')));
    fs.writeFileSync(path.join(here,process.pid+'.started'),JSON.stringify(values));
    const end=Date.now()+10000;
    while(fs.readdirSync(here).filter(name=>name.endsWith('.started')).length<5){if(Date.now()>end)throw Error('Five workers did not start concurrently');await setTimeout(20);}
    const selected=values.component.flatMap(component=>buildCases({apollo:true,component}));
    if(control.missing&&values.component.includes('input'))process.exit(0);
    fs.writeFileSync(values['report-file'],JSON.stringify({expected:selected.length,pending:0,rendering:{fixture:'synthetic-process-check',pid:process.pid},results:selected.map(item=>({id:item.id,verdict:'PASS'}))}));
    if(control.nonzero&&values.component.includes('input'))process.exit(7);
    if(control.signal&&values.component.includes('input'))process.kill(process.pid,'SIGTERM');
    if(control.crash&&values.component.includes('input'))throw Error('Synthetic worker failure');
    if(control.invalid&&values.component.includes('input'))fs.writeFileSync(values['report-file'],'{');
  `,
  );
  return {
    root,
    visual,
    run: (...args) =>
      spawnSync(process.execPath, [path.join(visual, 'parallel.mjs'), ...args], {
        cwd: root,
        encoding: 'utf8',
        timeout: 20000,
      }),
  };
}

test('CLI builds the fixture once, starts five real Node workers, and aggregates their synthetic reports', (t) => {
  const fixture = cliFixture(t),
    result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.signal, null);
  const calls = fs
    .readFileSync(path.join(fixture.visual, 'build-calls.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map(JSON.parse);
  assert.deepEqual(calls, [{ side: 'vue', outDir: path.join(fixture.visual, '.artifacts/vue') }]);
  const merged = JSON.parse(fs.readFileSync(path.join(fixture.visual, 'report-apollo.json')));
  assert.equal(merged.passed, true);
  assert.equal(merged.results.length, 1875);
  assert.equal(new Set(merged.workers.map((worker) => worker.report.rendering.pid)).size, 5);
  assert.ok(merged.workers.every((worker) => worker.exitCode === 0 && worker.signal === null));
});

test('CLI refuses a noncanonical environment before a fixture build or worker starts', (t) => {
  const fixture = cliFixture(t, { environmentFailure: true });
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /noncanonical rendering environment/);
  assert.equal(fs.existsSync(path.join(fixture.visual, 'build-calls.jsonl')), false);
  assert.equal(
    fs.readdirSync(fixture.visual).some((name) => name.endsWith('.started')),
    false,
  );
});

for (const [name, control] of [
  ['nonzero child with a full green report', { nonzero: true }],
  ['missing child report with zero exit', { missing: true }],
  ['signaled child with a full green report', { signal: true }],
  ['uncaught worker error', { crash: true }],
  ['invalid JSON report with zero exit', { invalid: true }],
]) {
  test(`CLI exits 1 for ${name}`, (t) => {
    const fixture = cliFixture(t, control),
      destination = path.join(fixture.root, 'aggregate.json');
    const result = fixture.run('--no-build', '--report-file', destination);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.signal, null);
    assert.equal(fs.existsSync(path.join(fixture.visual, 'build-calls.jsonl')), false);
    const merged = JSON.parse(fs.readFileSync(destination));
    assert.equal(merged.passed, false);
    assert.equal(merged.expected, 1875);
    assert.ok(merged.errors.length > 0);
    assert.equal(
      merged.workers[0].exitCode,
      control.nonzero ? 7 : control.signal ? null : control.crash ? 1 : 0,
    );
    assert.equal(merged.workers[0].signal, control.signal ? 'SIGTERM' : null);
  });
}

test('CLI preserves fixture build failure without starting workers or accepting an old report', (t) => {
  const fixture = cliFixture(t, { buildFailure: true });
  const destination = path.join(fixture.visual, 'report-apollo.json');
  fs.writeFileSync(
    destination,
    JSON.stringify({ expected: 1875, pending: 0, results: [], passed: true }),
  );
  const result = fixture.run();
  assert.equal(result.status, 1, result.stderr);
  const merged = JSON.parse(fs.readFileSync(destination));
  assert.equal(merged.passed, false);
  assert.ok(merged.errors.some((message) => message.includes('Synthetic fixture build failed')));
  assert.equal(
    fs.readdirSync(fixture.visual).filter((name) => name.endsWith('.started')).length,
    0,
  );
});

test('CLI help has no rendering/build side effects and rejects candidate/configuration modes', (t) => {
  const fixture = cliFixture(t);
  assert.equal(fixture.run('--help').status, 0);
  for (const flag of ['--candidate', '--accept', '--workers', '--component'])
    assert.equal(fixture.run(flag).status, 1, flag);
  assert.equal(fs.existsSync(path.join(fixture.visual, 'build-calls.jsonl')), false);
  assert.equal(fs.existsSync(path.join(fixture.visual, 'report-apollo.json')), false);
});
