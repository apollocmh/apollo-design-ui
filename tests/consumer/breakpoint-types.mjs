/** Verify reactive breakpoint getters and native consumers against published declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-breakpoint-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/grid/hooks/use-breakpoint.d.ts')),
    'Build UI first',
  );
  assert.equal(
    fs.existsSync(path.join(root, 'packages/ui/dist/grid/__tests__')),
    false,
    'Test fixtures must not enter published declarations',
  );
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/BreakpointNative.vue'),
    path.join(temp, 'Consumer.vue'),
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
    'PASS published breakpoint declarations: getter and nullable screens plus reactive Steps/Avatar/List Vue template; no source aliases or test declarations shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
