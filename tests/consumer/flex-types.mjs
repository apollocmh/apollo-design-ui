/** Frozen published Flex declarations + all six real demos, without source aliases. */
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
const source = process.env.FLEX_SOURCE === '1';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-flex-published-types-'));
try {
  assert.ok(
    source || existsSync(path.join(repo, 'packages/ui/dist/flex/index.d.ts')),
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
    path.join(repo, 'tests/browser/fixtures/FlexPublicContracts.vue'),
    path.join(temp, 'FlexPublicContracts.vue'),
  );
  writeFileSync(
    path.join(temp, 'subpath.ts'),
    `import {Flex,type FlexProps,type FlexRef,type FlexSlot,type FlexConfig} from '@apollo-design/ui/flex';import {h,type VNodeChild} from 'vue';import type {FlexSlot as RootSlot} from '@apollo-design/ui';const props:FlexProps={align:'stretch',gap:0,component:'section'};const config:FlexConfig={vertical:false,style:{padding:'3px'}};const slot:FlexSlot=()=>[0,'complete',h('strong','content')];const same:RootSlot=slot;const content:VNodeChild=slot();let element:FlexRef['nativeElement']=null;void [Flex,props,config,same,content,element];
// @ts-expect-error Plain objects are not Vue content.
const invalidSlot:FlexSlot=()=>({invalid:true});
// @ts-expect-error Provider style accepts CSSProperties; native Flex attrs accept style strings.
const invalidConfig:FlexConfig={style:'padding:3px'};
void [invalidSlot,invalidConfig];\n`,
  );
  const demoDir = path.join(repo, 'packages/ui/src/flex/demo'),
    demos = readdirSync(demoDir).filter((file) => file.endsWith('.vue'));
  assert.equal(demos.length, 6);
  for (const file of demos) copyFileSync(path.join(demoDir, file), path.join(temp, `Demo-${file}`));
  writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'preserve',
          jsxImportSource: 'vue',
          noUncheckedIndexedAccess: true,
          lib: ['ES2023', 'DOM', 'DOM.Iterable'],
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: source
            ? [
                path.join(repo, 'node_modules/@types/node'),
                path.join(repo, 'node_modules/vite/client'),
              ]
            : [],
          paths: source
            ? {
                ...Object.fromEntries(
                  [
                    'ui',
                    'theme',
                    'utils',
                    'icons',
                    'motion',
                    'portal',
                    'position',
                    'overlay',
                    'a11y',
                    'virtual-list',
                    'form-core',
                    'picker',
                    'locale',
                  ].map((name) => [
                    `@apollo-design/${name}`,
                    [path.join(repo, `packages/${name}/src/index.ts`)],
                  ]),
                ),
                '@apollo-design/ui': [path.join(repo, 'packages/ui/src/flex/index.ts')],
                '@apollo-design/ui/flex': [path.join(repo, 'packages/ui/src/flex/index.ts')],
              }
            : {},
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
    process.env.FLEX_TYPES_EVIDENCE ?? '/tmp/apollo-flex-published-types.json',
    `${JSON.stringify({ passed: true, sourceAliases: source, demos, rootAndSubpath: !source, isolatedSourceFlexEntry: source, negatives: ['plain object slot', 'string Provider style'] }, null, 2)}\n`,
  );
  console.log(
    source
      ? 'PASS isolated source Flex entry, complete slots/refs/native styles and all six demos; published root/subpath validation awaits dist-ready'
      : 'PASS published Flex root/subpath types, complete slots/refs/native styles and all six demos',
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
