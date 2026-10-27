/** Verify current List/Spin/QRCode/Statistic/Skeleton/Result/Button consumers against published declarations without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-list-types-'));
try {
  assert.ok(
    fs.existsSync(path.join(root, 'packages/ui/dist/list/List.vue.d.ts')),
    'Build UI first',
  );
  assert.equal(
    fs.existsSync(path.join(root, 'packages/ui/dist/list/__tests__')),
    false,
    'Test fixtures must not enter published declarations',
  );
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const source = fs.readFileSync(
    path.join(root, 'packages/ui/src/list/__tests__/fixtures/ListSlots.vue'),
    'utf8',
  );
  assert.ok(source.includes("from '../../../index'"));
  fs.writeFileSync(
    path.join(temp, 'Consumer.vue'),
    source.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.writeFileSync(
    path.join(temp, 'SpinConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/SpinContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/spin/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'QRCodeConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/QRCodeContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/qr-code/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'StatisticConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/StatisticContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/statistic/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'SkeletonConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/SkeletonContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/skeleton/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'ResultConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/ResultContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/result/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'ButtonConsumer.vue'),
    fs.readFileSync(path.join(root, 'tests/browser/fixtures/ButtonContractAudit.vue'), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/button/__tests__')), false);
  fs.writeFileSync(
    path.join(temp, 'CompoundConsumer.ts'),
    "import { Statistic, StatisticTimer, StatisticCountdown, Skeleton, SkeletonAvatar, SkeletonButton, SkeletonInput, SkeletonImage, SkeletonNode } from '@apollo-design/ui';\nconst timer: typeof StatisticTimer = Statistic.Timer;\nconst countdown: typeof StatisticCountdown = Statistic.Countdown;\nconst avatar: typeof SkeletonAvatar = Skeleton.Avatar;\nconst button: typeof SkeletonButton = Skeleton.Button;\nconst input: typeof SkeletonInput = Skeleton.Input;\nconst image: typeof SkeletonImage = Skeleton.Image;\nconst node: typeof SkeletonNode = Skeleton.Node;\nvoid timer; void countdown; void avatar; void button; void input; void image; void node;\n",
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
        include: [
          'Consumer.vue',
          'SpinConsumer.vue',
          'QRCodeConsumer.vue',
          'StatisticConsumer.vue',
          'SkeletonConsumer.vue',
          'ResultConsumer.vue',
          'ButtonConsumer.vue',
          'CompoundConsumer.ts',
        ],
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
    'PASS published List/Spin/QRCode/Statistic/Skeleton/Result/Button declarations: exact scopes, current tokens, native styles and compound exports; no test fixtures shipped',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
