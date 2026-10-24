import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSlotInventory } from '../../docs/audit/tools/content-slot-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('slot inventory follows imported aliases/inheritance and separates config/data/protocol from content candidates', () => {
  const uiRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-slot-inventory-'));
  const write = (file, text) => {
    const target = path.join(uiRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  };
  try {
    write('nodes.ts', 'export type VNodeChild = string | number;');
    write(
      'widget/interface.ts',
      `import type { VNodeChild as Content } from '../nodes';
      type Rich = Content;
      export interface BaseProps { title?: Rich }
      export interface WidgetProps extends BaseProps {
        extra?: ReadonlyArray<Content>;
        render?: (n: number) => Content;
        inspect?: (node: Content) => void;
        items?: Item[];
        config?: { label: Content };
        /** @deprecated legacy */ old?: Content;
      }
      export interface Item { label: Content }
      export interface WidgetSlots { title?: () => Content }
    `,
    );
    write('widget/Widget.vue', '<template><slot name="title" /></template>');
    write(
      'widget/demo/basic.vue',
      '<template><Widget><template #title>Title</template></Widget></template>',
    );
    const result = buildSlotInventory({ repoRoot: ROOT, uiRoot });
    const rows = result.rows.filter((row) => row.owner === 'WidgetProps');
    assert.deepEqual(
      rows.map((row) => row.prop),
      ['config', 'extra', 'old', 'render', 'title'],
    );
    assert.equal(rows.find((row) => row.prop === 'config').category, 'configuration');
    assert.equal(rows.find((row) => row.prop === 'old').decision, 'skip');
    assert.equal(rows.find((row) => row.prop === 'render').category, 'render-function-candidate');
    const title = rows.find((row) => row.prop === 'title');
    assert.equal(title.slotRuntime.status, 'source-reference');
    assert.equal(title.slotType.status, 'source-reference');
    assert.equal(title.slotDemo.status, 'source-reference');
    assert.equal(title.decision, 'review');
    assert.equal(result.rows.find((row) => row.owner === 'Item').decision, 'keep-data');
    assert.equal(result.rows.find((row) => row.owner === 'WidgetSlots').decision, 'skip');
  } finally {
    fs.rmSync(uiRoot, { recursive: true, force: true });
  }
});

test('slot inventory CLI check is read-only and drift fails with a nonzero status', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-slot-check-'));
  const output = path.join(dir, 'inventory.json');
  const tool = path.join(ROOT, 'docs/audit/tools/content-slot-inventory.mjs');
  const run = (...args) =>
    spawnSync(process.execPath, [tool, '--output', output, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  try {
    assert.equal(run().status, 0);
    const before = fs.readFileSync(output, 'utf8');
    assert.equal(run('--check').status, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), before);
    fs.writeFileSync(output, '{}\n');
    assert.notEqual(run('--check').status, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), '{}\n');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
