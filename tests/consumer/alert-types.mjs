/** Check original Alert SFCs and native slots/events against source or published declarations. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = process.env.ALERT_SOURCE === '1';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-alert-types-'));
try {
  fs.symlinkSync(path.join(repository, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  if (!source)
    assert.ok(
      fs.existsSync(path.join(repository, 'packages/ui/dist/alert/Alert.d.ts')),
      'Build UI first; this script never builds packages',
    );
  const paths = {};
  for (const name of fs.readdirSync(path.join(repository, 'packages'))) {
    const entry = path.join(
      repository,
      `packages/${name}/${source ? 'src/index.ts' : 'dist/index.d.ts'}`,
    );
    if (fs.existsSync(entry)) paths[`@apollo-design/${name}`] = [entry];
  }
  paths['@apollo-design/ui/alert'] = [
    path.join(repository, `packages/ui/${source ? 'src/alert/index.ts' : 'dist/alert/index.d.ts'}`),
  ];
  const demos = fs
    .readdirSync(path.join(repository, 'packages/ui/src/alert/demo'))
    .filter((x) => x.endsWith('.vue'));
  assert.equal(demos.length, 15);
  fs.writeFileSync(
    path.join(temp, 'Contracts.ts'),
    `
import { Alert, AlertErrorBoundary } from '@apollo-design/ui';
import type { AlertProps, AlertRef, AlertSlots, ErrorBoundarySlots } from '@apollo-design/ui';
import ChildAlert, { Alert as NamedChildAlert, AlertErrorBoundary as ChildBoundary } from '@apollo-design/ui/alert';
import type { AlertSlots as ChildSlots, ErrorBoundarySlots as ChildBoundarySlots } from '@apollo-design/ui/alert';
const staticBoundary: typeof AlertErrorBoundary = Alert.ErrorBoundary;
const childComponent: typeof Alert = NamedChildAlert;
const childBoundary: typeof AlertErrorBoundary = ChildAlert.ErrorBoundary;
const namedBoundary: typeof AlertErrorBoundary = ChildBoundary;
const props: AlertProps = { closeIcon: 0, onClose: event => event.preventDefault(), onAfterClose: () => {} };
const slots: AlertSlots = { title: () => ['Full', 0], description: () => false, closeIcon: () => [] };
const boundary: ErrorBoundarySlots = { default: () => ['First', 'Second'] };
const childSlots: ChildSlots = slots;
const childBoundarySlots: ChildBoundarySlots = boundary;
const native = (api: AlertRef) => api.nativeElement?.focus();
// @ts-expect-error Alert has five named content slots, no implicit default title.
const wrongSlots: AlertSlots = { default: () => 'Title' };
// @ts-expect-error A close notification carries a MouseEvent.
const wrongEvent: AlertProps = { onClose: (event: KeyboardEvent) => event.key };
// @ts-expect-error Text title props do not accept a top-level render function.
const wrongContent: AlertProps = { title: () => 'Title' };
void [staticBoundary, childComponent, childBoundary, namedBoundary, props, slots, boundary, childSlots, childBoundarySlots, native, wrongSlots, wrongEvent, wrongContent];
`,
  );
  fs.writeFileSync(
    path.join(temp, 'ChildConsumer.vue'),
    `<script setup lang="ts">
import Alert, { AlertErrorBoundary } from '@apollo-design/ui/alert';
const observe = (event: MouseEvent) => event.preventDefault();
</script>
<template><Alert closable @close="observe"><template #title><strong>Child entry</strong>{{ 0 }}</template><template #description><em>Complete</em> content</template><template #icon><i aria-hidden="true" /></template><template #action><button type="button">Save</button></template><template #closeIcon>Dismiss</template></Alert><AlertErrorBoundary><span>Healthy</span><span> fragment</span></AlertErrorBoundary></template>`,
  );
  fs.writeFileSync(
    path.join(temp, 'Consumer.vue'),
    `<script setup lang="ts">
import { Alert, AlertErrorBoundary, type AlertRef } from '@apollo-design/ui';
import { ref } from 'vue';
const api = ref<AlertRef|null>(null);
const nativeClick = (event: MouseEvent) => event.preventDefault();
const finished = () => {};
</script>
<template><Alert ref="api" closable @close="nativeClick" @after-close="finished"><template #title><strong>Business</strong>{{ 0 }}</template><template #description><span>Complete</span><em> description</em></template><template #icon><i aria-hidden="true"/></template><template #action><button type="button">Save</button><button type="button">More</button></template><template #closeIcon>Dismiss</template></Alert><AlertErrorBoundary><span>First</span><span>Second</span></AlertErrorBoundary></template>`,
  );
  fs.writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          types: ['node', 'vite/client'],
          baseUrl: repository,
          paths,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
        include: [
          path.join(temp, '*.vue'),
          path.join(temp, '*.ts'),
          ...demos.map((x) => path.join(repository, 'packages/ui/src/alert/demo', x)),
          path.join(repository, 'tests/browser/fixtures/AlertContracts.vue'),
        ],
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      path.join(repository, 'node_modules/vue-tsc/bin/vue-tsc.js'),
      '-p',
      path.join(temp, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );
  console.log(
    `PASS ${source ? 'source' : 'published'} Alert declarations: public root and child entries, all15 original SFC files, actual contract fixture, five complete slots, native events/ref, static and named boundary, positive and negative consumers`,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
