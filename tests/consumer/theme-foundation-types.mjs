/** Actual published Theme declarations, all contract assertions and native Vue templates. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repo = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const temp = realpathSync(mkdtempSync(path.join(tmpdir(), 'apollo-theme-published-types-')));
const output =
  process.env.THEME_FOUNDATION_TYPES_EVIDENCE ?? '/tmp/apollo-theme-published-types.json';
const report = { passed: false, sourceAliases: false, packageBuilds: false, runs: [] };
let failure;
try {
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  mkdirSync(path.join(temp, 'node_modules/@types'), { recursive: true });
  for (const name of ['vue', 'vitest'])
    symlinkSync(
      path.join(repo, 'node_modules', name),
      path.join(temp, 'node_modules', name),
      'dir',
    );
  symlinkSync(
    path.join(repo, 'node_modules/@types/node'),
    path.join(temp, 'node_modules/@types/node'),
    'dir',
  );
  for (const name of ['theme', 'utils'])
    symlinkSync(
      path.join(repo, 'packages', name),
      path.join(temp, 'node_modules/@apollo-design', name),
      'dir',
    );
  const original = readFileSync(
    path.join(repo, 'packages/theme/src/__tests__/types.test-d.ts'),
    'utf8',
  );
  assert.equal(original.split("from '../index'").length - 1, 2);
  const assertions = original.replaceAll("from '../index'", "from '@apollo-design/theme'");
  writeFileSync(path.join(temp, 'contracts.ts'), assertions);
  report.contractScenarios = [...original.matchAll(/\bit\('/g)].length;
  report.reasonedNegativeDirectives = [
    ...original.matchAll(/^\s*\/\/\s*@ts-expect-error/gm),
  ].length;
  assert.equal(report.contractScenarios, 16);
  assert.equal(report.reasonedNegativeDirectives, 11);
  report.assertionsSourceSHA256 = createHash('sha256').update(original).digest('hex');
  writeFileSync(
    path.join(temp, 'NativeProvider.vue'),
    `<script setup lang="ts">
import {ref} from 'vue';
import {ThemeProvider,createThemeContext,type ThemeConfig} from '@apollo-design/theme';
const target=ref<HTMLDivElement|null>(null);
const svgTarget=ref<SVGSVGElement|null>(null);
const theme=ref<ThemeConfig>({algorithm:[],cssVarPrefix:'native',token:{fontSize:18,colorPrimaryBg:'#ddeeff'}});
const draft=ref('retained draft');
const local=createThemeContext({});
local.config.value.token={fontHeight:24,customEnabled:true};
local.config.value.token.fontHeight=26;
</script>
<template>
  <div ref="target"></div>
  <svg ref="svgTarget"></svg>
  <ThemeProvider :theme="theme" :target="svgTarget" inject-css-var><span>SVG target</span></ThemeProvider>
  <ThemeProvider :theme="theme" :target="target" inject-css-var>
    <input v-model="draft" aria-label="Theme draft" />{{ 0 }}
  </ThemeProvider>
</template>\n`,
  );
  writeFileSync(
    path.join(temp, 'UnsupportedSlot.vue'),
    `<script setup lang="ts">
import {ThemeProvider} from '@apollo-design/theme';
</script>
<template><ThemeProvider><template #header>Unsupported</template></ThemeProvider></template>\n`,
  );
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'preserve',
      jsxImportSource: 'vue',
      strict: true,
      noEmit: true,
      noUncheckedIndexedAccess: true,
      skipLibCheck: true,
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      types: ['node'],
    },
    vueCompilerOptions: { strictTemplates: true },
    include: ['contracts.ts', 'NativeProvider.vue'],
  };
  const configFile = path.join(temp, 'tsconfig.json');
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, temp);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const declarations = program
    .getSourceFiles()
    .map((file) => file.fileName)
    .filter((file) => file.includes('/packages/') && file.includes('/dist/'));
  const firstPartySources = program
    .getSourceFiles()
    .map((file) => file.fileName)
    .filter((file) => file.includes('/packages/') && file.includes('/src/'));
  assert.deepEqual(firstPartySources, []);
  assert.ok(declarations.some((file) => file.includes('/packages/theme/dist/')));
  for (const file of declarations) assert.ok(realpathSync(file).startsWith(`${repo}/packages/`));
  report.declarationFiles = declarations.map((file) => ({
    file: realpathSync(file).slice(repo.length + 1),
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  }));
  report.firstPartySourceImports = 0;
  const compile = (name, project) => {
    const run = spawnSync(
      process.execPath,
      [path.join(repo, 'node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '-p', project],
      { cwd: temp, encoding: 'utf8' },
    );
    assert.equal(run.error, undefined);
    const result = {
      name,
      exitCode: run.status,
      diagnostics: `${run.stdout ?? ''}${run.stderr ?? ''}`,
    };
    report.runs.push(result);
    return result;
  };
  const positive = compile('public contract assertions and native template ref', configFile);
  assert.equal(positive.exitCode, 0, positive.diagnostics);
  const negativeConfig = path.join(temp, 'tsconfig-negative.json');
  writeFileSync(
    negativeConfig,
    JSON.stringify({ ...config, include: ['UnsupportedSlot.vue'] }, null, 2),
  );
  const negative = compile('unsupported named slot is rejected', negativeConfig);
  assert.notEqual(negative.exitCode, 0);
  const diagnostics = negative.diagnostics.trim().split('\n').filter(Boolean);
  assert.equal(diagnostics.length, 1, negative.diagnostics);
  assert.match(diagnostics[0], /UnsupportedSlot\.vue\(\d+,\d+\): error TS2339:.*header/);
  report.passed = true;
} catch (error) {
  failure = error;
  report.failure = String(error);
} finally {
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  rmSync(temp, { recursive: true, force: true });
}
if (failure) throw failure;
console.log(
  'PASS published Theme:16 contract scenarios,11 reasoned negatives,native template ref and unsupported-slot rejection;zero source aliases',
);
