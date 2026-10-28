/** Frozen published Grid declarations + all 13 real demos, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-grid-published-types-'));
try {
  assert.ok(
    existsSync(path.join(repo, 'packages/ui/dist/grid/index.d.ts')),
    'Wait for the integrated UI dist-ready notice',
  );
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  for (const name of ['ui', 'theme', 'icons'])
    symlinkSync(
      path.join(repo, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  copyFileSync(
    path.join(repo, 'tests/browser/fixtures/GridPublicContracts.vue'),
    path.join(temp, 'GridPublicContracts.vue'),
  );
  writeFileSync(
    path.join(temp, 'subpath.ts'),
    `import {Col,Row,useBreakpoint,type Gutter,type GridRef,type ColProps,type RowProps,type GridSlot} from '@apollo-design/ui/grid';import type {Gutter as RootGutter} from '@apollo-design/ui';const tuple:Gutter=[{xs:0,md:10.5},{xs:'1rem',md:7.5}];const same:RootGutter=tuple;const col:ColProps={md:{flex:0,span:12,offset:0,order:0,push:0,pull:0}};const row:RowProps={gutter:tuple};let element:GridRef['nativeElement']=null;const slot:GridSlot=()=>[0,'complete'];void [Col,Row,useBreakpoint,same,col,row,element,slot];\n`,
  );
  const demoDir = path.join(repo, 'packages/ui/src/grid/demo'),
    demos = readdirSync(demoDir).filter((file) => file.endsWith('.vue'));
  assert.equal(demos.length, 13);
  for (const file of demos) copyFileSync(path.join(demoDir, file), path.join(temp, `Demo-${file}`));
  writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2023', 'DOM'],
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
          paths: {},
        },
        include: ['*.vue', '*.ts'],
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      path.join(repo, 'node_modules/vue-tsc/bin/vue-tsc.js'),
      '-p',
      path.join(temp, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );
  writeFileSync(
    process.env.GRID_TYPES_EVIDENCE ?? '/tmp/apollo-grid-published-types.json',
    `${JSON.stringify({ passed: true, sourceAliases: false, demos, rootAndSubpath: true, negatives: ['recursive gutter', 'string span', 'string Provider style'] }, null, 2)}\n`,
  );
  console.log(
    'PASS published Grid root/subpath types, complete slots/refs/native styles, two-axis responsive gutters and all 13 demos',
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
