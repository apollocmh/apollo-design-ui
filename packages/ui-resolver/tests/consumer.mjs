/** Published tarballs, real Vite transforms/dev DOM/SSR, and generated declarations. No package rebuilds. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const started = performance.now();
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(packageRoot, '../..');
const args = process.argv.slice(2);
const themes = args.includes('--themes');
const positional = args.filter((argument) => argument !== '--themes');
const uiRoot = resolve(positional[0] ?? resolve(repository, 'packages/ui'));
const output = resolve(
  positional[1] ?? mkdtempSync(resolve(tmpdir(), 'apollo-ui-resolver-consumer-')),
);
const stage = resolve(output, 'pack-stage');
const tarballs = resolve(output, 'tarballs');
const consumer = resolve(output, 'consumer');
const pnpm = process.env.APOLLO_PNPM ?? 'pnpm';
const sourceFiles = [];
const metrics = {
  commands: [],
  builds: [],
  browser: {},
  scope: themes
    ? 'Published import/style/Node/SSR contract and 24 preset/import/appearance consumers'
    : 'Independent import/style/Node/SSR contract; theme matrix not requested',
};
mkdirSync(output, { recursive: true });
const write = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, value);
};
const json = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const run = (command, args, cwd, name) => {
  const start = performance.now();
  const record = {
    command: [command, ...args].join(' '),
    cwd,
    log: resolve(output, `${name}.log`),
  };
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    write(record.log, stdout);
    const result = {
      ...record,
      exitCode: 0,
      signal: null,
      durationMs: Math.round(performance.now() - start),
    };
    metrics.commands.push(result);
    return result;
  } catch (error) {
    write(record.log, `${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error}`);
    metrics.commands.push({
      ...record,
      exitCode: error.status ?? null,
      signal: error.signal ?? null,
      durationMs: Math.round(performance.now() - start),
    });
    throw error;
  }
};
const hashTree = (directory) => {
  const hash = createHash('sha256');
  const visit = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else {
        hash.update(file.slice(directory.length));
        hash.update(readFileSync(file));
      }
    }
  };
  visit(directory);
  return hash.digest('hex');
};

let browser, server, failure;
try {
  const ui = readJson(resolve(uiRoot, 'package.json'));
  const uiRequire = createRequire(resolve(uiRoot, 'package.json'));
  const packages = new Map([
    [ui.name, uiRoot],
    ['@apollo-design/ui-resolver', packageRoot],
  ]);
  for (const dependency of Object.keys(ui.dependencies))
    if (dependency.startsWith('@apollo-design/'))
      packages.set(dependency, dirname(uiRequire.resolve(`${dependency}/package.json`)));
  // Preserve workspace/catalog publishing semantics without writing into any source package.
  write(
    resolve(stage, 'pnpm-workspace.yaml'),
    readFileSync(resolve(repository, 'pnpm-workspace.yaml')),
  );
  json(resolve(stage, 'package.json'), {
    name: 'resolver-pack-stage',
    private: true,
    packageManager: 'pnpm@12.4.2',
  });
  for (const entry of readdirSync(resolve(repository, 'packages'), { withFileTypes: true })) {
    const manifest = resolve(repository, 'packages', entry.name, 'package.json');
    if (entry.isDirectory() && existsSync(manifest))
      cpSync(manifest, resolve(stage, 'packages', entry.name, 'package.json'), { recursive: true });
  }
  for (const [name, directory] of packages) {
    const target = resolve(stage, 'packages', name.replace('@apollo-design/', ''));
    mkdirSync(target, { recursive: true });
    cpSync(resolve(directory, 'package.json'), resolve(target, 'package.json'));
  }
  const workspace = new Map(
    readdirSync(resolve(stage, 'packages')).map((directory) => {
      const location = resolve(stage, 'packages', directory);
      return [readJson(resolve(location, 'package.json')).name, location];
    }),
  );
  for (const directory of workspace.values()) {
    const manifest = readJson(resolve(directory, 'package.json'));
    for (const dependencies of [
      manifest.dependencies,
      manifest.devDependencies,
      manifest.peerDependencies,
    ]) {
      for (const [name, range] of Object.entries(dependencies ?? {})) {
        if (!range.startsWith('workspace:')) continue;
        const target = workspace.get(name);
        assert.ok(target, `Missing publishing workspace metadata: ${name}`);
        const link = resolve(directory, 'node_modules', name);
        mkdirSync(dirname(link), { recursive: true });
        if (!existsSync(link)) symlinkSync(target, link, 'dir');
      }
    }
  }
  const dependencyTarballs = {};
  for (const [name, directory] of packages) {
    const manifest = readJson(resolve(directory, 'package.json'));
    const target = resolve(stage, 'packages', name.replace('@apollo-design/', ''));
    mkdirSync(target, { recursive: true });
    const before = hashTree(resolve(directory, 'dist'));
    cpSync(resolve(directory, 'dist'), resolve(target, 'dist'), { recursive: true });
    for (const file of ['README.md', 'LICENSE'])
      if (existsSync(resolve(directory, file)))
        cpSync(resolve(directory, file), resolve(target, file));
    assert.equal(
      hashTree(resolve(directory, 'dist')),
      before,
      `${name}: producer changed while copying`,
    );
    sourceFiles.push({ name, directory, distDigest: before });
    mkdirSync(tarballs, { recursive: true });
    run(
      pnpm,
      ['--filter', name, 'pack', '--pack-destination', tarballs],
      stage,
      `pack-${name.replace('@apollo-design/', '')}`,
    );
    dependencyTarballs[name] =
      `file:${resolve(tarballs, `${name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`;
  }
  json(resolve(consumer, 'package.json'), {
    name: 'apollo-resolver-published-consumer',
    private: true,
    type: 'module',
    dependencies: {
      ...Object.fromEntries(
        Object.entries(dependencyTarballs).filter(
          ([name]) => name !== '@apollo-design/ui-resolver',
        ),
      ),
      vue: '3.5.42',
      '@vue/server-renderer': '3.5.42',
    },
    devDependencies: {
      '@apollo-design/ui-resolver': dependencyTarballs['@apollo-design/ui-resolver'],
      'unplugin-vue-components': '32.1.0',
      vite: '8.3.0',
      '@vitejs/plugin-vue': '6.0.9',
      typescript: '5.9.3',
      'vue-tsc': '3.3.11',
    },
  });
  write(
    resolve(consumer, 'pnpm-workspace.yaml'),
    `packages:\n  - '.'\noverrides:\n${Object.entries(dependencyTarballs)
      .map(([name, spec]) => `  '${name}': '${spec}'`)
      .join('\n')}\n`,
  );
  metrics.install = run(pnpm, ['install', '--ignore-scripts'], consumer, 'install');
  const require = createRequire(resolve(consumer, 'package.json'));
  write(
    resolve(consumer, 'tools.mjs'),
    `export {build,createServer} from 'vite';export {default as vue} from '@vitejs/plugin-vue';export {default as Components} from 'unplugin-vue-components/vite';export {ApolloResolver} from '@apollo-design/ui-resolver';`,
  );
  const { build, createServer, vue, Components, ApolloResolver } = await import(
    pathToFileURL(resolve(consumer, 'tools.mjs')).href
  );
  write(
    resolve(consumer, 'node-pure.mjs'),
    `import assert from 'node:assert/strict';Object.defineProperty(globalThis,'window',{get(){throw Error('window access')}});Object.defineProperty(globalThis,'document',{get(){throw Error('document access')}});const {ApolloResolver}=await import('@apollo-design/ui-resolver');assert.equal((await ApolloResolver().resolve('AButton')).from,'@apollo-design/ui/button');assert.equal(await ApolloResolver().resolve('AUnknown'),undefined);console.log('Published Node resolver: no DOM access');`,
  );
  metrics.node = run(process.execPath, ['node-pure.mjs'], consumer, 'node-pure');
  metrics.publishedContract = run(
    process.execPath,
    [resolve(packageRoot, 'tests/published-contract.mjs'), consumer],
    repository,
    'published-contract',
  );
  write(
    resolve(consumer, 'index.html'),
    '<!doctype html><html><head><title>Apollo Resolver consumer</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module" src="/src/main.ts"></script></body></html>',
  );
  write(
    resolve(consumer, 'src/main.ts'),
    `import {createApp} from 'vue';import '@apollo-design/theme/tokens.css';import App from './App.vue';createApp(App).mount('#app');`,
  );
  write(
    resolve(consumer, 'src/components/ALocalOnly.vue'),
    '<template><strong data-local>Local component</strong></template>',
  );
  const auto = '<template><a-button type="primary" data-auto>Auto button</a-button></template>';
  const manual =
    '<script setup lang="ts">import {Button} from "@apollo-design/ui/button";import "@apollo-design/ui/button/style.css";</script><template><Button type="primary" data-auto>Auto button</Button></template>';
  const compound = `<script setup lang="ts">
import {Button as ManualButton} from '@apollo-design/ui/button';
import '@apollo-design/ui/base.css';
import '@apollo-design/ui/button/structure.css';
const columns = [{title:'Name', dataIndex:'name', key:'name'}];
const data = [{key:'one', name:'First row'}];
</script>
<template>
<AButton data-auto>Auto button</AButton>
<ManualButton data-manual>Manual button</ManualButton>
<a-input-search placeholder="Search" />
<AAutoComplete :options="[{value:'Alpha'}]" placeholder="Complete" />
<ATimePicker aria-label="Time" />
<APopconfirm title="Confirm change?" :open="true"><AButton>Popup trigger</AButton></APopconfirm>
<ATable :columns="columns" :data-source="data" :pagination="false">
  <template #summary>
    <ATableSummary><ATableSummaryRow><ATableSummaryCell :index="0">Summary cell</ATableSummaryCell></ATableSummaryRow></ATableSummary>
  </template>
</ATable>
<ALocalOnly />
</template>`;
  const config = (styles = true) => ({
    root: consumer,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      Components({
        dirs: ['src/components'],
        resolvers: [ApolloResolver({ importStyle: styles })],
        dts: false,
      }),
    ],
  });
  const builtModules = new Map();
  for (const [id, source, styles] of [
    ['auto-button', auto, true],
    ['manual-button', manual, false],
    ['compound', compound, true],
  ]) {
    write(resolve(consumer, 'src/App.vue'), source);
    const retained = [];
    const options = config(styles);
    await build({
      ...options,
      build: { outDir: `dist-${id}`, emptyOutDir: true },
      plugins: [
        ...options.plugins,
        {
          name: 'inspect-published-modules',
          generateBundle(_options, bundle) {
            for (const item of Object.values(bundle))
              if (item.type === 'chunk')
                for (const [file, module] of Object.entries(item.modules))
                  if (module.renderedLength > 0) retained.push(file);
          },
        },
      ],
    });
    assert.ok(
      !retained.some((file) => /\/(ui-resolver|unplugin-vue-components|unplugin)\//.test(file)),
      'Build-time packages must not enter browser chunks',
    );
    const uiModules = retained
      .filter((file) => file.includes('/@apollo-design/ui/') && /\.(mjs|vue)$/.test(file))
      .map((file) => file.split('/@apollo-design/ui/')[1])
      .sort();
    builtModules.set(id, uiModules);
    metrics.builds.push({ id, retainedUiModules: uiModules });
  }
  assert.deepEqual(
    builtModules.get('auto-button'),
    builtModules.get('manual-button'),
    'Resolver must not retain UI modules beyond a manual Button import',
  );
  write(
    resolve(consumer, 'src/entry-server.ts'),
    `import {createSSRApp} from 'vue';import {renderToString} from '@vue/server-renderer';import App from './App.vue';export const render=()=>renderToString(createSSRApp(App));`,
  );
  // The plugin writes declarations asynchronously. A normal CLI process drains its
  // pending writes before exit; synchronous typechecking must start after that exit.
  write(
    resolve(consumer, 'build-server.mjs'),
    `import {build,vue,Components,ApolloResolver} from './tools.mjs';
await build({
  configFile:false,logLevel:'warn',
  plugins:[vue(),Components({dirs:['src/components'],resolvers:[ApolloResolver()],dts:'src/components.d.ts'})],
  build:{ssr:'src/entry-server.ts',outDir:'dist-server',emptyOutDir:true}
});`,
  );
  metrics.ssrBuild = run(process.execPath, ['build-server.mjs'], consumer, 'ssr-build');
  const rendered = await import(
    pathToFileURL(resolve(consumer, 'dist-server/entry-server.js')).href
  );
  const html = await rendered.render();
  assert.ok(html.includes('Auto button') && html.includes('apollo-btn'));
  metrics.ssr = { passed: true, bytes: html.length };
  json(resolve(consumer, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.d.ts'],
  });
  write(
    resolve(consumer, 'src/TypeProbe.vue'),
    '<script setup lang="ts">const label = "Typed global component";</script>\n<template>\n<AButton type="primary">{{ label }}</AButton>\n<!-- @vue-expect-error Button type is a public union. -->\n<AButton type="not-a-button-type" />\n<ATableSummaryCell :index="0">Typed summary</ATableSummaryCell>\n<!-- @vue-expect-error Summary cell index is a number. -->\n<ATableSummaryCell index="invalid" />\n</template>',
  );
  metrics.types = run(
    process.execPath,
    [require.resolve('vue-tsc/bin/vue-tsc.js'), '--noEmit', '-p', 'tsconfig.json'],
    consumer,
    'published-types',
  );
  server = await createServer(config());
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  await page.addInitScript(() => {
    window.resolverErrors = [];
    window.addEventListener('error', (event) => window.resolverErrors.push(event.message));
    window.addEventListener('unhandledrejection', (event) =>
      window.resolverErrors.push(String(event.reason)),
    );
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('[data-auto]').waitFor();
  await page.locator('.apollo-popconfirm').waitFor();
  assert.equal(await page.locator('[data-local]').textContent(), 'Local component');
  assert.equal(await page.locator('.apollo-table-summary td').textContent(), 'Summary cell');
  assert.ok(await page.locator('.apollo-select-auto-complete').count());
  await page.locator('.apollo-picker input').click();
  await page.locator('.apollo-picker-dropdown').waitFor();
  metrics.browser.buttonStyleOwners = await page.evaluate(() =>
    [...document.querySelectorAll('style[data-vite-dev-id]')]
      .filter((style) =>
        [...style.sheet.cssRules].some(
          (rule) =>
            'selectorText' in rule &&
            rule.selectorText.split(',').some((selector) => selector.trim() === '.apollo-btn'),
        ),
      )
      .map((style) => style.dataset.viteDevId),
  );
  errors.push(...(await page.evaluate(() => window.resolverErrors)));
  assert.deepEqual(errors, [], 'Published consumer browser diagnostics');
  assert.equal(
    metrics.browser.buttonStyleOwners.length,
    1,
    'Button structural CSS must not be repeated inside other component stylesheets',
  );
  metrics.browser.passed = true;
  if (themes) {
    await browser.close();
    browser = undefined;
    await server.close();
    server = undefined;
    metrics.themeMatrix = run(
      process.execPath,
      [resolve(packageRoot, 'tests/theme-matrix.mjs'), consumer, resolve(output, 'theme-matrix')],
      repository,
      'theme-matrix',
    );
  }
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  for (const source of sourceFiles) {
    source.finalDistDigest = hashTree(resolve(source.directory, 'dist'));
    if (source.finalDistDigest !== source.distDigest)
      failure ??= new Error(`${source.name}: producer changed during consumer verification`);
  }
  const result = {
    exitCode: failure ? 1 : 0,
    durationMs: Math.round(performance.now() - started),
    output,
    sourceFiles,
    metrics,
    ...(failure ? { failure: failure.stack ?? String(failure) } : {}),
  };
  json(resolve(output, 'result.json'), result);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.exitCode;
}
