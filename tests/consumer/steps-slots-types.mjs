/** Verify native Steps scoped slots and inline content against published declarations, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-steps-slots-types-'));
try {
  assert.ok(fs.existsSync(path.join(root, 'packages/ui/dist/steps/Steps.d.ts')), 'Build UI first');
  assert.equal(
    fs.existsSync(path.join(root, 'packages/ui/dist/steps/__tests__')),
    false,
    'Test fixtures must not enter published declarations',
  );
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/steps/demo/native-slots.vue'),
    path.join(temp, 'Consumer.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/steps/demo/customized-progress-dot.vue'),
    path.join(temp, 'ProgressDot.vue'),
  );
  const exactSlots = fs.readFileSync(
    path.join(root, 'packages/ui/src/steps/__tests__/fixtures/StepsSlots.vue'),
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
    'PASS published Steps declarations: all four exact native scopes and native template demos; no source aliases or test declarations shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
