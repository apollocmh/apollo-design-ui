/**
 * 一次性补丁：tooltip 的 registry 状态与 notes。
 */
import fs from 'node:fs';

const p = 'registry/components.json';
let s = fs.readFileSync(p, 'utf8');

// 用组件对象边界做替换（tooltip 条目从 "name": "tooltip" 到下一个 "name": "splitter" 之前）
const start = s.indexOf('"name": "tooltip"');
const end = s.indexOf('"name": "splitter"', start);
if (start < 0 || end < 0) {
  console.log('bounds miss');
  process.exit(1);
}
let seg = s.slice(start, end);
seg = seg.replace('"status": "todo"', '"status": "completed"');
for (const key of [
  'antdApiStatus',
  'apiStatus',
  'compatStatus',
  'tokenStatus',
  'styleStatus',
  'unitStatus',
  'interactionStatus',
  'typeStatus',
  'a11yStatus',
  'visualStatus',
  'docsStatus',
]) {
  seg = seg.replace(`"${key}": "todo"`, `"${key}": "done"`);
}
seg = seg.replace(
  '"notes": null',
  '"notes": "Trigger 基建首个消费者：_internal/trigger.ts 组装 overlay+position+portal+motion（15 个下游共用）。样式 76 条 SSR 产物机械转换 + 4 个 keyframes 手抄（SSR 不吐）。L6 9/9 0.000% exact（含 portal 浮层定位）。差异 D77–D82（COMPATIBILITY §9.2）。测试基建：VTU teleport-stub 会重挂子树 ⇒ 必须 stubs.teleport=false；screenshotElement 需等 rc-motion 的 motionDeadline（stabilize.mjs 1100ms）。"',
);
s = s.slice(0, start) + seg + s.slice(end);
fs.writeFileSync(p, s);
console.log('tooltip registry updated');
