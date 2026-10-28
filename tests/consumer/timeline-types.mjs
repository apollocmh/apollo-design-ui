/** Verify current Timeline/Steps props and semantic functions against published declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-timeline-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/timeline/Timeline.d.ts')),
    'Build UI first',
  );
  assert.equal(
    fs.existsSync(path.join(root, 'packages/ui/dist/timeline/__tests__')),
    false,
    'Test fixtures must not enter published declarations',
  );
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/TimelineNative.vue'),
    path.join(temp, 'Consumer.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/timeline/demo/native-slots.vue'),
    path.join(temp, 'Slots.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/TimelineContracts.vue'),
    path.join(temp, 'Contracts.vue'),
  );
  fs.writeFileSync(
    path.join(temp, 'Contracts.ts'),
    `import type { TimelineItemType, TimelineProps, TimelineRef } from '@apollo-design/ui';
const item: TimelineItemType = { key: 0, title: 0, content: false, icon: '', position: 'right', classNames: { root: 'row', rail: 'rail' } };
const props: TimelineProps = { pending: 0, pendingDot: false, items: [item] };
const useRef = (api: TimelineRef) => api.nativeElement?.focus();
// @ts-expect-error Timeline has no rendered subtitle semantic region
const invalidItem: TimelineItemType = { styles: { subtitle: { color: 'red' } } };
void [props, useRef, invalidItem];
`,
  );
  const exactSlots = fs.readFileSync(
    path.join(root, 'packages/ui/src/timeline/__tests__/fixtures/TimelineSlots.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ExactSlots.vue'),
    exactSlots.replace("from '../../../index'", "from '@apollo-design/ui'"),
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
          baseUrl: temp,
          paths: {},
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
      path.join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'),
      '-p',
      path.join(temp, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );
  console.log(
    'PASS published Timeline declarations: current Timeline/Steps props, typed semantic functions and all three native item slots; no test fixtures shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
