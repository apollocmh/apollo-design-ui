/** Mentions native popup scope against built package exports, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-mentions-popup-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/mentions/interface.d.ts')),
    'Build UI first',
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/mentions/__tests__')), false);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/mentions/demo/popupRender.vue'),
    path.join(temp, 'Consumer.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/MentionsBindings.vue'),
    path.join(temp, 'NativeBindings.vue'),
  );
  const fixture = fs.readFileSync(
    path.join(root, 'packages/ui/src/mentions/__tests__/fixtures/PopupSlot.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ExactPopup.vue'),
    fixture.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  const empty = fs.readFileSync(
    path.join(root, 'packages/ui/src/mentions/__tests__/fixtures/EmptySlot.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'EmptySlot.vue'),
    empty.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/mentions/demo/async.vue'),
    path.join(temp, 'AsyncConsumer.vue'),
  );
  const core = fs.readFileSync(
    path.join(root, 'packages/ui/src/mentions/__tests__/fixtures/CoreEvents.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'CoreEvents.vue'),
    core.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/MentionsKeyboard.vue'),
    path.join(temp, 'MentionsKeyboard.vue'),
  );
  const native = fs.readFileSync(
    path.join(root, 'packages/ui/src/mentions/__tests__/fixtures/NativeEvents.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'NativeEvents.vue'),
    native.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/MentionsNativeEvents.vue'),
    path.join(temp, 'MentionsNativeEvents.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/MentionsEvents.vue'),
    path.join(temp, 'MentionsEvents.vue'),
  );
  fs.writeFileSync(
    path.join(temp, 'Types.ts'),
    `import type { MentionsProps } from '@apollo-design/ui';
    // @ts-expect-error Content functions migrate directly to native slots.
    const old: MentionsProps = { popupRender: () => null };
    void old;
  `,
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
    'PASS published Mentions contracts: exact popup context, unknown-slot/old-renderer rejection, StyleValue bindings, exact emit payloads, native listeners and empty content slots; no source aliases or test declarations shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
