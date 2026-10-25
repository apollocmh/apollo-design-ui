/** Public overlay slots and content data against built declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-overlay-content-types-'));
try {
  fs.mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  for (const name of ['ui', 'icons', 'theme']) {
    fs.symlinkSync(
      path.join(root, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  }
  fs.symlinkSync(
    path.join(root, 'packages/ui/node_modules/vue'),
    path.join(temp, 'node_modules/vue'),
    'dir',
  );
  for (const name of ['tooltip', 'popover', 'popconfirm']) {
    assert.ok(
      fs.existsSync(path.join(root, `packages/ui/dist/${name}/interface.d.ts`)),
      'Build UI first',
    );
    assert.equal(fs.existsSync(path.join(root, `packages/ui/dist/${name}/__tests__`)), false);
    fs.copyFileSync(
      path.join(root, `packages/ui/src/${name}/demo/render-panel.vue`),
      path.join(temp, `${name}.vue`),
    );
  }
  const fixture = fs.readFileSync(
    path.join(root, 'packages/ui/src/tooltip/__tests__/fixtures/OverlaySlots.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'Consumer.vue'),
    fixture.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  const callbacks = fs.readFileSync(
    path.join(root, 'packages/ui/src/tooltip/__tests__/fixtures/ConfirmCallbacks.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ConfirmCallbacks.vue'),
    callbacks.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/OverlayAttrs.vue'),
    path.join(temp, 'NativeAttrs.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/popconfirm/demo/icon.vue'),
    path.join(temp, 'NativeIcon.vue'),
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
    'PASS six published overlay components: native content/icon slots, VNode/zero data, renderer rejection, four template demos and native styles through package exports',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
