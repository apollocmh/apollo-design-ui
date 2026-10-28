import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-badge-public-types-'));
try {
  assert.ok(fs.existsSync(path.join(root, 'packages/ui/dist/badge/index.d.ts')), 'Build UI first');
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/badge/__tests__')), false);
  fs.mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  for (const name of ['ui', 'theme', 'icons'])
    fs.symlinkSync(
      path.join(root, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/BadgePublicContracts.vue'),
    path.join(temp, 'BadgePublicContracts.vue'),
  );
  const demos = path.join(root, 'packages/ui/src/badge/demo');
  const files = fs.readdirSync(demos).filter((file) => file.endsWith('.vue'));
  assert.equal(files.length, 13);
  for (const file of files)
    fs.copyFileSync(path.join(demos, file), path.join(temp, `Demo-${file}`));
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
    'PASS published Badge/Ribbon/Badge.Ribbon: typed slots and readonly refs, native StyleValue, conditional empty content and all 13 real demos; no source aliases',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
