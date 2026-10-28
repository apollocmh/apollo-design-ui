/** Verify native Breadcrumb scoped items in a Vue template against published declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-breadcrumb-types-'));
try {
  const sourceMode = process.env.BREADCRUMB_SOURCE === '1';
  if (!sourceMode) {
    assert.ok(
      fs.existsSync(path.join(root, 'packages/ui/dist/breadcrumb/Breadcrumb.d.ts')),
      'Build UI first',
    );
    assert.equal(
      fs.existsSync(path.join(root, 'packages/ui/dist/breadcrumb/__tests__')),
      false,
      'Test fixtures must not enter published declarations',
    );
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const source = fs.readFileSync(
    path.join(root, 'packages/ui/src/breadcrumb/demo/scoped-item.vue'),
    'utf8',
  );
  assert.ok(source.includes("from '@apollo-design/ui'"));
  fs.writeFileSync(path.join(temp, 'Consumer.vue'), source);
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/breadcrumb/demo/native.vue'),
    path.join(temp, 'Native.vue'),
  );
  const demoDir = path.join(root, 'packages/ui/src/breadcrumb/demo');
  const demoNames = fs.readdirSync(demoDir).filter((name) => name.endsWith('.vue'));
  assert.equal(
    demoNames.length,
    11,
    'Keep every original Breadcrumb demo in consumer type coverage',
  );
  for (const name of demoNames)
    fs.copyFileSync(path.join(demoDir, name), path.join(temp, `demo-${name}`));
  fs.writeFileSync(
    path.join(temp, 'Contracts.vue'),
    `<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, type BreadcrumbItemProps, type BreadcrumbMenuItem } from '@apollo-design/ui';
const item: BreadcrumbMenuItem = { key: 0, href: '#target', disabled: true, onClick: ({ key, domEvent }) => { void key; void domEvent; } };
// @ts-expect-error Native Item class replaces the old React-style content prop.
const invalidClass: BreadcrumbItemProps = { className: 'legacy' };
// @ts-expect-error Native style is an attr and no longer a component-specific prop.
const invalidStyle: BreadcrumbItemProps = { style: { color: 'red' } };
// @ts-expect-error Menu callbacks receive MenuInfo, not a DOM MouseEvent.
const invalidEvent: BreadcrumbMenuItem = { onClick: (_event: MouseEvent) => {} };
void invalidClass; void invalidStyle; void invalidEvent;
</script>
<template>
  <Breadcrumb :items="[{ title: 'A', menu: { items: [item] } } ]">
    <template #separator><span>›</span></template>
    <template #dropdownIcon><b>↓</b></template>
    <template #itemRender="{ route, paths, href }"><a :href="href" :data-path="paths.join('/')">{{ route.title }}</a></template>
  </Breadcrumb>
  <Breadcrumb>
    <BreadcrumbItem :class="['native', { active: true }]" :style="['color: red', { padding: '2px' }]">
      <template #default>Native</template><template #separator><b>|</b></template><template #dropdownIcon><b>↓</b></template>
    </BreadcrumbItem>
    <BreadcrumbSeparator><span>·</span></BreadcrumbSeparator>
  </Breadcrumb>
</template>`,
  );
  const sourcePaths = sourceMode
    ? Object.fromEntries(
        [
          'ui',
          'utils',
          'theme',
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
        ].map((name) => ['@apollo-design/' + name, [path.join(root, 'packages/' + name + '/src')]]),
      )
    : {};

  fs.writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2023', 'DOM', 'DOM.Iterable'],
          strict: true,
          noUncheckedIndexedAccess: sourceMode,
          useUnknownInCatchVariables: true,
          noEmit: true,
          skipLibCheck: true,
          types: sourceMode ? ['vite/client', 'node'] : [],
          baseUrl: temp,
          paths: sourcePaths,
        },
        include: ['*.vue'],
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'),
      '-p',
      path.join(temp, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );
  console.log(
    `PASS ${sourceMode ? 'source' : 'published'} Breadcrumb declarations: all11 original demos, named content slots, route/path/href inference, native attrs and menu callback negative cases${sourceMode ? '' : '; no test fixtures shipped'}`,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
