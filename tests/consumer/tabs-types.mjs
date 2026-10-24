/** Verify named Tabs popup slots in a Vue template against published declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-tabs-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/tabs/Tabs.vue.d.ts')),
    'Build UI first',
  );
  assert.equal(
    fs.existsSync(path.join(root, 'packages/ui/dist/tabs/__tests__')),
    false,
    'Test fixtures must not enter published declarations',
  );
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const source = fs.readFileSync(
    path.join(root, 'packages/ui/src/tabs/demo/popup-render.vue'),
    'utf8',
  );
  assert.ok(source.includes("from '@apollo-design/ui'"));
  fs.writeFileSync(path.join(temp, 'Consumer.vue'), source);
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
        include: ['Consumer.vue'],
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
    'PASS published Tabs declarations: named popup slot, current hidden tabs and onClose; no test fixtures shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
