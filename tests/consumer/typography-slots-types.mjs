/** Typography current native slots and refs against published declarations. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-typography-slots-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/typography/index.d.ts')),
    'Build UI first',
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/typography/__tests__')), false);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/typography/demo/editable.vue'),
    path.join(temp, 'EditableDemo.vue'),
  );
  const fixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/TypographySlots.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'TypographySlots.vue'),
    fixture.replace('../../../packages/ui/src/typography/demo/editable.vue', './EditableDemo.vue'),
  );
  fs.writeFileSync(
    path.join(temp, 'Refs.vue'),
    `<script setup lang="ts">
import { Text, Title, Paragraph, Link, Typography, type TypographyRef } from '@apollo-design/ui';
import { ref } from 'vue';
const text = ref('Current text');
const paragraph = ref<TypographyRef | null>(null);
const show = ref(true);
</script>
<template>
  <Typography><Title :level="2">{{ text }}</Title></Typography>
  <Paragraph ref="paragraph" :copyable="true" :editable="true" aria-label="Current text editor"><template v-if="show" #default>{{ text }}</template></Paragraph>
  <Text ellipsis>{{ text }}</Text><Link href="#current-text">{{ text }}</Link>
  <output>{{ paragraph?.nativeElement?.tagName }}</output>
</template>`,
  );
  fs.writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2022', 'DOM'],
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
          paths: {},
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
    'PASS published Typography: five entry templates, conditional default slots, current copy/edit/ellipsis bindings and nativeElement refs; no source aliases or test declarations shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
