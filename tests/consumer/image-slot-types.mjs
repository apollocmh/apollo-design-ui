/** Native Image thumbnail slots against published exports. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-image-slot-types-'));
try {
  assert.ok(fs.existsSync(path.join(root, 'packages/ui/dist/image/index.d.ts')), 'Build UI first');
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/image/__tests__')), false);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/image/demo/image-render.vue'),
    path.join(temp, 'ImageDemo.vue'),
  );
  const exact = fs.readFileSync(
    path.join(root, 'packages/ui/src/image/__tests__/fixtures/ImageSlot.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ExactImage.vue'),
    exact.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  const fixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/ImageRender.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ImageRender.vue'),
    fixture.replace('../../../packages/ui/src/image/demo/image-render.vue', './ImageDemo.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/image/demo/style-class.vue'),
    path.join(temp, 'ImageStyleDemo.vue'),
  );
  const styleFixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/ImageStyles.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ImageStyles.vue'),
    styleFixture.replace(
      '../../../packages/ui/src/image/demo/style-class.vue',
      './ImageStyleDemo.vue',
    ),
  );
  const providerFixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/ImageProvider.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ImageProvider.vue'),
    providerFixture.replace(
      '../../../packages/ui/src/image/demo/style-class.vue',
      './ImageStyleDemo.vue',
    ),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/ImagePrefix.vue'),
    path.join(temp, 'ImagePrefix.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'tests/browser/fixtures/ImagePreviewFocus.vue'),
    path.join(temp, 'ImagePreviewFocus.vue'),
  );
  const nativeEventFixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/ImageNativeEvents.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ImageNativeEvents.vue'),
    nativeEventFixture.replace(
      '../../../packages/ui/src/image/demo/image-render.vue',
      './ImageDemo.vue',
    ),
  );
  const exactNativeEvents = fs.readFileSync(
    path.join(root, 'packages/ui/src/image/__tests__/fixtures/ImageNativeEvents.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ExactNativeEvents.vue'),
    exactNativeEvents.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/image/demo/controlled-preview.vue'),
    path.join(temp, 'ControlledImageDemo.vue'),
  );
  fs.copyFileSync(
    path.join(root, 'packages/ui/src/image/demo/preview-group-visible.vue'),
    path.join(temp, 'ControlledGroupDemo.vue'),
  );
  const modelFixture = fs.readFileSync(
    path.join(root, 'tests/browser/fixtures/ImageOpenModel.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ImageOpenModel.vue'),
    modelFixture
      .replace(
        '../../../packages/ui/src/image/demo/controlled-preview.vue',
        './ControlledImageDemo.vue',
      )
      .replace(
        '../../../packages/ui/src/image/demo/preview-group-visible.vue',
        './ControlledGroupDemo.vue',
      ),
  );
  const exactOpenModel = fs.readFileSync(
    path.join(root, 'packages/ui/src/image/__tests__/fixtures/ImageOpenModel.vue'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(temp, 'ExactOpenModel.vue'),
    exactOpenModel.replace("from '../../../index'", "from '@apollo-design/ui'"),
  );
  fs.writeFileSync(
    path.join(temp, 'Types.ts'),
    `import type { ImageProps, ImageSlots, PreviewConfig } from '@apollo-design/ui';
const slots: ImageSlots = { imageRender: ({ originNode, src }) => src ? originNode : null };
// @ts-expect-error Top-level function props migrate directly to native slots.
const old: ImageProps = { imageRender: () => null };
const preview: PreviewConfig = { imageRender: ({ originNode }) => originNode };
void [slots, old, preview];`,
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
    'PASS published Image: exact native slot info, VNode origin/optional src, current templates and native root style demo/fixture, unknown-slot/old-function rejection and untouched preview config type; no source aliases/test declarations',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
