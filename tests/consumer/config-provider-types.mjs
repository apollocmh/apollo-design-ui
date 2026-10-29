/** Published ConfigProvider/Locale/Icon contracts and all eight current Demo consumers. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-cp-types-')));
const evidence =
  process.env.CP_TYPES_EVIDENCE ?? '/tmp/apollo-config-provider-published-types.json';
const compiler = path.join(repo, 'node_modules/vue-tsc/bin/vue-tsc.js');
const inputs = new Map();
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = { passed: false, sourceAliases: false, packageBuildRun: false, distWritten: false };
function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  inputs.set(from, hash(from));
}
function declarations(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name),
      target = path.join(to, entry.name);
    if (entry.isDirectory()) declarations(source, target);
    else if (/\.d\.(?:ts|mts|cts)$/.test(entry.name)) copy(source, target);
  }
}
const compile = (config, extra = []) =>
  spawnSync(process.execPath, [compiler, '-p', config, '--pretty', 'false', ...extra], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
try {
  const packages = fs
    .readdirSync(path.join(repo, 'packages'))
    .filter((name) => fs.existsSync(path.join(repo, 'packages', name, 'dist/index.d.ts')));
  for (const name of packages) {
    const source = path.join(repo, 'packages', name);
    const target = path.join(temporary, 'node_modules/@apollo-design', name);
    copy(path.join(source, 'package.json'), path.join(target, 'package.json'));
    declarations(path.join(source, 'dist'), path.join(target, 'dist'));
    const manifest = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
    for (const dependency of Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      if (dependency.startsWith('@apollo-design/')) continue;
      const resolved = [source, repo]
        .map((root) => path.join(root, 'node_modules', dependency))
        .find(fs.existsSync);
      assert.ok(resolved, `Missing installed external dependency ${dependency}`);
      const destination = path.join(target, 'node_modules', dependency);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.symlinkSync(fs.realpathSync(resolved), destination, 'dir');
    }
  }
  fs.symlinkSync(
    fs.realpathSync(path.join(repo, 'node_modules/vue')),
    path.join(temporary, 'node_modules/vue'),
    'dir',
  );
  const demos = fs
    .readdirSync(path.join(repo, 'packages/ui/src/config-provider/demo'))
    .filter((name) => name.endsWith('.vue'))
    .sort();
  assert.equal(demos.length, 8);
  for (const name of demos) {
    const original = path.join(repo, 'packages/ui/src/config-provider/demo', name);
    inputs.set(original, hash(original));
    const text = fs
      .readFileSync(original, 'utf8')
      .replaceAll("from '../../index'", "from '@apollo-design/ui'")
      .replaceAll("from '../index'", "from '@apollo-design/ui/config-provider'");
    fs.writeFileSync(path.join(temporary, `Demo-${name}`), text);
  }
  fs.writeFileSync(
    path.join(temporary, 'Consumer.vue'),
    `<script setup lang="ts">
import {ConfigProvider,Input,type ConfigProviderProps,type ConfigProviderScopeTag} from '@apollo-design/ui';
import Entry, {useConfig,type GetTargetContainer,type GetPopupContainer} from '@apollo-design/ui/config-provider';
import {useLocale,zh_CN} from '@apollo-design/locale';
import type {ComputedRef} from 'vue';
const scope:ConfigProviderScopeTag='section';
const config:ConfigProviderProps={scopeTag:scope,locale:zh_CN,componentSize:'large',direction:'rtl',theme:{token:{fontSize:18},components:{Input:{paddingBlock:8}}},components:{input:{className:'current'}}};
const target:GetTargetContainer=()=>window;
const popup:GetPopupContainer=()=>document.createElement('section').attachShadow({mode:'open'});
function contracts(){const [locale,code]=useLocale('Empty');const language:ComputedRef<string|undefined>=code;const disabled:ComputedRef<boolean|undefined>=useConfig().componentDisabled;void [locale.value.description,language,disabled];}
void contracts;
</script>
<template><ConfigProvider v-bind="config" :get-target-container="target" :get-popup-container="popup"><Input aria-label="Current configuration" /></ConfigProvider><Entry scope-tag="g"><text>SVG scope</text></Entry></template>
`,
  );
  fs.writeFileSync(path.join(temporary, 'styles.d.ts'), "declare module '*.css';\n");
  const options = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    strict: true,
    noUncheckedIndexedAccess: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    lib: ['ES2023', 'DOM', 'DOM.Iterable'],
    esModuleInterop: true,
  };
  const config = path.join(temporary, 'tsconfig.json');
  fs.writeFileSync(
    config,
    JSON.stringify({ compilerOptions: options, include: ['*.vue', '*.ts'] }),
  );
  const listing = compile(config, ['--listFilesOnly']);
  assert.ifError(listing.error);
  assert.equal(listing.status, 0, listing.stdout + listing.stderr);
  const leaks = listing.stdout
    .split(/\r?\n/)
    .filter((file) =>
      /\/packages\/[^/]+\/src\/|\/node_modules\/@apollo-design\/[^/]+\/src\//.test(file),
    );
  assert.deepEqual(leaks, [], 'Published consumer must not fall back to source');
  const positive = compile(config);
  report.positiveExit = positive.status;
  assert.equal(positive.status, 0, positive.stdout + positive.stderr);
  const negatives = [
    "const bad:ConfigProviderProps={csp:{nonce:'legacy'}};",
    'const bad:ConfigProviderProps={wave:{disabled:true}};',
    "const bad:ConfigProviderProps={popupOverflow:'viewport'};",
    "const bad:ConfigProviderProps={scopeTag:'not-a-native-tag'};",
    "const bad:GetTargetContainer=()=>document.createElement('div').attachShadow({mode:'open'});",
    "function bad(){const [locale]=useLocale('Empty');locale.value={description:'overwrite'};}",
    "import {useLocaleReactive} from '@apollo-design/locale';",
    "const bad:IconContextProps={csp:{nonce:'legacy'}};",
  ];
  const negativeDirectory = path.join(temporary, 'negative');
  fs.mkdirSync(negativeDirectory);
  for (let index = 0; index < negatives.length; index++) {
    fs.writeFileSync(
      path.join(negativeDirectory, `Rejected-${index}.ts`),
      `import type {ConfigProviderProps,GetTargetContainer} from '@apollo-design/ui/config-provider';\nimport {useLocale} from '@apollo-design/locale';\nimport type {IconContextProps} from '@apollo-design/icons';\n${negatives[index]}\n`,
    );
  }
  const negativeConfig = path.join(negativeDirectory, 'tsconfig.json');
  fs.writeFileSync(negativeConfig, JSON.stringify({ compilerOptions: options, include: ['*.ts'] }));
  const negative = compile(negativeConfig);
  report.negativeExit = negative.status;
  report.negativeDiagnostics = negative.stdout + negative.stderr;
  assert.notEqual(negative.status, 0);
  for (let index = 0; index < negatives.length; index++)
    assert.ok(
      report.negativeDiagnostics.includes(`Rejected-${index}.ts(4,`),
      `Negative ${index} must fail at its actual contract line`,
    );
  const foreign = report.negativeDiagnostics
    .split(/\r?\n/)
    .filter((line) => /error TS\d+:/.test(line) && !/Rejected-\d+\.ts\(4,/.test(line));
  assert.deepEqual(foreign, [], 'Unrelated type errors cannot count as successful negative checks');
  report.demos = demos;
  report.demoImportAdaptation =
    'Only the two explicit relative public-entry imports are mapped to published root/config-provider entries';
  report.negativeCases = negatives.length;
  report.passed = true;
} finally {
  const changed = [...inputs]
    .filter(([file, before]) => hash(file) !== before)
    .map(([file]) => file);
  report.inputFilesUnchanged = changed.length === 0;
  report.inputFingerprints = Object.fromEntries(inputs);
  report.changed = changed;
  fs.writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  fs.rmSync(temporary, { recursive: true, force: true });
  assert.deepEqual(changed, []);
}
console.log(
  'PASS published ConfigProvider root/subpath, eight Demos, Locale/Icon contracts and eight independent negative cases',
);
