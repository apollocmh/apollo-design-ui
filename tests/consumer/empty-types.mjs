/** All six real demos and precise Empty declarations against published exports, without source aliases. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-empty-types-'));
try {
  assert.ok(fs.existsSync(path.join(root, 'packages/ui/dist/empty/index.d.ts')));
  assert.equal(fs.existsSync(path.join(root, 'packages/ui/dist/empty/__tests__')), false);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const demos = fs
    .readdirSync(path.join(root, 'packages/ui/src/empty/demo'))
    .filter((f) => f.endsWith('.vue'));
  assert.equal(demos.length, 6);
  for (const demo of demos)
    fs.copyFileSync(path.join(root, 'packages/ui/src/empty/demo', demo), path.join(temp, demo));
  fs.writeFileSync(
    path.join(temp, 'Contracts.ts'),
    `
import { Empty, ConfigProvider, type EmptySlots, type EmptyProps, type EmptyConfig, type EmptyRef, type ConfigProviderProps } from '@apollo-design/ui';
import { Empty as DeepEmpty, type EmptySlots as DeepSlots } from '@apollo-design/ui/empty';
import { h } from 'vue';
type IsAny<T> = 0 extends (1 & T) ? true : false;
const exactComponent: IsAny<typeof Empty> = false;
const exactStatic: IsAny<typeof Empty.PRESENTED_IMAGE_SIMPLE> = false;
const deep: typeof Empty = DeepEmpty;
const content = [h('span', 'Image'), 0, false];
const image: EmptyProps['image'] = content;
const slots: EmptySlots = { image: () => content, description: () => [h('span', 'Description'), h('strong', 'Tail')], default: () => h('button', 'Create') };
const deepSlots: DeepSlots = slots;
const config: EmptyConfig = { image: Empty.PRESENTED_IMAGE_SIMPLE, styles: { description: { fontWeight: 600 } } };
const provider: ConfigProviderProps = { components: { empty: config } };
const typedConfig = h(ConfigProvider, provider, () => h(Empty));
declare const instance: InstanceType<typeof Empty>;
const exposed: EmptyRef = instance;
const native: HTMLDivElement | null = instance.nativeElement;
// @ts-expect-error Empty supports exactly image, description and default slots.
const badSlot: EmptySlots = { body: () => [] };
// @ts-expect-error Provider style retains its CSSProperties contract.
const badStyle: EmptyConfig = { style: 'color: red' };
// @ts-expect-error Finite config fields reject misspellings.
const badConfig: EmptyConfig = { images: false };
// @ts-expect-error Empty has no fabricated focus method.
instance.focus();
void [exactComponent, exactStatic, deep, image, slots, deepSlots, config, provider, typedConfig, exposed, native, badSlot, badStyle, badConfig];
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
    'PASS published Empty: six real demos, named Provider configuration, exact root/deep/static/ref/slot declarations and negative API cases; no source aliases',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
