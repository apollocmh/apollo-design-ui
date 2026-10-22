/** 复审 002：验证消费侧时序修正没有改变原有 expect 断言。仓库根目录运行。 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';

const base = '80876821';
const paths = execFileSync('git', ['diff', base, '--name-only'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((file) =>
    /^packages\/ui\/src\/(date-picker|time-picker|color-picker|dropdown|back-top)\/__tests__\/.*\.test\.ts$/.test(
      file,
    ),
  );
const printer = ts.createPrinter({ removeComments: true });
function assertions(source, file) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const result = [];
  function visit(node) {
    if (ts.isExpressionStatement(node) && node.getText(tree).startsWith('expect(')) {
      result.push(printer.printNode(ts.EmitHint.Unspecified, node, tree));
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result;
}
assert.equal(paths.length, 14, 'The audit must cover all 14 consumer test files');
let count = 0;
for (const file of paths) {
  const before = execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
  const original = assertions(before, file);
  assert.deepEqual(assertions(fs.readFileSync(file, 'utf8'), file), original, file);
  count += original.length;
}
assert.equal(count, 457);
console.log(`Assertion audit: ${paths.length} files, ${count} original assertions unchanged`);
