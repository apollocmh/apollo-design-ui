/** Published Descriptions types and all real demos, without source aliases. Run after the shared UI build. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-descriptions-published-types-'));
try {
  assert.ok(
    existsSync(path.join(root, 'packages/ui/dist/descriptions/index.d.ts')),
    'Build the integrated UI first',
  );
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  symlinkSync(path.join(root, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  for (const name of ['ui', 'theme', 'icons'])
    symlinkSync(
      path.join(root, `packages/${name}`),
      path.join(temp, `node_modules/@apollo-design/${name}`),
      'dir',
    );
  copyFileSync(
    path.join(root, 'tests/browser/fixtures/DescriptionsPublicContracts.vue'),
    path.join(temp, 'DescriptionsPublicContracts.vue'),
  );
  const demos = path.join(root, 'packages/ui/src/descriptions/demo');
  const files = readdirSync(demos).filter((file) => file.endsWith('.vue'));
  assert.equal(files.length, 13);
  for (const file of files) copyFileSync(path.join(demos, file), path.join(temp, `Demo-${file}`));
  writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2023', 'DOM'],
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
  writeFileSync(
    process.env.DESCRIPTIONS_TYPES_EVIDENCE ?? '/tmp/apollo-descriptions-published-types.json',
    `${JSON.stringify({ passed: true, demos: files, sourceAliases: false }, null, 2)}\n`,
  );
  console.log(
    'PASS published Descriptions/Item: five precise public types, typed slots, native StyleValue, semantic scope negatives and all 13 demos',
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
