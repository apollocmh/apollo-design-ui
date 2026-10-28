/** SPACE_SOURCE=1 uses source aliases; default checks actual published declarations. No build side effects. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-space-types-'));
const source = process.env.SPACE_SOURCE === '1';
try {
  if (!source)
    assert.ok(
      fs.existsSync(path.join(root, 'packages/ui/dist/space/index.d.ts')),
      'Build UI before checking published declarations',
    );
  fs.mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  if (source) {
    fs.mkdirSync(path.join(temp, 'node_modules/@types'), { recursive: true });
    fs.symlinkSync(
      path.join(root, 'node_modules/@types/node'),
      path.join(temp, 'node_modules/@types/node'),
      'dir',
    );
    fs.symlinkSync(
      path.join(root, 'node_modules/vite'),
      path.join(temp, 'node_modules/vite'),
      'dir',
    );
  }
  for (const name of ['ui', 'theme', 'icons'])
    fs.symlinkSync(
      path.join(root, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  const demos = path.join(root, 'packages/ui/src/space/demo');
  for (const name of fs.readdirSync(demos).filter((name) => name.endsWith('.vue'))) {
    const content = fs.readFileSync(path.join(demos, name), 'utf8');
    assert.ok(
      content.includes("from '@apollo-design/ui'"),
      `${name} must consume the public entry`,
    );
    assert.equal(content.includes('_standin'), false);
    fs.writeFileSync(path.join(temp, name), content);
  }
  fs.writeFileSync(
    path.join(temp, 'Contracts.vue'),
    `<script setup lang="ts">
import { h, ref, type VNodeChild } from 'vue';
import { Space, SpaceCompact, SpaceAddon, type SpaceProps, type SpaceRef, type SpaceCompactRef, type SpaceAddonRef } from '@apollo-design/ui';
const separator: VNodeChild = [h('strong', 'Data'), 0, [false, null]];
const space = ref<SpaceRef | null>(null);
const compact = ref<SpaceCompactRef | null>(null);
const addon = ref<SpaceAddonRef | null>(null);
const aliases: [typeof SpaceCompact, typeof SpaceAddon] = [Space.Compact, Space.Addon];
const props: SpaceProps = { split: h('b', '|'), separator, size: [0, 'middle'], wrap: true };
// @ts-expect-error Content data is not a render callback; use the separator slot.
const callback: SpaceProps = { separator: () => 'text' };
// @ts-expect-error Root class is a native Vue attr.
const legacy: SpaceProps = { className: 'legacy' };
// @ts-expect-error Orientation only accepts horizontal or vertical.
const direction: SpaceProps = { orientation: 'diagonal' };
void callback; void legacy; void direction; void aliases;
</script>
<template>
  <Space ref="space" v-bind="props" :class="['native', { active: true }]" :style="['color: red', { padding: '2px' }]"><span>A</span><span>B</span><template #separator><strong>Slot</strong>{{ 0 }}</template></Space>
  <SpaceCompact ref="compact" orientation="vertical" size="small"><SpaceAddon ref="addon" variant="filled" status="warning">Cell {{ 0 }}</SpaceAddon></SpaceCompact>
</template>`,
  );
  const paths = source
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
        ].map((name) => [`@apollo-design/${name}`, [path.join(root, `packages/${name}/src`)]]),
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
          noUncheckedIndexedAccess: true,
          noEmit: true,
          skipLibCheck: true,
          types: source ? ['vite/client', 'node'] : [],
          baseUrl: temp,
          paths,
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
    `PASS Space ${source ? 'source' : 'published'} public Vue contracts and all 15 real demos`,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
