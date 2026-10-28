/** Published root/input declarations, 24 unchanged demos and public SFC contracts. Never builds. */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repo = path.resolve(process.env.INPUT_TYPES_REPO ?? toolsRepo);
const evidence = process.env.INPUT_TYPES_EVIDENCE ?? '/tmp/apollo-input-published-types.json';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-input-published-types-'));
const compiler = path.join(toolsRepo, 'node_modules/vue-tsc/bin/vue-tsc.js');
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const inputs = new Map();
const report = {
  passed: false,
  packageRoot: repo,
  sourceAliases: false,
  sourceFallback: false,
  packageBuildRun: false,
  distWritten: false,
  copiedDeclarations: 0,
  positiveExit: null,
  negativeExit: null,
};

function copyInput(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
  inputs.set(from, hash(from));
}

function copyDeclarations(from, to) {
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name),
      destination = path.join(to, entry.name);
    if (entry.isDirectory()) copyDeclarations(source, destination);
    else if (/\.d\.(?:ts|mts|cts)$|\.json$/.test(entry.name)) {
      copyInput(source, destination);
      report.copiedDeclarations++;
    }
  }
}

function linkExternal(name, packageRoot, destination) {
  const candidates = [packageRoot, repo, toolsRepo].map((root) =>
    path.join(root, 'node_modules', name),
  );
  const source = candidates.find((candidate) => existsSync(path.join(candidate, 'package.json')));
  assert.ok(source, `Published dependency ${name} is not installed`);
  mkdirSync(path.dirname(destination), { recursive: true });
  symlinkSync(realpathSync(source), destination, 'dir');
}

// Copy published metadata/declarations, so workspace node_modules links cannot load another checkout.
function snapshotPackages() {
  const queue = ['ui'],
    visited = new Set();
  while (queue.length) {
    const name = queue.shift();
    if (visited.has(name)) continue;
    visited.add(name);
    const source = path.join(repo, 'packages', name);
    const destination = path.join(temp, 'node_modules/@apollo-design', name);
    const manifestPath = path.join(source, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.name, `@apollo-design/${name}`);
    assert.ok(
      existsSync(path.join(source, 'dist/index.d.ts')),
      `Wait for fresh ${name} dist-ready`,
    );
    copyInput(manifestPath, path.join(destination, 'package.json'));
    copyDeclarations(path.join(source, 'dist'), path.join(destination, 'dist'));
    const dependencies = { ...manifest.dependencies, ...manifest.peerDependencies };
    for (const dependency of Object.keys(dependencies)) {
      if (dependency.startsWith('@apollo-design/'))
        queue.push(dependency.slice('@apollo-design/'.length));
      else linkExternal(dependency, source, path.join(destination, 'node_modules', dependency));
    }
  }
  linkExternal('vue', repo, path.join(temp, 'node_modules/vue'));
  return [...visited].sort();
}

const rootSfc = `<script setup lang="ts">
import { ConfigProvider, Input, TextArea, InputPassword, InputSearch, InputOTP, InputGroup,
  type InputProps, type TextAreaProps, type InputSearchProps, type OTPProps,
  type InputRef, type TextAreaRef, type OTPRef } from '@apollo-design/ui';
import { ref } from 'vue';
const value = ref('draft');
const input = ref<InputRef|null>(null), textarea = ref<TextAreaRef|null>(null), otp = ref<OTPRef|null>(null);
const field: InputProps = { size:'small', variant:'underlined', allowClear:true,
  count:{ max:12, strategy:text=>[...text].length },
  styles:context=>({ root:{'--apollo-input-padding-block':'8px'}, input:{fontSize:context.props.size==='large'?'20px':'18px'} }) };
const area: TextAreaProps = { autoSize:{minRows:2,maxRows:4}, onResize:size=>{ const height:number=size.height; void height; } };
const search: NonNullable<InputSearchProps['onSearch']> = (text,event,info) => {
  const source:'clear'|'input'|undefined=info?.source; const current:string=text; event?.preventDefault(); void [source,current];
};
const changed: NonNullable<OTPProps['onInput']> = parts=>{const cells:string[]=parts;void cells;};
function focus() {input.value?.focus({cursor:'all',preventScroll:true});input.value?.setSelectionRange(0,2,'forward');input.value?.select();textarea.value?.focus({preventScroll:true});otp.value?.focus();}
void focus;
</script>
<template>
  <ConfigProvider :theme="{components:{Input:{paddingBlock:8,inputAffixPadding:'0.5rem'}}}">
    <Input ref="input" v-model:value="value" v-bind="field" aria-label="Public input" :style="['color:inherit',{'--apollo-input-padding-inline':'16px'}]"><template #prefix><strong>@</strong>{{0}}</template><template #suffix><span>kg</span></template></Input>
    <TextArea ref="textarea" v-model:value="value" v-bind="area" :styles="{textarea:{fontSize:'18px'}}" />
    <InputPassword v-model:value="value" action="hover" :visibility-toggle="{visible:false,onVisibleChange:visible=>{const state:boolean=visible;void state;}}" />
    <InputSearch v-model:value="value" enter-button="Search" :on-search="search" :styles="{button:{root:{height:'18px',minHeight:'0px'}}}" />
    <InputOTP ref="otp" v-model:value="value" :length="4" :on-input="changed" :separator="index=>index===1?'-':null" />
    <InputGroup size="large" compact><Input size="small" /><Input /></InputGroup>
  </ConfigProvider>
</template>
`;

const entrySfc = `<script setup lang="ts">
import Input, { Input as NamedInput, TextArea, InputPassword, InputSearch, InputOTP, InputGroup,
  type InputProps, type TextAreaProps, type InputPasswordProps, type InputSearchProps, type OTPProps,
  type InputGroupProps, type InputRef, type TextAreaRef, type OTPRef } from '@apollo-design/ui/input';
import {ref} from 'vue';
const value=ref('entry');const owner=ref<InputRef|null>(null),area=ref<TextAreaRef|null>(null),otp=ref<OTPRef|null>(null);
const props:InputProps={size:'middle',status:'warning'};
const text:TextAreaProps={autoSize:true,rows:2};const password:InputPasswordProps={allowClear:true,action:'click'};
const search:InputSearchProps={enterButton:true,loading:false};const code:OTPProps={length:4,mask:'*'};const group:InputGroupProps={size:'small',compact:true};
const aliases:[typeof TextArea,typeof InputPassword,typeof InputSearch,typeof InputOTP,typeof InputGroup]=[Input.TextArea,Input.Password,Input.Search,Input.OTP,Input.Group];void aliases;
</script>
<template>
  <Input ref="owner" v-model:value="value" v-bind="props"><template #prefix><span>Entry</span></template><template #suffix>{{0}}</template></Input>
  <NamedInput v-model:value="value" style="padding-inline:12px" />
  <TextArea ref="area" v-model:value="value" v-bind="text" />
  <InputPassword v-model:value="value" v-bind="password" />
  <InputSearch v-model:value="value" v-bind="search" />
  <InputOTP ref="otp" v-model:value="value" v-bind="code" />
  <InputGroup v-bind="group"><Input /></InputGroup>
</template>
`;

const api = `import {Input,type InputProps,type InputComponentToken,type InputAllowClearProp,prepareInputComponentToken,genInputStyle,genInputTokenDecls} from '@apollo-design/ui';
import Child,{type InputProps as ChildProps,type AllowClearProp,type InputRef} from '@apollo-design/ui/input';
import {getDesignToken} from '@apollo-design/theme';
const root:typeof Input=Child;const entry:typeof Child=Input;
const props:InputProps={value:'value',allowClear:{disabled:false},styles:{input:{fontSize:'18px'}}};const child:ChildProps=props;
const clear:InputAllowClearProp=true;const childClear:AllowClearProp=clear;
const tokens:InputComponentToken=prepareInputComponentToken(getDesignToken());const gap:string=tokens.inputAffixPadding;
const fields:Record<keyof InputComponentToken,true>={lineWidthFocus:true,paddingBlock:true,paddingBlockSM:true,paddingBlockLG:true,paddingInline:true,paddingInlineSM:true,paddingInlineLG:true,addonBg:true,activeBorderColor:true,hoverBorderColor:true,activeShadow:true,errorActiveShadow:true,warningActiveShadow:true,hoverBg:true,activeBg:true,inputFontSize:true,inputFontSizeLG:true,inputFontSizeSM:true,inputAffixPadding:true};
const css:string=genInputStyle();const declarations:string[]=genInputTokenDecls('apollo');
function negative(api:InputRef){
// @ts-expect-error Focus accepts start/end/all, not an arbitrary cursor position.
api.focus({cursor:'middle'});
// @ts-expect-error Input has no button semantic region; Search has it.
const wrongRegion:InputProps={styles:{button:{color:'red'}}};
// @ts-expect-error The prepared token surface contains CSS strings; numeric theme overrides are separate.
const wrongPrepared:InputComponentToken={...tokens,inputAffixPadding:12};
void [wrongRegion,wrongPrepared];}
void [root,entry,child,childClear,gap,fields,css,declarations,negative];
`;

const negativeCases = [
  ['value-number', '<Input :value="42" data-negative="value-number" />'],
  ['entry-size', '<Child size="huge" data-negative="entry-size" />'],
  ['numeric-model', '<Input v-model:value="numeric" data-negative="numeric-model" />'],
  ['textarea-rows', '<TextArea rows="two" data-negative="textarea-rows" />'],
  [
    'textarea-autoSize',
    '<TextArea :auto-size="{minRows:\'two\'}" data-negative="textarea-autoSize" />',
  ],
  ['password-action', '<InputPassword action="dblclick" data-negative="password-action" />'],
  ['search-value', '<InputSearch :on-search="badSearch" data-negative="search-value" />'],
  ['otp-input', '<InputOTP :on-input="badOTP" data-negative="otp-input" />'],
  ['group-size', '<InputGroup size="huge" data-negative="group-size" />'],
];

try {
  assert.ok(
    existsSync(path.join(repo, 'packages/ui/dist/input/index.d.ts')),
    'Wait for fresh UI dist-ready',
  );
  report.packages = snapshotPackages();
  const demos = readdirSync(path.join(repo, 'packages/ui/src/input/demo'))
    .filter((file) => file.endsWith('.vue'))
    .sort();
  assert.equal(demos.length, 24);
  for (const file of demos)
    copyInput(path.join(repo, 'packages/ui/src/input/demo', file), path.join(temp, `Demo-${file}`));
  writeFileSync(path.join(temp, 'RootConsumer.vue'), rootSfc);
  writeFileSync(path.join(temp, 'EntryConsumer.vue'), entrySfc);
  writeFileSync(path.join(temp, 'ApiContracts.ts'), api);
  const options = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    jsx: 'preserve',
    jsxImportSource: 'vue',
    lib: ['ES2023', 'DOM', 'DOM.Iterable'],
    strict: true,
    noUncheckedIndexedAccess: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    esModuleInterop: true,
    resolveJsonModule: true,
  };
  const positiveConfig = path.join(temp, 'tsconfig.json');
  writeFileSync(
    positiveConfig,
    JSON.stringify({ compilerOptions: options, include: ['*.vue', '*.ts'] }, null, 2),
  );
  const list = execFileSync(
    process.execPath,
    [compiler, '-p', positiveConfig, '--listFilesOnly', '--pretty', 'false'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  const loaded = list
    .split(/\r?\n/)
    .filter((file) => existsSync(file))
    .map((file) => realpathSync(file));
  const sourceLeaks = loaded.filter((file) =>
    /\/packages\/[^/]+\/src\/|\/node_modules\/@apollo-design\/[^/]+\/src\//.test(file),
  );
  assert.deepEqual(sourceLeaks, [], 'Published consumer must never resolve library source');
  for (const relative of ['dist/index.d.ts', 'dist/input/index.d.ts'])
    assert.ok(
      loaded.includes(path.join(temp, 'node_modules/@apollo-design/ui', relative)),
      `Public ${relative} was not consumed`,
    );
  execFileSync(process.execPath, [compiler, '-p', positiveConfig, '--pretty', 'false'], {
    stdio: 'inherit',
  });
  report.positiveExit = 0;
  report.resolvedFirstPartyDeclarations = loaded.filter((file) =>
    file.startsWith(path.join(temp, 'node_modules/@apollo-design/')),
  ).length;
  report.sourceLeaks = sourceLeaks;
  report.demos = demos;

  const lines = [
    '<script setup lang="ts">',
    "import {Input,TextArea,InputPassword,InputSearch,InputOTP,InputGroup} from '@apollo-design/ui';",
    "import Child from '@apollo-design/ui/input';import {ref} from 'vue';",
    'const numeric=ref(1);const badSearch=(value:number)=>{};const badOTP=(value:number[])=>{};',
    '</script>',
    '<template>',
    ...negativeCases.map(([, node]) => `  ${node}`),
    '</template>',
  ];
  mkdirSync(path.join(temp, 'negative'));
  writeFileSync(path.join(temp, 'negative/Rejected.vue'), `${lines.join('\n')}\n`);
  const negativeConfig = path.join(temp, 'negative/tsconfig.json');
  writeFileSync(
    negativeConfig,
    JSON.stringify({ compilerOptions: options, include: ['Rejected.vue'] }, null, 2),
  );
  const rejected = spawnSync(
    process.execPath,
    [compiler, '-p', negativeConfig, '--pretty', 'false'],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
  );
  assert.ifError(rejected.error);
  const diagnostics = rejected.stdout + rejected.stderr;
  report.negativeExit = rejected.status;
  report.negativeDiagnostics = diagnostics;
  assert.ok(
    rejected.status !== 0 && rejected.status !== null,
    'Invalid public SFC props must be rejected',
  );
  const errors = [...diagnostics.matchAll(/Rejected\.vue\((\d+),\d+\): error TS\d+:/g)].map(
    (match) => Number(match[1]),
  );
  for (const [label] of negativeCases) {
    const line = lines.findIndex((text) => text.includes(`data-negative="${label}"`)) + 1;
    assert.ok(
      errors.includes(line),
      `SFC negative ${label} was not rejected on its own template line`,
    );
  }
  const foreignErrors = diagnostics
    .split(/\r?\n/)
    .filter((line) => /error TS\d+:/.test(line) && !line.includes('Rejected.vue('));
  assert.deepEqual(
    foreignErrors,
    [],
    'Unrelated diagnostics must not make negative consumers pass',
  );
  report.negativeCases = negativeCases.map(([label]) => label);
  report.rootAndInputSubpath = true;
  report.existingComponentFields = 19;
  report.passed = true;
  console.log(
    'PASS published Input root/input declarations, 24 original demos, public SFC positive/negative contracts and 19 existing token fields',
  );
} finally {
  const changed = [...inputs]
    .filter(([file, before]) => !existsSync(file) || hash(file) !== before)
    .map(([file]) => file);
  report.inputFilesUnchanged = changed.length === 0;
  report.changedInputFiles = changed;
  report.inputFingerprints = Object.fromEntries(inputs);
  mkdirSync(path.dirname(evidence), { recursive: true });
  writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  rmSync(temp, { recursive: true, force: true });
  assert.deepEqual(
    changed,
    [],
    'Published artifacts and original demos changed during the consumer check',
  );
}
