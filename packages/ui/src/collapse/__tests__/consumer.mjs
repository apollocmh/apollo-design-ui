/** Strict Collapse/Divider root and child consumers; published mode only reads dist. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(
  process.env.COLLAPSE_REPO ??
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../../..'),
);
const published = process.env.COLLAPSE_MODE === 'published';
const evidence =
  process.env.COLLAPSE_CONSUMER_EVIDENCE ?? '/tmp/apollo-collapse-audit-20261029/consumer.json';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-collapse-consumer-'));
const names = [
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
  'test-utils',
];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const fingerprint = () =>
  published
    ? Object.fromEntries(
        names
          .flatMap((name) => walk(path.join(repo, `packages/${name}/dist`)))
          .sort()
          .map((file) => [path.relative(repo, file), hash(file)]),
      )
    : {};
const before = fingerprint();
const results = [];
let sourceRootExportProof;
try {
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  for (const name of names)
    symlinkSync(
      path.join(repo, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  symlinkSync(
    path.join(repo, 'node_modules/@types'),
    path.join(temp, 'node_modules/@types'),
    'dir',
  );
  if (!published)
    symlinkSync(path.join(repo, 'node_modules/vite'), path.join(temp, 'node_modules/vite'), 'dir');
  if (!published) {
    // Keep strict SFC checking scoped to these two units. Copy their exact real
    // root export statements; unrelated components keep their own source gates.
    const ts = createRequire(import.meta.url)('typescript');
    const rootFile = path.join(repo, 'packages/ui/src/index.ts');
    const rootText = readFileSync(rootFile, 'utf8');
    const syntax = ts.createSourceFile(rootFile, rootText, ts.ScriptTarget.Latest, true);
    const exports = syntax.statements.filter(
      (statement) =>
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        ['./collapse', './divider'].includes(statement.moduleSpecifier.text),
    );
    assert.equal(exports.length, 4, 'Both real root runtime and type export blocks are required');
    const printer = ts.createPrinter();
    const code = exports
      .map((statement) =>
        printer.printNode(
          ts.EmitHint.Unspecified,
          ts.factory.updateExportDeclaration(
            statement,
            statement.modifiers,
            statement.isTypeOnly,
            statement.exportClause,
            ts.factory.createStringLiteral(
              path.join(repo, 'packages/ui/src', statement.moduleSpecifier.text, 'index'),
            ),
            statement.attributes,
          ),
          syntax,
        ),
      )
      .join('\n');
    writeFileSync(path.join(temp, 'source-root.ts'), code);
    sourceRootExportProof = {
      rootFile,
      sha256: hash(rootFile),
      exportStatements: exports.length,
      code,
    };
  }
  const paths = published
    ? undefined
    : Object.fromEntries([
        ...names.map((name) => [
          `@apollo-design/${name}`,
          [
            name === 'ui'
              ? path.join(temp, 'source-root.ts')
              : path.join(repo, `packages/${name}/src/index.ts`),
          ],
        ]),
        ['@apollo-design/ui/collapse', [path.join(repo, 'packages/ui/src/collapse/index.ts')]],
        ['@apollo-design/ui/divider', [path.join(repo, 'packages/ui/src/divider/index.ts')]],
      ]);
  const compilerOptions = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    types: published ? ['node'] : ['node', 'vite/client'],
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    ...(paths ? { paths } : {}),
  };
  writeFileSync(
    path.join(temp, 'positive.vue'),
    `<script setup lang="ts">
import {Collapse,CollapsePanel,type CollapseRef} from '@apollo-design/ui';
import ChildCollapse,{type CollapseExpandIconScope} from '@apollo-design/ui/collapse';
import {Divider,type DividerProps,type DividerRef,type DividerSlot} from '@apollo-design/ui';
import ChildDivider from '@apollo-design/ui/divider';
import {h,ref} from 'vue';
const active=ref<string[]>(['a']);const collapse=ref<CollapseRef|null>(null);
const divider=ref<DividerRef|null>(null);
const legacy:DividerProps={orientation:'left',vertical:false,size:'middle'};
const title:DividerSlot=()=>[h('strong','Section'),0];
const programmatic=h(Divider,null,{default:title});void programmatic;
const icon=(scope:CollapseExpandIconScope)=>scope.key.toUpperCase();
const itemClick=(key:string)=>key.toUpperCase();const change=(keys:string[])=>keys.join(',');
const items=[{key:'a',label:h('span','Data title'),extra:0,children:h('input')}];
</script>
<template>
 <Collapse ref="collapse" v-model:active-key="active" :heading-level="2" @change="change">
  <template #expandIcon="scope"><span>{{icon(scope)}}{{scope.isActive}}{{scope.direction}}</span></template>
  <CollapsePanel key="a" header="Title" :label="h('em','Fallback')" @item-click="itemClick">
   <template #header><strong>Native title</strong></template>
   <template #extra><button type="button">Save</button></template><input aria-label="Draft" />
  </CollapsePanel>
 </Collapse>
 <ChildCollapse v-model:active-key="active" :items="items"><template #expandIcon="{key,isActive,prefixCls,collapsible,direction}">{{key.toUpperCase()}}{{isActive}}{{prefixCls}}{{collapsible}}{{direction}}</template></ChildCollapse>
 <Divider ref="divider" v-bind="legacy" title-placement="right"><strong>Native title</strong><input aria-label="Section draft" /></Divider>
 <ChildDivider orientation="vertical" :styles="{root:{marginInline:'12px'}}" />
</template>`,
  );
  writeFileSync(
    path.join(temp, 'static.ts'),
    `import DefaultCollapse,{Collapse,CollapsePanel} from '@apollo-design/ui/collapse';import {Collapse as Root,type CollapseConfig,type CollapseExpandIconScope,type CollapseHeadingLevel,type CollapsePanelProps,type CollapsePanelSlots,type CollapseSize,type CollapseSlots,type DividerRef} from '@apollo-design/ui';type Untyped<T>=0 extends (1&T)?true:false;const named:Untyped<typeof Collapse.Panel>=false;const root:Untyped<typeof Root.Panel>=false;const defaultPanel:typeof CollapsePanel=DefaultCollapse.Panel;type Model=NonNullable<InstanceType<typeof Collapse>['$props']['onUpdate:activeKey']>;const model:Untyped<Parameters<Model>[0]>=false;const keys:Parameters<Model>[0]=['a'];const native:Untyped<DividerRef['nativeElement']>=false;const div:DividerRef['nativeElement']=document.createElement('div');void[named,root,defaultPanel,model,keys,native,div];`,
  );
  writeFileSync(
    path.join(temp, 'negative.vue'),
    `<script setup lang="ts">
import {Collapse,CollapsePanel,Divider} from '@apollo-design/ui';
</script>
<template>
 <Collapse :heading-level="7" @update:active-key="(keys:number[])=>keys.join(',')">
  <template #expandIcon="scope">{{scope.key.toFixed(2)}}</template>
  <CollapsePanel :header="42" />
 </Collapse>
 <Divider orientation="diagonal" title-placement="middle" />
 <Divider><template #default="{missing}">{{missing}}</template></Divider>
</template>`,
  );
  const run = (label, files) => {
    const config = path.join(temp, `${label}.json`);
    writeFileSync(
      config,
      JSON.stringify(
        {
          compilerOptions,
          vueCompilerOptions: { strictTemplates: true },
          files: files.map((file) => path.join(temp, file)),
        },
        null,
        2,
      ),
    );
    const result = spawnSync(
      process.execPath,
      [path.join(repo, 'node_modules/vue-tsc/bin/vue-tsc.js'), '-p', config, '--listFiles'],
      { cwd: temp, encoding: 'utf8', timeout: 180000 },
    );
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    const diagnostics = output.split('\n').filter((line) => line.includes('error TS'));
    const sourceFallback = output
      .split('\n')
      .filter((line) => /\/packages\/[^/]+\/src\//.test(line));
    const item = {
      label,
      exit: result.status,
      signal: result.signal,
      diagnostics,
      sourceFallback: published ? sourceFallback : [],
    };
    results.push(item);
    return item;
  };
  const positive = run('positive', ['positive.vue', 'static.ts']);
  const negative = run('negative', ['negative.vue']);
  assert.equal(positive.exit, 0, positive.diagnostics.join('\n'));
  assert.deepEqual(positive.sourceFallback, []);
  assert.equal(negative.exit, 2);
  assert.equal(negative.diagnostics.length, 8, negative.diagnostics.join('\n'));
  assert.ok(negative.diagnostics.every((line) => line.includes('negative.vue')));
  assert.deepEqual(negative.sourceFallback, []);
} catch (e) {
  results.push({ label: 'completion', error: e.stack });
} finally {
  const unchanged = JSON.stringify(before) === JSON.stringify(fingerprint());
  const receipt = {
    mode: published ? 'published' : 'source',
    repo,
    sourceRootExportProof,
    results,
    distFiles: Object.keys(before).length,
    distUnchanged: unchanged,
    passed:
      results.length === 2 &&
      results[0].exit === 0 &&
      results[1].exit === 2 &&
      results[1].diagnostics.length === 8 &&
      unchanged,
  };
  mkdirSync(path.dirname(evidence), { recursive: true });
  writeFileSync(evidence, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  rmSync(temp, { recursive: true, force: true });
  if (!receipt.passed) process.exitCode = 1;
}
